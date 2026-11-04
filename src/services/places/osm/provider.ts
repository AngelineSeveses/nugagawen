/**
 * OpenStreetMap place provider: reads the database bundled in the app
 * (assets/data/places.db) through expo-sqlite. Works offline; no API key.
 *
 * The database is opened by <SQLiteProvider> in the root layout, which hands it
 * to `attachOsmDatabase`. Queries wait until that has happened.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import { PlacesError, type PlacesProvider } from '../types';
import { loadCategories, queryArea, queryAreas, queryDetails, queryNearby, type Categories, type Runner } from './queries';

let attach: (db: SQLiteDatabase) => void = () => {};
let fail: (error: Error) => void = () => {};
const database = new Promise<SQLiteDatabase>((resolve, reject) => {
  attach = resolve;
  fail = reject;
});

export function attachOsmDatabase(db: SQLiteDatabase) {
  attach(db);
}

/** If the bundled database can't be opened, searches fail with an error instead of waiting forever. */
export function failOsmDatabase(error: Error) {
  fail(error);
}

const run: Runner = async <T,>(sql: string, params: (string | number)[]) => {
  try {
    const db = await database;
    return await db.getAllAsync<T>(sql, params);
  } catch (error) {
    throw new PlacesError('unknown', error instanceof Error ? error.message : String(error));
  }
};

let categories: Promise<Categories> | undefined;
const getCategories = () => (categories ??= loadCategories(run));

export const osmProvider: PlacesProvider = {
  kind: 'osm',
  searchNearby: async (query) => queryNearby(run, await getCategories(), query),
  getDetails: async (id) => {
    const details = await queryDetails(run, await getCategories(), id);
    if (!details) throw new PlacesError('notFound');
    return details;
  },
  searchAreas: (input, near) => queryAreas(run, input, near),
  resolveArea: async (id) => {
    const area = await queryArea(run, id);
    if (!area) throw new PlacesError('notFound');
    return area;
  },
};
