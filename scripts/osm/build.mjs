#!/usr/bin/env node
/**
 * Step 2 of the data build: turn the raw OpenStreetMap download into the compact
 * SQLite database that ships inside the app (assets/data/places.db).
 *
 *   node scripts/osm/build.mjs
 *
 * Uses Node's built-in SQLite (node:sqlite), so no extra packages are needed.
 * Data © OpenStreetMap contributors, ODbL. The resulting database is a derived
 * database and is also available under the ODbL (see README).
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RAW = join(ROOT, 'data', 'osm-raw');
const OUT_DB = join(ROOT, 'assets', 'data', 'places.db');
const OUT_VERSION = join(ROOT, 'src', 'services', 'places', 'osm', 'data-version.ts');

/* ------------------------------------------------------------------ */
/* Controlled vocabulary: which OSM tags become which app categories.  */
/* price = typical level, shown in the app as an estimate.             */
/* ------------------------------------------------------------------ */
const CATEGORIES = [
  // code, osm tag test,                         key,           label,               group,   price
  [1, (t) => t.amenity === 'restaurant', 'restaurant', 'Restaurant', 'eat', null],
  [2, (t) => t.amenity === 'cafe', 'cafe', 'Café', 'eat', 'moderate'],
  [3, (t) => t.amenity === 'fast_food', 'fast_food', 'Fast food', 'eat', 'inexpensive'],
  [4, (t) => t.amenity === 'food_court', 'food_court', 'Food court', 'eat', 'inexpensive'],
  [5, (t) => t.amenity === 'ice_cream', 'ice_cream', 'Ice cream', 'eat', 'inexpensive'],
  [6, (t) => t.shop === 'bakery' || t.shop === 'pastry', 'bakery', 'Bakery', 'eat', 'inexpensive'],
  [20, (t) => t.tourism === 'museum', 'museum', 'Museum', 'goOut', 'inexpensive'],
  [21, (t) => t.tourism === 'gallery', 'gallery', 'Art gallery', 'goOut', 'inexpensive'],
  [22, (t) => t.tourism === 'viewpoint', 'viewpoint', 'Viewpoint', 'goOut', 'free'],
  [23, (t) => t.tourism === 'zoo', 'zoo', 'Zoo', 'goOut', 'moderate'],
  [24, (t) => t.tourism === 'aquarium', 'aquarium', 'Aquarium', 'goOut', 'moderate'],
  [25, (t) => t.tourism === 'theme_park' || t.leisure === 'water_park', 'theme_park', 'Theme park', 'goOut', 'expensive'],
  [26, (t) => t.leisure === 'park', 'park', 'Park', 'goOut', 'free'],
  [27, (t) => t.leisure === 'garden', 'garden', 'Garden', 'goOut', 'free'],
  [28, (t) => t.amenity === 'cinema', 'cinema', 'Cinema', 'goOut', 'moderate'],
  [29, (t) => t.leisure === 'bowling_alley', 'bowling', 'Bowling alley', 'goOut', 'moderate'],
  [30, (t) => t.shop === 'mall', 'mall', 'Shopping mall', 'goOut', 'free'],
  [31, (t) => t.amenity === 'arts_centre', 'arts_centre', 'Arts centre', 'goOut', null],
  [32, (t) => t.natural === 'beach', 'beach', 'Beach', 'goOut', 'inexpensive'],
  [33, (t) => t.waterway === 'waterfall', 'waterfall', 'Waterfall', 'goOut', 'inexpensive'],
  [34, (t) => t.natural === 'hot_spring', 'hot_spring', 'Hot spring', 'goOut', 'inexpensive'],
  [35, (t) => t.tourism === 'attraction', 'attraction', 'Attraction', 'goOut', null],
];

/** Well-known Philippine chains with a typical price level (a controlled, reviewable list). */
const BRANDS = {
  inexpensive: [
    'Jollibee', "McDonald's", 'Chowking', 'Mang Inasal', 'Greenwich', 'KFC', 'Burger King', 'Goldilocks',
    'Red Ribbon', 'Tokyo Tokyo', 'Potato Corner', 'Angel\'s Burger', 'Minute Burger', "Andok's", 'Baliwag',
    "Dunkin'", 'Dunkin Donuts', 'Siomai House', 'Hap Chan', 'Lugaw Republic', "Wendy's", 'Shawarma Shack',
  ],
  moderate: [
    'Starbucks', "Max's", "Shakey's", 'Pizza Hut', 'Yellow Cab', 'Kenny Rogers', 'Bonchon', 'Army Navy',
    'The Coffee Bean & Tea Leaf', 'Coffee Bean', 'Tim Hortons', "Seattle's Best", 'Kuya J', "Gerry's",
    "Conti's", 'Cabalen', "Dencio's", 'Sbarro', 'Pancake House', 'Mary Grace', 'Yabu', 'Ippudo', 'Tokyo Tokyo',
    "Zark's", 'J.CO', 'Krispy Kreme', 'Tropical Hut', 'Classic Savory', 'Chooks-to-Go',
  ],
  expensive: ['Vikings', 'Din Tai Fung', 'Wildflour', 'Mesa', 'Spiral'],
};

