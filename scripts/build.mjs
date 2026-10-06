import { readFile, writeFile, mkdir, readdir, cp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const project = resolve(import.meta.dirname, '..');
const publicDir = join(project, 'site');
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
const meta = (html, name) => decode(html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`))?.[1] || '');
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
posts.sort((a,b) => b.date.localeCompare(a.date) || b.log.localeCompare(a.log));
await writeFile(join(publicDir, 'data/posts.json'), JSON.stringify(posts, null, 2) + '\n');

// Generate real HTML links, so the blog index also works without JavaScript.
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const blogIndex = posts.map((post,index) => {
  const date = new Date(post.date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).toUpperCase();
  const title = index === 0 ? escape(post.title).replace(', ', ',<br>') : escape(post.title);
  return `<a class="${index===0?'featured-post':'post-row'}" href="${escape(post.url)}"><div class="post-index"><span>LOG</span><strong>${post.log}</strong>${index===0?'<span class="post-type">ESSAY</span>':''}</div><div class="post-copy"><p class="paper-label purple">${escape(post.tags)}</p><h3>${title}</h3><p>${escape(post.description)}</p><div class="post-meta"><time datetime="${post.date}">${date}</time><span>${post.readingTime} MIN READ</span><span class="read-post">[ Read Log ${post.log} ]</span></div></div>${index===0?'<div class="post-glyph" aria-hidden="true"><span>[</span><i>g<span>+</span>w</i><span>]</span></div>':''}</a>`;
}).join('\n');
const indexPath = join(publicDir, 'index.html');
const indexHtml = await readFile(indexPath,'utf8');
if (!indexHtml.includes('<!-- BLOG_INDEX_START -->')) throw new Error('Blog index markers are missing');
await writeFile(indexPath,indexHtml.replace(/<!-- BLOG_INDEX_START -->[\s\S]*?<!-- BLOG_INDEX_END -->/,`<!-- BLOG_INDEX_START -->\n${blogIndex}\n<!-- BLOG_INDEX_END -->`));

// Publish authored HTML and assets as a conventional static GitHub Pages artifact.
const outputDir = join(project, '_site');
await rm(outputDir, { recursive: true, force: true });
await cp(publicDir, outputDir, { recursive: true });
for (const filename of await readdir(join(outputDir, 'blog'))) {
  if (!filename.endsWith('.html')) continue;
  const path = join(outputDir, 'blog', filename);
  if (meta(await readFile(path, 'utf8'), 'blog-status') === 'draft') await rm(path);
}
await writeFile(join(outputDir, '.nojekyll'), '');
console.log(JSON.stringify({ posts: posts.length, readingTime: posts.map(p => ({ log: p.log, minutes: p.readingTime })), output: '_site' }));
