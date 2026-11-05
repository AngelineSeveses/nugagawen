import type { LatLng } from '@/types';

/** The box around a map's content: [west, south, east, north]. */
export type Bounds = [number, number, number, number];

/**
 * The smallest box containing the destination, the start and the route line, so
 * the camera can show the whole trip. Undefined when there's only one point: a
 * box around a single point has no size, so the map centers on it instead.
 */
export function boundsOf(destination: LatLng, origin?: LatLng, line?: [number, number][]): Bounds | undefined {
  const points: [number, number][] = [[destination.longitude, destination.latitude], ...(line ?? [])];
  if (origin) points.push([origin.longitude, origin.latitude]);
  if (points.length < 2) return undefined;
  const lngs = points.map(([lng]) => lng);
  const lats = points.map(([, lat]) => lat);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}
