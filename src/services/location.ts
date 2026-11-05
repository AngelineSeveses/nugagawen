/**
 * Device location through expo-location: foreground permission only, asked in
 * context (never at launch). Area names come from the phone's own reverse
 * geocoder, so no extra API or key is needed.
 */
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import type { LatLng, SearchArea } from '@/types';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermission(): Promise<PermissionState> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

export async function requestPermission(): Promise<PermissionState> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted' ? 'granted' : 'denied';
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

/** Current position plus a readable area name ("Poblacion, Makati"). */
export async function getCurrentArea(): Promise<SearchArea> {
  const position = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 15000);
  const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
  // Fallback when the phone can't name the area: coordinates read the same in every language.
  let label = `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
  try {
    const [place] = await Location.reverseGeocodeAsync(location);
    if (place) {
      const parts = [place.district, place.city].filter((p): p is string => Boolean(p));
      label = parts.length > 0 ? [...new Set(parts)].join(', ') : (place.subregion ?? place.region ?? label);
    }
  } catch {
    // Reverse geocoding is a nicety; the coordinates are what the search needs.
  }
  return { label, location, source: 'gps' };
}

/**
 * Where the phone is right now, asking permission if it hasn't been asked yet.
 * Undefined when location is off or unavailable; directions then start from the chosen area.
 */
export async function getCurrentPosition(): Promise<LatLng | undefined> {
  try {
    let permission = await getPermission();
    if (permission === 'undetermined') permission = await requestPermission();
    if (permission !== 'granted') return undefined;
    const position = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 10000);
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return undefined;
  }
}

/** Browsers have no app settings page, so this only exists on iOS and Android. */
export const canOpenSystemSettings = Platform.OS !== 'web';

export function openSystemSettings() {
  if (!canOpenSystemSettings) return;
  Linking.openSettings().catch(() => {});
}
