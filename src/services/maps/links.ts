/**
 * Plain links that open Google Maps: no API, key or cost. Used as a fallback and
 * for what we can't do ourselves (live navigation, public transport, photos).
 */
import type { TravelMode } from '@/services/routing/types';
import type { LatLng } from '@/types';

const GOOGLE_MODE: Record<TravelMode, string> = { walking: 'walking', driving: 'driving', cycling: 'bicycling' };

interface MapPlace {
  id: string;
  name: string;
  location: LatLng;
}

/** Directions from the person's current location. */
export function googleDirectionsUrl(place: MapPlace, mode?: TravelMode) {
  const { latitude, longitude } = place.location;
  const travelMode = mode ? `&travelmode=${GOOGLE_MODE[mode]}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}${travelMode}`;
}

/** Searches Google Maps for the place at its exact location, where people can see photos and reviews. */
export function googlePhotosUrl(place: MapPlace) {
  const { latitude, longitude } = place.location;
  return `https://www.google.com/maps/search/${encodeURIComponent(place.name)}/@${latitude},${longitude},18z`;
}

/** OpenStreetMap's page for reporting a mistake on the map (the routing servers ask apps to link to it). */
export const FIX_THE_MAP_URL = 'https://www.openstreetmap.org/fixthemap';
