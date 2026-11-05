#!/usr/bin/env node
/**
 * Live check of the photo service against Wikimedia Commons, using the app's own
 * code (Node runs the TypeScript file directly). Run: node scripts/check-photos.mjs
 */
const { fetchWikimediaPhotos } = await import('../src/services/photos/wikimedia.ts');
const samples = {
  'Baclaran Church': 'Category:Baclaran Church|wikidata:Q6978434',
  'Philippine Army Museum': 'wikidata:Q60767754',
  'Plaza Quezon (Taguig)': 'Category:Plaza Quezon (Taguig)|wikidata:Q124547582',
};
for (const [name, ref] of Object.entries(samples)) {
  const photos = await fetchWikimediaPhotos(ref);
  console.log(`${name}: ${photos.length} photo(s)`);
  for (const p of photos.slice(0, 2)) console.log(`  ${p.uri.slice(0, 80)}…\n    by ${p.attribution ?? '(no author listed)'} · ${p.license ?? '(no licence listed)'}`);
}
