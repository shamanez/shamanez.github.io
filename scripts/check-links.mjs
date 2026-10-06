// Checks every link in the built site: internal files and #anchors offline, external URLs over HTTP.
// Run `npm run build` first. Usage: npm run check:links [-- --offline]
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';

const site = resolve(import.meta.dirname, '..', '_site');
const offline = process.argv.includes('--offline');
// These hosts answer automated requests with 403/429/999 even when the page is fine in a browser.
const botWalled = ['linkedin.com', 'x.com', 'twitter.com', 'dl.acm.org', 'tandfonline.com', 'ieeexplore.ieee.org', 'scholar.google.com', 'medium.com'];

async function htmlFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path)); else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
const ids = html => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
const pages = new Map();
for (const file of await htmlFiles(site)) pages.set(file, await readFile(file, 'utf8'));

const external = new Map(), problems = [];
for (const [file, html] of pages) {
  const page = file.slice(site.length) || '/';
  for (const [, attribute, raw] of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    const url = decode(raw);
    if (/^(mailto|tel|data|javascript):/.test(url)) continue;
    if (/^https?:\/\//.test(url)) { if (!external.has(url)) external.set(url, new Set()); external.get(url).add(page); continue; }
    const [pathPart, hash] = url.split('#');
    let target = file;
    if (pathPart) {
      const clean = pathPart.split('?')[0];
      target = clean.startsWith('/') ? join(site, clean) : resolve(dirname(file), clean);
      if (target.endsWith('/')) target = join(target, 'index.html');
      try { if ((await stat(target)).isDirectory()) target = join(target, 'index.html'); await stat(target); }
      catch { problems.push(`${page}: missing ${attribute} target ${url}`); continue; }
    }
    if (hash && target.endsWith('.html')) {
      const targetHtml = pages.get(target) ?? await readFile(target, 'utf8');
      if (!ids(targetHtml).has(decodeURIComponent(hash))) problems.push(`${page}: missing anchor #${hash} in ${target.slice(site.length)}`);
    }
  }
}
console.log(`Internal links and anchors: ${problems.length ? `${problems.length} problem(s)` : 'all OK'}`);

const warnings = [];
if (!offline) {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36', Accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'en' };
  const check = async url => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(25000) });
        await response.body?.cancel();
        return { status: response.status, final: response.url };
      } catch (error) { if (attempt) return { status: 0, error: error.cause?.code || error.name }; }
    }
  };
  const queue = [...external.keys()];
  const results = new Map();
  await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) { const url = queue.shift(); results.set(url, await check(url)); } }));
  for (const url of [...external.keys()].sort()) {
    const { status, final, error } = results.get(url);
    const host = new URL(url).hostname.replace(/^www\./, '');
    const walled = botWalled.some(domain => host === domain || host.endsWith(`.${domain}`) || (final && new URL(final).hostname.endsWith(domain)));
    const line = `${status || error} ${url}${final && final !== url ? ` → ${final}` : ''}`;
    if (status >= 200 && status < 400) console.log(`  ok   ${line}`);
    else if (walled && [403, 429, 999].includes(status)) { warnings.push(line); console.log(`  bot  ${line}`); }
    else { problems.push(`${line} (linked from ${[...external.get(url)].join(', ')})`); console.log(`  FAIL ${line}`); }
  }
  console.log(`External URLs: ${external.size} checked, ${warnings.length} blocked automated checks (open these in a browser), ${problems.length} problem(s) overall`);
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
