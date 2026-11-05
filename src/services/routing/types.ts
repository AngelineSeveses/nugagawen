import type { LatLng } from '@/types';

export type TravelMode = 'walking' | 'driving' | 'cycling';

/** What to do at a step. A small set of our own, so wording lives in the language files, not the routing server. */
export type StepType =
  | 'depart'
  | 'arrive'
  | 'turn'
  | 'continue'
  | 'merge'
  | 'ramp-on'
  | 'ramp-off'
  | 'fork'
  | 'end-of-road'
  | 'roundabout'
  | 'exit-roundabout'
  | 'ferry';

export type StepModifier = 'uturn' | 'sharp right' | 'right' | 'slight right' | 'straight' | 'slight left' | 'left' | 'sharp left';

export type Compass = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface RouteStep {
  type: StepType;
  modifier?: StepModifier;
  road?: string;
  /** Which exit to take at a roundabout. */
  exit?: number;
  /** Direction of travel after this step (used for "Head north"). */
  compass: Compass;
  /** Distance and time from this step to the next one. */
  distanceMeters: number;
  durationSeconds: number;
  location: LatLng;
}

export interface Route {
  mode: TravelMode;
  distanceMeters: number;
  durationSeconds: number;
  /** The route line, as [longitude, latitude] pairs (the order maps use). */
  coordinates: [number, number][];
  steps: RouteStep[];
}

export type RoutingErrorReason = 'offline' | 'noRoute' | 'unknown';

export class RoutingError extends Error {
  readonly reason: RoutingErrorReason;
  constructor(reason: RoutingErrorReason, message?: string) {
    super(message ?? reason);
    this.reason = reason;
  }
}
