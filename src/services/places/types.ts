import type { Activity, LatLng, Place, PlaceDetails, SearchArea } from '@/types';

export interface NearbyQuery {
  center: LatLng;
  radiusMeters: number;
  activity: Activity;
}

export interface AreaSuggestion {
  id: string;
  title: string;
  subtitle?: string;
}

/**
 * Everything the app needs from a place data source. Screens only talk to this
 * interface, so the sample provider and the Google provider are interchangeable.
 */
export interface PlacesProvider {
  readonly kind: 'google' | 'osm';
  /** Up to 20 places near a point, filtered by activity. */
  searchNearby(query: NearbyQuery): Promise<Place[]>;
  getDetails(id: string): Promise<PlaceDetails>;
  /** Area suggestions while the user types in the Location screen. */
  searchAreas(input: string, near?: LatLng): Promise<AreaSuggestion[]>;
  /** Turn a chosen suggestion into a searchable area with coordinates. */
  resolveArea(id: string): Promise<SearchArea>;
}

export type PlacesErrorReason = 'offline' | 'notFound' | 'quota' | 'config' | 'unknown';

export class PlacesError extends Error {
  readonly reason: PlacesErrorReason;
  constructor(reason: PlacesErrorReason, message?: string) {
    super(message ?? reason);
    this.reason = reason;
  }
}

/** Place types (Google "Table A") used for each activity. */
export const EAT_TYPES = ['restaurant', 'cafe', 'bakery', 'meal_takeaway'] as const;
export const GO_OUT_TYPES = [
  'park',
  'museum',
  'art_gallery',
  'tourist_attraction',
  'shopping_mall',
  'amusement_park',
  'zoo',
  'aquarium',
  'bowling_alley',
  'movie_theater',
] as const;

export function typesFor(activity: Activity): string[] {
  if (activity === 'eat') return [...EAT_TYPES];
  if (activity === 'goOut') return [...GO_OUT_TYPES];
  return [...EAT_TYPES, ...GO_OUT_TYPES];
}