/** Must stay identical to foldForSearch() in src/utils/text.ts, so app searches match what's stored. */
const FOLD = { á: 'a', à: 'a', â: 'a', ä: 'a', ã: 'a', å: 'a', é: 'e', è: 'e', ê: 'e', ë: 'e', í: 'i', ì: 'i', î: 'i', ï: 'i', ó: 'o', ò: 'o', ô: 'o', ö: 'o', õ: 'o', ú: 'u', ù: 'u', û: 'u', ü: 'u', ñ: 'n', ç: 'c' };
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[^\u0000-\u007f]/g, (ch) => FOLD[ch] ?? ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const brandIndex = Object.entries(BRANDS).flatMap(([level, names]) => names.map((n) => [norm(n), n, level]));
function matchBrand(tags) {
  const candidates = [tags.brand, tags.name].filter(Boolean).map(norm);
  for (const c of candidates) {
    for (const [key, display, level] of brandIndex) {
      if (c === key || c.startsWith(`${key} `)) return { display, level };
    }
  }
  return undefined;
}

/**
 * Photo links we can legally show: Wikimedia Commons files and categories, and
 * Wikidata items (which can point to Commons). Links to other websites are
 * skipped because their licence is unknown. Returns e.g. "Category:Rizal Park|wikidata:Q123".
 */
