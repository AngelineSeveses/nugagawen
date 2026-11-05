/**
 * Everything the directions screen needs, in one place: the destination, where
 * the trip starts, the travel mode and the route.
 *
 * The starting point prefers the phone's real location. If location is off, it
 * falls back to the area chosen in the app, and says so (see `origin.source`).
 */
import { useEffect, useState } from 'react';
import { getCurrentPosition } from '@/services/location';
import { PlacesError, placeCache, places } from '@/services/places';
import { fetchRoute } from '@/services/routing/osrm';
import { RoutingError, type Route, type TravelMode } from '@/services/routing/types';
import { usePreferences } from '@/state/preferences';
import type { LatLng, Place } from '@/types';
import { distanceMeters } from '@/utils/format';

/** Close enough to walk by default; otherwise default to driving. Tapping another mode overrides this. */
const WALKABLE_METERS = 1500;

export type DirectionsStatus = 'finding' | 'ready' | 'noOrigin' | 'noPlace' | 'noRoute' | 'offline' | 'error';

export interface TripOrigin {
  location: LatLng;
  source: 'gps' | 'area';
}

export function useDirections(placeId: string) {
  const { area, loaded } = usePreferences();
  const [place, setPlace] = useState<Place | undefined>(placeCache.get(placeId));
  const [placeFailure, setPlaceFailure] = useState<{ attempt: number; reason: 'noPlace' | 'error' } | undefined>();
  const [origin, setOrigin] = useState<TripOrigin | undefined>();
  const [originChecked, setOriginChecked] = useState(false);
  const [chosenMode, setChosenMode] = useState<TravelMode | undefined>();
  // A route or failure belongs to one request (its `key`), so changing the mode shows as loading by itself.
  const [routeResult, setRouteResult] = useState<{ key: string; route?: Route; failure?: 'noRoute' | 'offline' | 'error' } | undefined>();
  const [attempt, setAttempt] = useState(0);

  // The destination: usually already known from Results; otherwise (Saved, a link) read it.
  useEffect(() => {
    if (place) return;
    let cancelled = false;
    places
      .getDetails(placeId)
      .then((details) => !cancelled && setPlace(details))
      // Only a real "not found" may say the place is gone. Anything else can be retried.
      .catch((error: unknown) => !cancelled && setPlaceFailure({ attempt, reason: error instanceof PlacesError && error.reason === 'notFound' ? 'noPlace' : 'error' }));
    return () => {
      cancelled = true;
    };
  }, [placeId, place, attempt]);

  // The start: real location if we can get it, otherwise the area chosen in the app.
  const areaLat = area?.location.latitude;
  const areaLng = area?.location.longitude;
  useEffect(() => {
    if (!loaded) return; // wait for the saved area, so we don't wrongly report "no start"
    let cancelled = false;
    getCurrentPosition().then((position) => {
      if (cancelled) return;
      if (position) setOrigin({ location: position, source: 'gps' });
      else if (areaLat !== undefined && areaLng !== undefined) setOrigin({ location: { latitude: areaLat, longitude: areaLng }, source: 'area' });
      setOriginChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [areaLat, areaLng, loaded, attempt]);

  const mode: TravelMode | undefined =
    chosenMode ??
    (place && origin ? (distanceMeters(origin.location, place.location) <= WALKABLE_METERS ? 'walking' : 'driving') : undefined);

  // The route, whenever the start, the destination or the mode changes.
  const fromLat = origin?.location.latitude;
  const fromLng = origin?.location.longitude;
  const toLat = place?.location.latitude;
  const toLng = place?.location.longitude;
  const routeKey = [fromLat, fromLng, toLat, toLng, mode, attempt].join();
  const current = routeResult?.key === routeKey ? routeResult : undefined;
  const route = current?.route;
  const failure = current?.failure;
  useEffect(() => {
    if (fromLat === undefined || fromLng === undefined || toLat === undefined || toLng === undefined || !mode) return;
    let cancelled = false;
    fetchRoute({ latitude: fromLat, longitude: fromLng }, { latitude: toLat, longitude: toLng }, mode)
      .then((next) => !cancelled && setRouteResult({ key: routeKey, route: next }))
      .catch((error: unknown) => {
        if (cancelled) return;
        const reason = error instanceof RoutingError ? error.reason : 'unknown';
        setRouteResult({ key: routeKey, failure: reason === 'noRoute' ? 'noRoute' : reason === 'offline' ? 'offline' : 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [fromLat, fromLng, toLat, toLng, mode, routeKey]);

  let status: DirectionsStatus = 'finding';
  if (placeFailure?.attempt === attempt) status = placeFailure.reason;
  else if (originChecked && !origin) status = 'noOrigin';
  else if (failure) status = failure;
  else if (route) status = 'ready';

  return {
    place,
    origin,
    mode,
    setMode: setChosenMode,
    route,
    status,
    retry: () => setAttempt((a) => a + 1),
  };
}
