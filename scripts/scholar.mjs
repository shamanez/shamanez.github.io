export const SCHOLAR_PROFILE = 'https://scholar.google.com/citations?user=8TAf2IMAAAAJ&hl=en&sortby=pubdate&pagesize=20';
function decodeEntities(value) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', hellip: '…' };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const number = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : '';
    }
    return entities[entity] ?? match;
  });
}
const clean = text => decodeEntities(text.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

export function parseScholar(html) {
  if (!html.includes('Shamane Siriwardhana')) throw new Error('Profile identity missing');
  const publications = [];
  for (const row of html.matchAll(/<tr\b[^>]*class="gsc_a_tr"[^>]*>([\s\S]*?)<\/tr>/g)) {
    const anchor = row[1].match(/<a\b([^>]*class="gsc_a_at"[^>]*)>([\s\S]*?)<\/a>/);
    if (!anchor) continue;
    const href = anchor[1].match(/href="([^"]+)"/);
    if (!href) continue;
    const url = new URL(decodeEntities(href[1]), 'https://scholar.google.com');
    if (url.hostname !== 'scholar.google.com' || url.protocol !== 'https:') continue;
    const details = [...row[1].matchAll(/<div class="gs_gray">([\s\S]*?)<\/div>/g)].map(match => clean(match[1]));
    const year = row[1].match(/<td class="gsc_a_y"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/);
    publications.push({ title: clean(anchor[2]), url: url.href, authors: details[0] || '', venue: details[1] || '', year: year ? clean(year[1]) : '' });
  }
  if (!publications.length) throw new Error('No usable Scholar records');
  return publications.slice(0, 12);
}

