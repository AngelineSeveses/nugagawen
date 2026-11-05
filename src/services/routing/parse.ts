/**
 * Turns an OSRM routing response into our own `Route`.
 * Pure functions (no network, no React), so they're unit-tested directly.
 */
import { RoutingError, type Compass, type Route, type RouteStep, type StepModifier, type StepType, type TravelMode } from './types';

interface OsrmStep {
  name?: string;
  ref?: string;
  mode?: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
    exit?: number;
    bearing_after?: number;
    location: [number, number];
  };
}

export interface OsrmResponse {
  code?: string;
  routes?: {
    distance: number;
    duration: number;
    geometry?: { coordinates?: [number, number][] };
    legs?: { steps?: OsrmStep[] }[];
  }[];
}

const STEP_TYPES: Record<string, StepType> = {
  depart: 'depart',
  arrive: 'arrive',
  turn: 'turn',
  continue: 'continue',
  'new name': 'continue',
  'use lane': 'continue',
  notification: 'continue',
  merge: 'merge',
  'on ramp': 'ramp-on',
  'off ramp': 'ramp-off',
  fork: 'fork',
  'end of road': 'end-of-road',
  roundabout: 'roundabout',
  rotary: 'roundabout',
  'roundabout turn': 'roundabout',
  'exit roundabout': 'exit-roundabout',
  'exit rotary': 'exit-roundabout',
};

const MODIFIERS: StepModifier[] = ['uturn', 'sharp right', 'right', 'slight right', 'straight', 'slight left', 'left', 'sharp left'];

/** 0° = north, 90° = east… rounded to the nearest of eight directions. */
export function compassFromBearing(bearing: number): Compass {
  const names: Compass[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  return names[Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
}

function toStep(step: OsrmStep): RouteStep {
  const { maneuver } = step;
  const isDepartOrArrive = maneuver.type === 'depart' || maneuver.type === 'arrive';
  return {
    // A sea crossing is what matters most in the Philippines, whatever the server calls the maneuver.
    type: step.mode === 'ferry' && !isDepartOrArrive ? 'ferry' : (STEP_TYPES[maneuver.type] ?? 'continue'),
    modifier: MODIFIERS.find((m) => m === maneuver.modifier),
    road: step.name?.trim() || step.ref?.trim() || undefined,
    exit: maneuver.exit,
    compass: compassFromBearing(maneuver.bearing_after ?? 0),
    distanceMeters: step.distance,
    durationSeconds: step.duration,
    location: { latitude: maneuver.location[1], longitude: maneuver.location[0] },
  };
}

/**
 * Walking routes come back with many tiny "keep going" steps. Fold them into the
 * step before, so the list reads like directions a person would give.
 */
export function simplifySteps(steps: RouteStep[]): RouteStep[] {
  const out: RouteStep[] = [];
  for (const step of steps) {
    const previous = out[out.length - 1];
    const keepsGoing = step.type === 'continue' && (step.modifier === undefined || step.modifier === 'straight');
    if (previous && previous.type !== 'ferry' && keepsGoing && (!step.road || step.road === previous.road)) {
      previous.distanceMeters += step.distanceMeters;
      previous.durationSeconds += step.durationSeconds;
      continue;
    }
    out.push({ ...step });
  }
  return out;
}

export function parseOsrmResponse(json: OsrmResponse, mode: TravelMode): Route {
  const route = json.routes?.[0];
  if (!route || (json.code && json.code !== 'Ok')) throw new RoutingError('noRoute', json.code);
  return {
    mode,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    coordinates: route.geometry?.coordinates ?? [],
    steps: simplifySteps((route.legs ?? []).flatMap((leg) => leg.steps ?? []).map(toStep)),
  };
}
