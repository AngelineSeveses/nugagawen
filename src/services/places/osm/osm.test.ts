/**
 * Runs the app's real search and picking code against the bundled database,
 * using Node's built-in SQLite, for places all over the Philippines.
 */
import { describe, expect, it } from '@jest/globals';
import { pickThree } from '@/features/recommendation/pick';
import { distanceMeters } from '@/utils/format';
import { loadCategories, queryArea, queryAreas, queryDetails, queryNearby, type Runner } from './queries';

type NodeDb = { prepare(sql: string): { all(...params: unknown[]): unknown[] } };
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string, options?: { readOnly?: boolean }) => NodeDb };
const { existsSync } = require('node:fs') as { existsSync: (p: string) => boolean };

// Jest runs from the project root.
const DB_PATH = 'assets/data/places.db';
const hasDb = existsSync(DB_PATH);
const db = hasDb ? new DatabaseSync(DB_PATH, { readOnly: true }) : undefined;
const run: Runner = async <T,>(sql: string, params: (string | number)[]) => db!.prepare(sql).all(...params) as T[];

/** From the capital to small provincial towns, Luzon to Mindanao. */
const PLACES = [
  { name: 'Makati (Metro Manila)', latitude: 14.565, longitude: 121.03 },
  { name: 'Quezon City (Diliman)', latitude: 14.6537, longitude: 121.0687 },
  { name: 'Cebu City (Lahug)', latitude: 10.3317, longitude: 123.9 },
  { name: 'Davao City', latitude: 7.0731, longitude: 125.6128 },
  { name: 'Baguio', latitude: 16.4023, longitude: 120.596 },
  { name: 'Iloilo City', latitude: 10.7202, longitude: 122.5621 },
  { name: 'Puerto Princesa (Palawan)', latitude: 9.7392, longitude: 118.7353 },
  { name: 'El Nido (Palawan)', latitude: 11.1956, longitude: 119.4075 },
  { name: 'Dumaguete', latitude: 9.3068, longitude: 123.3054 },
  { name: 'Tuguegarao', latitude: 17.6132, longitude: 121.727 },
  { name: 'General Luna (Siargao)', latitude: 9.7869, longitude: 126.1557 },
  { name: 'Bangued (Abra)', latitude: 17.596, longitude: 120.6176 },
];

const NOON = new Date(2026, 10, 4, 12, 0);

(hasDb ? describe : describe.skip)('OpenStreetMap database', () => {
  it('finds places and makes picks everywhere in the list', async () => {
    const categories = await loadCategories(run);
    const report: string[] = [];
    for (const p of PLACES) {
      const center = { latitude: p.latitude, longitude: p.longitude };
      const eat = await queryNearby(run, categories, { center, radiusMeters: 3000, activity: 'eat' }, NOON);
      const goOut = await queryNearby(run, categories, { center, radiusMeters: 5000, activity: 'goOut' }, NOON);
      const anything = await queryNearby(run, categories, { center, radiusMeters: 5000, activity: 'anything' }, NOON);
      const picks = pickThree(anything, { origin: center, radiusMeters: 5000, budget: 'moderate', random: () => 0.5 });
      report.push(
        `${p.name.padEnd(28)} eat ≤3 km: ${String(eat.length).padStart(3)}  go out ≤5 km: ${String(goOut.length).padStart(3)}  picks: ${picks
          .map((r) => `${r.kind}=${r.place.name} (${r.place.category})`)
          .join(' | ')}`,
      );
      expect(eat.length + goOut.length).toBeGreaterThan(0);
      expect(picks.length).toBeGreaterThan(0);
    }
    console.log(`Coverage across the Philippines:\n${report.join('\n')}`);
  });

  it('opens details for a found place', async () => {
    const categories = await loadCategories(run);
    const [first] = await queryNearby(run, categories, { center: PLACES[0], radiusMeters: 1000, activity: 'eat' }, NOON);
    const details = await queryDetails(run, categories, first.id, NOON);
    expect(details?.name).toBe(first.name);
  });

  it('searches areas the way people type them', async () => {
    const top = async (q: string, near?: { latitude: number; longitude: number }) => (await queryAreas(run, q, near))[0];
    expect((await top('makati'))?.title).toMatch(/Makati/);
    expect((await top('paranaque'))?.title).toMatch(/Parañaque|Paranaque/); // no ñ needed
    expect((await top('baguio'))?.title).toMatch(/Baguio/);
    // There are hundreds of barangays named Poblacion; the one nearest to you comes first.
    const poblacion = await top('poblacion', PLACES[0]);
    expect(poblacion?.title).toBe('Poblacion');
    const area = await queryArea(run, poblacion!.id);
    expect(distanceMeters(area!.location, PLACES[0])).toBeLessThan(3000);
    // Provinces search around their capital, not the middle of the island.
    const palawan = (await queryAreas(run, 'palawan')).find((a) => /Province/.test(a.subtitle ?? ''));
    expect(palawan?.subtitle).toMatch(/Puerto Princesa/);
    const cebu = (await queryAreas(run, 'cebu')).map((a) => a.subtitle ?? '');
    expect(cebu.some((s) => /Province/.test(s))).toBe(true);
  });
});
