/**
 * The controlled search over the bundled OpenStreetMap database.
 *
 * Written against a tiny `Runner` (run SQL, get rows) so the app (expo-sqlite)
 * and the tests (Node's built-in SQLite) execute exactly the same logic.
 * Everything here is local: no network requests.
 */
import type { Activity, LatLng, Place, PlaceDetails, SearchArea } from '@/types';
import { distanceMeters } from '@/utils/format';
import { foldForSearch } from '@/utils/text';
import type { AreaSuggestion } from '../types';
import { areaLabel, rowToArea, rowToDetails, rowToPlace, type OsmAreaRow, type OsmCategoryRow, type OsmPlaceRow } from './mapping';

export type Runner = <T>(sql: string, params: (string | number)[]) => Promise<T[]>;
export type Categories = Map<number, OsmCategoryRow>;

/** Hard limits that keep every search fast and predictable on budget phones. */
export const LIMITS = {
  maxRadiusMeters: 10000,
  /** Nearest places handed to the ranking step. */
  maxCandidates: 600,
  maxAreaSuggestions: 8,
} as const;

export async function loadCategories(run: Runner): Promise<Categories> {
  const rows = await run<OsmCategoryRow>('SELECT code, key, label, grp, price FROM categories', []);
  return new Map(rows.map((r) => [r.code, r]));
}

const PLACE_COLUMNS = 'p.id, p.name, p.cat, p.lat, p.lng, p.cuisine, p.hours, p.brand, p.brand_price, p.addr, p.contact, p.website, p.fee, p.wheelchair, p.notable, p.photo, p.phone';

/** Places within the radius, nearest first, for the chosen activity. */
export async function queryNearby(
  run: Runner,
  categories: Categories,
  query: { center: LatLng; radiusMeters: number; activity: Activity },
  now: Date = new Date(),
): Promise<Place[]> {
  const radius = Math.min(query.radiusMeters, LIMITS.maxRadiusMeters);
  const { latitude, longitude } = query.center;
  const dLat = radius / 111320;
  const dLng = radius / (111320 * Math.cos((latitude * Math.PI) / 180));
  const groupFilter = query.activity === 'anything' ? '' : 'AND c.grp = ?';
  const params: (string | number)[] = [latitude - dLat, latitude + dLat, longitude - dLng, longitude + dLng];
  if (query.activity !== 'anything') params.push(query.activity);

  const rows = await run<OsmPlaceRow>(
    `SELECT ${PLACE_COLUMNS} FROM places p JOIN categories c ON c.code = p.cat
     WHERE p.lat BETWEEN ? AND ? AND p.lng BETWEEN ? AND ? ${groupFilter}`,
    params,
  );
  return rows
    .map((row) => ({ row, d: distanceMeters(query.center, { latitude: row.lat, longitude: row.lng }) }))
    .filter(({ d }) => d <= radius)
    .sort((a, b) => a.d - b.d)
    .slice(0, LIMITS.maxCandidates)
    .flatMap(({ row }) => {
      const category = categories.get(row.cat);
      return category ? [rowToPlace(row, category, now)] : [];
    });
}

export async function queryDetails(run: Runner, categories: Categories, id: string, now: Date = new Date()): Promise<PlaceDetails | undefined> {
  const [row] = await run<OsmPlaceRow>(`SELECT ${PLACE_COLUMNS} FROM places p WHERE p.id = ?`, [id]);
  const category = row ? categories.get(row.cat) : undefined;
  return row && category ? rowToDetails(row, category, now) : undefined;
}

/**
 * Area search: every typed word must start a word in the area's name or its
 * context ("poblacion mak" finds Poblacion, Makati). Exact names first, then
 * bigger places (province, city) before barangays, then nearest to `near`.
 */
export async function queryAreas(run: Runner, input: string, near?: LatLng): Promise<AreaSuggestion[]> {
  const tokens = foldForSearch(input).split(' ').filter(Boolean);
  if (tokens.length === 0 || tokens.join('').length < 2) return [];
  const [first] = tokens;
  const rows = await run<OsmAreaRow>(
    'SELECT id, name, norm, kind, rank, lat, lng, context FROM areas WHERE norm LIKE ? OR norm LIKE ? LIMIT 3000',
    [`${first}%`, `% ${first}%`],
  );
  const full = tokens.join(' ');
  const scored = rows
    .map((row) => {
      const words = `${row.norm} ${foldForSearch(row.context ?? '')}`.split(' ');
      const matches = tokens.every((t) => words.some((w) => w.startsWith(t)));
      const match = row.norm === full ? 0 : row.norm.startsWith(full) ? 1 : row.norm.startsWith(first) ? 2 : 3;
      const distance = near ? distanceMeters(near, { latitude: row.lat, longitude: row.lng }) : 0;
      return { row, matches, match, distance };
    })
    .filter((s) => s.matches)
    .sort((a, b) => a.match - b.match || a.row.rank - b.row.rank || a.distance - b.distance || a.row.name.length - b.row.name.length);
  return scored.slice(0, LIMITS.maxAreaSuggestions).map(({ row }) => ({ id: row.id, ...areaLabel(row) }));
}

export async function queryArea(run: Runner, id: string): Promise<SearchArea | undefined> {
  const [row] = await run<OsmAreaRow>('SELECT id, name, norm, kind, rank, lat, lng, context FROM areas WHERE id = ?', [id]);
  return row ? rowToArea(row) : undefined;
}

export async function queryMeta(run: Runner): Promise<Record<string, string>> {
  const rows = await run<{ key: string; value: string }>('SELECT key, value FROM meta', []);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
