import { readFile, writeFile, readdir, cp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

const project = resolve(import.meta.dirname, '..');
const publicDir = join(project, 'site');
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const meta = (html, name) => decode(html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`))?.[1] || '');
const displayDate = (value, options = { day: '2-digit', month: 'short', year: 'numeric' }) => new Date(value).toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' });
const replaceBetween = (html, marker, content) => {
  const pattern = new RegExp(`<!-- ${marker}_START -->[\\s\\S]*?<!-- ${marker}_END -->`);
  if (!pattern.test(html)) throw new Error(`${marker} markers are missing from index.html`);
  return html.replace(pattern, `<!-- ${marker}_START -->\n${content}${content ? '\n' : ''}<!-- ${marker}_END -->`);
};

const posts = [];
for (const filename of (await readdir(join(publicDir, 'blog'))).sort()) {
  if (!filename.endsWith('.html')) continue;
  if (!/^[a-z0-9-]+\.html$/.test(filename)) throw new Error(`Use a simple lowercase filename: ${filename}`);
  const path = join(publicDir, 'blog', filename);
  let html = await readFile(path, 'utf8');
  if (meta(html, 'blog-status') === 'draft') continue;
  const title = meta(html, 'blog-title'), log = meta(html, 'log-id'), date = meta(html, 'blog-date');
  if (!title || !/^\d{3}$/.test(log) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error(`Missing or invalid blog metadata: ${filename}`);
  if (html.includes('{{')) throw new Error(`Unfilled template fields: ${filename}`);
  const prose = html.match(/<article\b[^>]*class="prose"[^>]*>([\s\S]*?)<\/article>/)?.[1];
  if (!prose) throw new Error(`Missing article prose: ${filename}`);
  const words = prose.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(words / 210));
  html = html.replace(/(<span data-reading-time>)[^<]*(<\/span>)/, `$1${readingTime} min read$2`);
  await writeFile(path, html);
  posts.push({ title, log, date, tags: meta(html, 'blog-tags'), description: meta(html, 'description'), readingTime, url: `/blog/${filename}` });
}
if (new Set(posts.map(post => post.log)).size !== posts.length) throw new Error('Each post needs a unique log number');
posts.sort((a, b) => b.date.localeCompare(a.date) || b.log.localeCompare(a.log));
await writeFile(join(publicDir, 'data/posts.json'), JSON.stringify(posts, null, 2) + '\n');

// Compact, real HTML links keep the writing index readable without JavaScript.
const blogIndex = posts.map((post, index) => `        <a class="post-card" href="${escape(post.url)}" data-reveal style="--i:${index}">
          <div class="post-number"><span>Log</span><strong>${post.log}</strong></div>
          <div class="post-body">
            <div class="post-meta"><time datetime="${post.date}">${displayDate(post.date + 'T12:00:00Z')}</time><span>${post.readingTime} min read</span></div>
            <h3>${escape(post.title)}</h3>
            <p>${escape(post.description)}</p>
          </div>
          <span class="post-open">Read <span class="chev" aria-hidden="true">›</span></span>
        </a>`).join('\n');

const indexPath = join(publicDir, 'index.html');
let indexHtml = replaceBetween(await readFile(indexPath, 'utf8'), 'BLOG_INDEX', blogIndex);
if (posts.length) indexHtml = indexHtml.replace(/(<div class="announce">[\s\S]*?<a href=")[^"]*("><span class="announce-tag">New log<\/span><span class="announce-text">)[^<]*(<\/span>)/, (_, before, middle, after) => `${before}${escape(posts[0].url)}${middle}${escape(posts[0].title)}${after}`);

// Newly indexed papers come from the refreshed (or snapshot) Scholar feed.
const scholar = JSON.parse(await readFile(join(publicDir, 'data/scholar.json'), 'utf8'));
const titleKey = title => decode(title.replace(/<[^>]+>/g, '')).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
const curatedHtml = indexHtml.replace(/<!-- SCHOLAR_NEW_START -->[\s\S]*?<!-- SCHOLAR_NEW_END -->/, '');
const curated = new Set([...curatedHtml.matchAll(/<a class="paper-title"[^>]*>([\s\S]*?)<\/a>/g)].map(match => titleKey(match[1])));
const newestCurated = Math.max(...[...curatedHtml.matchAll(/data-date="(\d{4})-/g)].map(match => Number(match[1])));
const fresh = scholar.publications.filter(paper => Number(paper.year) >= newestCurated && !curated.has(titleKey(paper.title)));
indexHtml = replaceBetween(indexHtml, 'SCHOLAR_NEW', fresh.length ? `      <div class="fresh" data-reveal>
        <p class="fresh-head">New on Google Scholar · not yet filed into a cluster</p>
        <ul>
${fresh.map(paper => `          <li class="paper">
            <div class="paper-meta"><span class="paper-venue">${escape(paper.venue || paper.year)}</span></div>
            <p class="paper-title-row"><a class="paper-title" href="${escape(paper.url)}" target="_blank" rel="noopener noreferrer">${escape(paper.title)} <span class="arr" aria-hidden="true">↗</span></a></p>
            <p class="authors">${escape(paper.authors).replace(/S\.? Siriwardhana/g, match => `<strong class="me">${match}</strong>`)}</p>
          </li>`).join('\n')}
        </ul>
      </div>` : '');
await writeFile(indexPath, indexHtml);

// Publish authored HTML and assets as a conventional static GitHub Pages artifact.
const outputDir = join(project, '_site');
await rm(outputDir, { recursive: true, force: true });
await cp(publicDir, outputDir, { recursive: true });
const pages = ['index.html', '404.html'];
for (const filename of await readdir(join(outputDir, 'blog'))) {
  if (!filename.endsWith('.html')) continue;
  const path = join(outputDir, 'blog', filename);
  if (meta(await readFile(path, 'utf8'), 'blog-status') === 'draft') await rm(path); else pages.push(`blog/${filename}`);
}
// Fingerprint the stylesheet and script so a redeploy never mixes old assets with new pages.
const fingerprint = async file => createHash('sha256').update(await readFile(join(outputDir, file))).digest('hex').slice(0, 10);
const versionedAssets = (await readdir(join(outputDir, 'assets'))).filter(file => /\.(css|js)$/.test(file));
const versions = Object.fromEntries(await Promise.all(versionedAssets.map(async file => [`assets/${file}`, await fingerprint(`assets/${file}`)])));
for (const page of pages) {
  const path = join(outputDir, page);
  let html = await readFile(path, 'utf8');
  for (const [asset, version] of Object.entries(versions)) html = html.replace(new RegExp(`/${asset.replace('.', '\\.')}(\\?v=[^"']*)?`, 'g'), `/${asset}?v=${version}`);
  await writeFile(path, html);
}
await writeFile(join(outputDir, '.nojekyll'), '');
console.log(JSON.stringify({ posts: posts.length, readingTime: posts.map(p => ({ log: p.log, minutes: p.readingTime })), scholar: { source: scholar.source, fetchedAt: scholar.fetchedAt, uncurated: fresh.length }, output: '_site' }));
