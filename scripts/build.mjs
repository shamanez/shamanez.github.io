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

// A generated dot-matrix cover per log: one hub, linked to three small worlds.
function cover(post) {
  let seed = Number(post.log) * 2654435761 >>> 0;
  const random = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hub = [356 + Math.round(random() * 24), 112 + Math.round(random() * 24)];
  const worlds = [[300, 206], [432, 196], [420, 50]].map(([x, y]) => [x + Math.round(random() * 16 - 8), y + Math.round(random() * 12 - 6)]);
  const cells = worlds.map(([x, y]) => Array.from({ length: 9 }, (_, i) => `<rect x="${x + (i % 3) * 6 - 7}" y="${y + Math.floor(i / 3) * 6 - 7}" width="4" height="4" fill="${random() > 0.55 ? '#85ed75' : 'rgba(255,255,255,.55)'}"/>`).join('')).join('');
  const links = worlds.map(([x, y]) => `<path d="M${hub[0]} ${hub[1]}L${x} ${y}" stroke="rgba(133,237,117,.55)" stroke-dasharray="3 4"/>`).join('');
  return `<svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice"><defs><pattern id="dots-log${post.log}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="1.4" height="1.4" fill="rgba(255,255,255,.13)"/></pattern></defs><rect width="480" height="270" fill="url(#dots-log${post.log})"/><text x="24" y="40" font-size="10.5" fill="rgba(255,255,255,.55)" letter-spacing="1.2">SHAMANE’S CORNER · LOG</text><text x="16" y="172" font-size="116" fill="#fff" letter-spacing="-6">${post.log}</text>${links}${cells}<rect x="${hub[0] - 6}" y="${hub[1] - 6}" width="12" height="12" fill="#85ed75"/><rect class="cover-pulse" x="${hub[0] - 13.5}" y="${hub[1] - 13.5}" width="27" height="27" fill="none" stroke="#85ed75" stroke-opacity=".5"/><text x="24" y="246" font-size="10" fill="rgba(255,255,255,.55)" letter-spacing="1.1">${escape(post.tags)}</text></svg>`;
}

// Real HTML links, so the writing index also works without JavaScript.
const blogIndex = posts.map((post, index) => `        <a class="post-card" href="${escape(post.url)}" data-reveal style="--i:${index}">
          <div class="post-cover" aria-hidden="true">${cover(post)}</div>
          <div class="post-body">
            <div class="post-meta"><span class="post-tag">Log ${post.log} · Shamane’s Corner</span><time datetime="${post.date}">${displayDate(post.date + 'T12:00:00Z')}</time></div>
            <h3>${escape(post.title)}</h3>
            <p>${escape(post.description)}</p>
            <span class="post-foot">${post.readingTime} min read · Read log ${post.log} <span class="chev" aria-hidden="true">›</span></span>
          </div>
        </a>`).join('\n');

const indexPath = join(publicDir, 'index.html');
let indexHtml = replaceBetween(await readFile(indexPath, 'utf8'), 'BLOG_INDEX', blogIndex);

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
const versions = { 'assets/style.css': await fingerprint('assets/style.css'), 'assets/site.js': await fingerprint('assets/site.js') };
for (const page of pages) {
  const path = join(outputDir, page);
  let html = await readFile(path, 'utf8');
  for (const [asset, version] of Object.entries(versions)) html = html.replace(new RegExp(`/${asset.replace('.', '\\.')}(\\?v=[^"']*)?`, 'g'), `/${asset}?v=${version}`);
  await writeFile(path, html);
}
await writeFile(join(outputDir, '.nojekyll'), '');
console.log(JSON.stringify({ posts: posts.length, readingTime: posts.map(p => ({ log: p.log, minutes: p.readingTime })), scholar: { source: scholar.source, fetchedAt: scholar.fetchedAt, uncurated: fresh.length }, output: '_site' }));
