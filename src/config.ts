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
