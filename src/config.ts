/**
 * Runtime configuration.
 *
 * By default the app uses OpenStreetMap data bundled inside it: free, offline,
 * no account or key. Setting EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in `.env.local`
 * switches to Google Places instead (see README; Google bills beyond its free limits).
 */
const key = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY?.trim();

export const placesApiKey: string | undefined = key ? key : undefined;
export const dataSource: 'osm' | 'google' = placesApiKey ? 'google' : 'osm';

/**
 * Map tiles (the map's visual layer). Default: OpenFreeMap, free with no key, no
 * limits, and commercial use allowed. Setting EXPO_PUBLIC_MAPTILER_KEY switches to
 * MapTiler (its free plan: 5,000 map loads a month, for non-commercial use).
 */
const mapTilerKey = process.env.EXPO_PUBLIC_MAPTILER_KEY?.trim();

export const mapStyleUrl: string = mapTilerKey
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(mapTilerKey)}`
  : 'https://tiles.openfreemap.org/styles/bright';