function photoRefs(t) {
  const refs = [];
  const commons = t.wikimedia_commons?.trim();
  if (commons && /^(File|Category):/i.test(commons)) refs.push(commons.replace(/^file:/i, 'File:').replace(/^category:/i, 'Category:'));
  const image = t.image?.trim();
  if (image) {
    const page = image.match(/commons\.wikimedia\.org\/wiki\/(File:[^?#]+)/i);
    const upload = image.match(/upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/i);
    if (/^File:/i.test(image)) refs.push(image);
    else if (page) refs.push(decodeURIComponent(page[1]).replace(/_/g, ' '));
    else if (upload) refs.push(`File:${decodeURIComponent(upload[1]).replace(/_/g, ' ')}`);
  }
  if (/^Q\d+$/.test(t.wikidata ?? '')) refs.push(`wikidata:${t.wikidata}`);
  return refs.length ? [...new Set(refs)].join('|') : null;
}

function readGroup(name) {
  const file = join(RAW, `${name}.json`);
  if (!existsSync(file)) throw new Error(`Missing ${file}. Run: node scripts/osm/fetch.mjs`);
  return JSON.parse(readFileSync(file, 'utf8')).elements;
}

const coords = (e) => (e.type === 'node' ? { lat: e.lat, lng: e.lon } : e.center ? { lat: e.center.lat, lng: e.center.lon } : undefined);
const shortId = (e) => `${e.type[0]}${e.id}`;
const dist = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const h =
    Math.sin(toRad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};

function isExcluded(t) {
  return (
    ['private', 'no'].includes(t.access) ||
    t.disused === 'yes' ||
    t.abandoned === 'yes' ||
    t.opening_hours === 'closed' ||
    /\b(closed|permanently closed)\b/i.test(t.name ?? '') ||
    Object.keys(t).some((k) => k.startsWith('disused:') || k.startsWith('was:') || k.startsWith('abandoned:'))
  );
}

/* ------------------------------ places ------------------------------ */
const stats = { raw: 0, excluded: 0, uncategorized: 0, duplicates: 0 };
const places = [];
for (const group of ['eat', 'sights', 'leisure', 'nature']) {
  for (const e of readGroup(group)) {
    stats.raw++;
    const t = e.tags ?? {};
    const c = coords(e);
    if (!c || !t.name) continue;
    if (isExcluded(t)) {
      stats.excluded++;
      continue;
    }
    const cat = CATEGORIES.find(([, test]) => test(t));
    if (!cat) {
      stats.uncategorized++;
      continue;
    }
    const brand = matchBrand(t);
    const addr = [
      [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' '),
      t['addr:city'] ?? t['addr:municipality'],
    ]
      .filter(Boolean)
      .join(', ');
    places.push({
      id: shortId(e),
      name: t.name.trim(),
      cat: cat[0],
      lat: Math.round(c.lat * 1e6) / 1e6,
      lng: Math.round(c.lng * 1e6) / 1e6,
      cuisine: t.cuisine ?? null,
      hours: t.opening_hours ?? null,
      brand: brand?.display ?? t.brand ?? null,
      brand_price: brand?.level ?? null,
      addr: addr || null,
      contact: t.phone || t['contact:phone'] || t.website || t['contact:website'] || t['contact:facebook'] ? 1 : 0,
      website: t.website ?? t['contact:website'] ?? null,
      fee: t.fee ?? null,
      wheelchair: t.wheelchair ?? null,
      notable: t.wikidata || t.wikipedia ? 1 : 0,
      photo: photoRefs(t),
      detail: Object.keys(t).length,
    });
  }
}

// Merge duplicates: same normalized name and category within 60 m (e.g. a node and a building outline).
const byKey = new Map();
const kept = [];
for (const p of places.sort((a, b) => b.detail - a.detail)) {
  const key = `${p.cat}:${norm(p.name)}`;
  const near = (byKey.get(key) ?? []).find((q) => dist(p, q) < 60);
  if (near) {
    stats.duplicates++;
    continue;
  }
  byKey.set(key, [...(byKey.get(key) ?? []), p]);
  kept.push(p);
}

/* ------------------------------ areas ------------------------------- */
const KIND_RANK = { region: 1, province: 2, city: 3, town: 4, island: 5, suburb: 6, quarter: 6, village: 7, neighbourhood: 8 };
const areaNodes = readGroup('places')
  .filter((e) => e.tags?.name && e.tags.place)
  .map((e) => ({ id: shortId(e), name: e.tags.name.trim(), kind: e.tags.place, lat: e.lat, lng: e.lon, tags: e.tags }));
const towns = areaNodes.filter((a) => a.kind === 'city' || a.kind === 'town');

// Grid of towns for fast nearest-town lookups (0.25° cells).
const grid = new Map();
const cell = (lat, lng) => `${Math.floor(lat * 4)}:${Math.floor(lng * 4)}`;
for (const t of towns) grid.set(cell(t.lat, t.lng), [...(grid.get(cell(t.lat, t.lng)) ?? []), t]);
function nearestTown(p, exceptId) {
  let best;
  const [ci, cj] = [Math.floor(p.lat * 4), Math.floor(p.lng * 4)];
  for (let di = -1; di <= 1; di++)
    for (let dj = -1; dj <= 1; dj++)
      for (const t of grid.get(`${ci + di}:${cj + dj}`) ?? []) {
        if (t.id === exceptId) continue;
        const d = dist(p, t);
        if (!best || d < best.d) best = { t, d };
      }
  return best && best.d < 40000 ? best.t : undefined;
}

const areas = [];
for (const a of areaNodes) {
  let context;
  if (a.kind === 'city' || a.kind === 'town') {
    const isIn = a.tags['is_in:province'] ?? a.tags['addr:province'] ?? a.tags.is_in?.split(/[,;]/)[0];
    context = isIn && norm(isIn) !== norm(a.name) ? isIn.trim() : a.kind === 'city' ? 'City' : 'Town';
  } else {
    // The listing's own city tag means "inside"; otherwise we only know the nearest town, so say "near".
    const own = a.tags['addr:city'] ?? a.tags['is_in:city'] ?? a.tags['is_in:municipality'];
    const town = own ? undefined : nearestTown(a, a.id);
    context = own ? own.trim() : town ? `near ${town.name}` : a.kind === 'island' ? 'Island' : undefined;
  }
  areas.push({ ...a, context: context ?? null });
}
// Provinces and regions: their center can sit in the sea or mountains, so search from the nearest city or town instead.
// Optional: if this download failed (busy public server), the app still works; only province-name search is missing.
const regionElements = existsSync(join(RAW, 'regions.json')) ? readGroup('regions') : [];
if (regionElements.length === 0) console.warn('Note: regions.json missing, so provinces/regions are not searchable by name. Re-run fetch.mjs later, then build.mjs.');
// regions.json lists each province/region relation followed by its capital (or label) node.
const regionRows = [];
for (const e of regionElements) {
  if (e.type === 'relation') regionRows.push({ rel: e, anchor: undefined });
  else if (e.type === 'node' && regionRows.length && !regionRows.at(-1).anchor) {
    regionRows.at(-1).anchor = { lat: e.lat, lng: e.lon, name: e.tags?.name };
  }
}
for (const { rel, anchor } of regionRows) {
  if (!rel.tags?.name || !anchor) continue; // no capital or label point: skip rather than guess
  const kind = rel.tags.admin_level === '3' ? 'region' : 'province';
  const near = anchor.name ?? nearestTown(anchor)?.name;
  areas.push({
    id: shortId(rel),
    name: rel.tags.name.replace(/^Province of /i, '').trim(),
    kind,
    lat: anchor.lat,
    lng: anchor.lng,
    context: `${kind === 'region' ? 'Region' : 'Province'}${near ? `, searches around ${near}` : ''}`,
  });
}

/* ------------------------------ write ------------------------------- */
mkdirSync(dirname(OUT_DB), { recursive: true });
if (existsSync(OUT_DB)) rmSync(OUT_DB);
const db = new DatabaseSync(OUT_DB);
db.exec(`
  PRAGMA page_size = 4096;
  CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT) WITHOUT ROWID;
  CREATE TABLE categories (code INTEGER PRIMARY KEY, key TEXT NOT NULL, label TEXT NOT NULL, grp TEXT NOT NULL, price TEXT);
  CREATE TABLE places (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, cat INTEGER NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL,
    cuisine TEXT, hours TEXT, brand TEXT, brand_price TEXT, addr TEXT, contact INTEGER NOT NULL,
    website TEXT, fee TEXT, wheelchair TEXT, notable INTEGER NOT NULL, photo TEXT
  ) WITHOUT ROWID;
  CREATE TABLE areas (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, norm TEXT NOT NULL, kind TEXT NOT NULL, rank INTEGER NOT NULL,
    lat REAL NOT NULL, lng REAL NOT NULL, context TEXT
  ) WITHOUT ROWID;
`);
const fetchedAt = existsSync(join(RAW, 'fetched-at.txt')) ? readFileSync(join(RAW, 'fetched-at.txt'), 'utf8').trim() : new Date().toISOString();
// Date and time of the download plus the table layout version, e.g. 202611040842s2. Either one changing
// gives phones a new database file name, so they copy the new file instead of keeping the old one.
const SCHEMA_VERSION = 2; // 2: added places.photo
const version = `${fetchedAt.replace(/[-:T]/g, '').slice(0, 12)}s${SCHEMA_VERSION}`;
const insMeta = db.prepare('INSERT INTO meta VALUES (?, ?)');
insMeta.run('source', 'OpenStreetMap contributors (ODbL)');
insMeta.run('fetched_at', fetchedAt);
insMeta.run('version', version);
const insCat = db.prepare('INSERT INTO categories VALUES (?, ?, ?, ?, ?)');
for (const [code, , key, label, grp, price] of CATEGORIES) insCat.run(code, key, label, grp, price);

db.exec('BEGIN');
const insPlace = db.prepare('INSERT INTO places VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
for (const p of kept)
  insPlace.run(p.id, p.name, p.cat, p.lat, p.lng, p.cuisine, p.hours, p.brand, p.brand_price, p.addr, p.contact, p.website, p.fee, p.wheelchair, p.notable, p.photo);
const insArea = db.prepare('INSERT OR IGNORE INTO areas VALUES (?,?,?,?,?,?,?,?)');
for (const a of areas) insArea.run(a.id, a.name, norm(a.name), a.kind, KIND_RANK[a.kind] ?? 9, a.lat, a.lng, a.context);
db.exec('COMMIT');

// Spatial lookups use a latitude band, then longitude, then exact distance in the app.
db.exec(`
  CREATE INDEX places_lat_lng ON places (lat, lng);
  CREATE INDEX areas_norm ON areas (norm);
  ANALYZE;
  VACUUM;
`);
db.close();

writeFileSync(
  OUT_VERSION,
  `// Generated by scripts/osm/build.mjs. Changing this makes the app copy the new database on next launch.\nexport const OSM_DATA_VERSION = '${version}';\nexport const OSM_FETCHED_AT = '${fetchedAt}';\n`,
);

const counts = {};
for (const p of kept) {
  const label = CATEGORIES.find(([code]) => code === p.cat)[3];
  counts[label] = (counts[label] ?? 0) + 1;
}
console.log(`Raw elements: ${stats.raw}; excluded (private/closed/disused): ${stats.excluded}; uncategorized: ${stats.uncategorized}; duplicates merged: ${stats.duplicates}`);
console.log(`Places: ${kept.length} (${kept.filter((p) => p.photo).length} with a Wikimedia photo link)`);
console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}: ${v}`).join('\n'));
console.log(`Areas: ${areas.length} (${Object.entries(areas.reduce((m, a) => ((m[a.kind] = (m[a.kind] ?? 0) + 1), m), {})).map(([k, v]) => `${k} ${v}`).join(', ')})`);
console.log(`Database: ${OUT_DB.replace(ROOT + '/', '')} (${(statSync(OUT_DB).size / 1e6).toFixed(1)} MB), version ${version}`);
