/**
 * Routes from the free public OSRM servers run by FOSSGIS, built on OpenStreetMap
 * roads. No key or account. Their rules: at most one request per second, no heavy
 * use, and show the credit and a "fix the map" link (the directions screen does).
 * A public launch with real traffic should move to our own OSRM server.
 */
import { Platform } from 'react-native';
import type { LatLng } from '@/types';
import { parseOsrmResponse, type OsrmResponse } from './parse';
import { RoutingError, type Route, type TravelMode } from './types';

const BASE = 'https://routing.openstreetmap.de';
const PROFILES: Record<TravelMode, string> = {
  walking: 'routed-foot',
  driving: 'routed-car',
  cycling: 'routed-bike',
};

/** Browsers don't allow setting User-Agent; phones should identify the app, as the server's rules ask. */
const HEADERS: Record<string, string> = Platform.OS === 'web' ? {} : { 'User-Agent': 'Nugagawen/1.0 (mobile app)' };

const pair = (p: LatLng) => `${p.longitude.toFixed(5)},${p.latitude.toFixed(5)}`;

/** Spaces requests at least a second apart, however quickly someone taps between travel modes. */
let nextAllowedAt = 0;
async function waitForTurn() {
  const now = Date.now();
  const wait = nextAllowedAt - now;
  nextAllowedAt = Math.max(now, nextAllowedAt) + 1000;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

const cache = new Map<string, Route>();

export async function fetchRoute(from: LatLng, to: LatLng, mode: TravelMode): Promise<Route> {
  const key = `${mode}:${pair(from)};${pair(to)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  await waitForTurn();
  const url = `${BASE}/${PROFILES[mode]}/route/v1/driving/${pair(from)};${pair(to)}?overview=full&geometries=geojson&steps=true`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let response: Response;
  try {
    response = await fetch(url, { headers: HEADERS, signal: controller.signal });
  } catch {
    throw new RoutingError('offline');
  } finally {
    clearTimeout(timer);
  }

  const body = (await response.json().catch(() => undefined)) as OsrmResponse | undefined;
  // The server answers 400 with code "NoRoute" or "NoSegment" when two points can't be connected.
  if (body?.code === 'NoRoute' || body?.code === 'NoSegment') throw new RoutingError('noRoute', body.code);
  if (!response.ok || !body) throw new RoutingError('unknown', `HTTP ${response.status}`);

  const route = parseOsrmResponse(body, mode);
  cache.set(key, route);
  return route;
}
