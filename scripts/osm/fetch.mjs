#!/usr/bin/env node
/**
 * Step 1 of the data build: download Philippine places from OpenStreetMap.
 *
 * Uses the free public Overpass API (no key, no billing). This runs on a developer
 * machine when the data needs refreshing, never inside the app. Results are cached
 * in data/osm-raw/ (ignored by git); re-running skips groups that are already cached
 * unless --force is passed.
 *
 *   node scripts/osm/fetch.mjs [--force]
 *
 * Overpass fair use: queries run one at a time with a pause between them.
 * Data © OpenStreetMap contributors, available under the ODbL.
 */
import { existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'osm-raw');
const FORCE = process.argv.includes('--force');

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const PH = 'area["ISO3166-1"="PH"][admin_level=2]->.ph;';

/** The controlled list of what we fetch. Every group requires a name: unnamed places can't be recommended. */
const GROUPS = {
  eat: `
    nwr["amenity"~"^(restaurant|cafe|fast_food|food_court|ice_cream)$"]["name"](area.ph);
    nwr["shop"~"^(bakery|pastry)$"]["name"](area.ph);`,
  sights: `
    nwr["tourism"~"^(museum|gallery|attraction|viewpoint|zoo|aquarium|theme_park)$"]["name"](area.ph);`,
  leisure: `
    nwr["leisure"~"^(park|garden|water_park|bowling_alley)$"]["name"](area.ph);
    nwr["amenity"~"^(cinema|arts_centre)$"]["name"](area.ph);
    nwr["shop"="mall"]["name"](area.ph);`,
  nature: `
    nwr["natural"~"^(beach|hot_spring)$"]["name"](area.ph);
    nwr["waterway"="waterfall"]["name"](area.ph);`,
  places: `
    node["place"~"^(city|town|village|suburb|quarter|neighbourhood|island)$"]["name"](area.ph);`,
};

/**
 * Provinces and regions: ask for each one's capital (admin_centre) or label point instead of
 * computing the centre of its whole outline, which is much lighter for the shared server.
 * Output order: each relation, followed by its capital/label node.
 */
const REGIONS_QL = `[out:json][timeout:900];${PH}
  rel["boundary"="administrative"]["admin_level"~"^(3|4)$"]["name"](area.ph);
  foreach->.r(.r out tags; node(r.r:"admin_centre"); out; node(r.r:"label"); out;);`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function query(name, body, customQl) {
  const ql = customQl ?? `[out:json][timeout:900];${PH}(${body});out center tags qt;`;
  for (const endpoint of ENDPOINTS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const started = Date.now();
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'nugagawen-data-build/1.0' },
          body: new URLSearchParams({ data: ql }),
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        const json = JSON.parse(text);
        if (json.remark && /runtime error|timed out|out of memory/i.test(json.remark)) throw new Error(json.remark);
        // An empty answer for a whole country means the server failed quietly, not that there's no data.
        if (!json.elements?.length) throw new Error('empty result');
        console.log(`  ${name}: ${json.elements.length} elements from ${new URL(endpoint).host} in ${((Date.now() - started) / 1000).toFixed(0)} s`);
        return text;
      } catch (error) {
        console.warn(`  ${name}: ${new URL(endpoint).host} attempt ${attempt} failed: ${error.message}`);
        await sleep(15000 * attempt);
      }
    }
  }
  throw new Error(`All Overpass endpoints failed for "${name}"`);
}

mkdirSync(OUT, { recursive: true });
console.log('Fetching OpenStreetMap data for the Philippines…');
for (const [name, body] of [...Object.entries(GROUPS), ['regions', null]]) {
  const file = join(OUT, `${name}.json`);
  if (existsSync(file) && statSync(file).size > 1000 && !FORCE) {
    console.log(`  ${name}: cached (${(statSync(file).size / 1e6).toFixed(1)} MB), skipping`);
    continue;
  }
  const text = await query(name, body, name === 'regions' ? REGIONS_QL : undefined);
  writeFileSync(file, text);
  await sleep(5000); // be polite to the shared public server
}
writeFileSync(join(OUT, 'fetched-at.txt'), new Date().toISOString());
console.log('Done. Next: node scripts/osm/build.mjs');
