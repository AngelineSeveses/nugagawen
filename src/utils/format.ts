import type { LatLng, Place } from '@/types';

/** Straight-line distance in meters (haversine formula). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** "850 m" under a kilometer (rounded to 10 m), otherwise "1.4 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

/**
 * Price per person. A real range from the data source is shown as-is.
 * A price *level* is turned into an estimate and marked with "~".
 * The peso bands are assumptions to validate (docs/01-product.md §1.6).
 */
export function formatPrice(place: Pick<Place, 'priceLevel' | 'priceRange'>, labels: { free: string; unknown: string }): string {
  const { priceRange, priceLevel } = place;
  if (priceRange) {
    if (priceRange.min === 0 && !priceRange.max) return labels.free;
    return priceRange.max ? `${peso(priceRange.min)}–${peso(priceRange.max)}` : `${peso(priceRange.min)}+`;
  }
  switch (priceLevel) {
    case 'free':
      return labels.free;
    case 'inexpensive':
      return '~₱100–250';
    case 'moderate':
      return '~₱250–600';
    case 'expensive':
      return '~₱600–1,500';
    case 'veryExpensive':
      return '~₱1,500+';
    default:
      return labels.unknown;
  }
}

/** True when the price shown is our estimate rather than a real range. */
export function isPriceEstimate(place: Pick<Place, 'priceLevel' | 'priceRange'>): boolean {
  return !place.priceRange && place.priceLevel !== undefined && place.priceLevel !== 'free';
}

/** "4.6" */
export const formatRating = (rating: number) => rating.toFixed(1);

/** "1,203" */
export const formatCount = (n: number) => n.toLocaleString('en-US');

/** "10:00 PM" from an ISO timestamp, in the phone's time zone. */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
