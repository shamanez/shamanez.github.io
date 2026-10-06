import { readFile, writeFile } from 'node:fs/promises';
import { SCHOLAR_PROFILE, parseScholar } from './scholar.mjs';

const dataFile = new URL('../site/data/scholar.json', import.meta.url);
const publishedFeed = 'https://shamanez.github.io/data/scholar.json';
const fallback = JSON.parse(await readFile(dataFile, 'utf8'));

async function responseText(url, timeout) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeout),
    headers: { Accept: url === SCHOLAR_PROFILE ? 'text/html' : 'application/json' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > 1500000) throw new Error('Oversized response');
  return text;
}

function validSnapshot(data) {
  try {
    const profile = new URL(data.profile);
    return profile.protocol === 'https:' && profile.hostname === 'scholar.google.com'
      && profile.searchParams.get('user') === '8TAf2IMAAAAJ'
      && Number.isFinite(Date.parse(data.fetchedAt))
      && Date.parse(data.fetchedAt) <= Date.now()
      && Array.isArray(data.publications) && data.publications.length > 0
      && data.publications.length <= 12
      && data.publications.every(paper => typeof paper.title === 'string' && typeof paper.url === 'string');
  } catch { return false; }
}

let data;
try {
  const html = await responseText(SCHOLAR_PROFILE, 20000);
  data = {
    source: 'scholar',
    profile: SCHOLAR_PROFILE,
    fetchedAt: new Date().toISOString(),
    publications: parseScholar(html),
  };
  console.log(`Refreshed ${data.publications.length} verified Scholar records.`);
} catch {
  // Keep the last successful deployed records through an upstream outage.
  // The checked-in snapshot also supports the first deployment and offline builds.
  data = fallback;
  try {
    const previous = JSON.parse(await responseText(publishedFeed, 10000));
    if (validSnapshot(previous) && Date.parse(previous.fetchedAt) > Date.parse(data.fetchedAt)) data = previous;
  } catch {}
  data = { ...data, source: 'snapshot' };
  console.log(`Scholar unavailable; using the dated snapshot from ${data.fetchedAt}.`);
}
if (!validSnapshot(data)) throw new Error('No valid Scholar records available for publication');
await writeFile(dataFile, JSON.stringify(data, null, 2) + '\n');
