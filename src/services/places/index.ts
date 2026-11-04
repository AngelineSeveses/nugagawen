import { placesApiKey } from '@/config';
import type { Place } from '@/types';
import { createGoogleProvider } from './google';
import { osmProvider } from './osm/provider';
import type { PlacesProvider } from './types';

export { attachOsmDatabase, failOsmDatabase } from './osm/provider';
export { PlacesError, type AreaSuggestion, type PlacesProvider } from './types';

/**
 * The one provider the whole app uses.
 * Default: OpenStreetMap data bundled in the app (free, offline, no key).
 * Optional: Google Places, only if EXPO_PUBLIC_GOOGLE_PLACES_API_KEY is set (adds ratings and photos; paid beyond free limits).
 */
export const places: PlacesProvider = placesApiKey ? createGoogleProvider(placesApiKey) : osmProvider;

/**
 * Places seen in results, kept in memory so the details screen can show the
 * basics instantly while full details load. Cleared when the app restarts.
 */
const seen = new Map<string, Place>();
export const placeCache = {
  remember: (list: Place[]) => list.forEach((p) => seen.set(p.id, p)),
  get: (id: string) => seen.get(id),
};
