/**
 * Scoring rules (docs/01-product.md §1.6). Pure functions: no React, no network,
 * so they are easy to unit test and to tune.
 */
import type { Budget, Place, PlaceSignals, PriceLevel } from '@/types';

/** Which price levels belong to each budget band. */
const BAND: Record<Budget, PriceLevel[]> = {
  thrifty: ['free', 'inexpensive'],
  moderate: ['inexpensive', 'moderate'],
  splurge: ['expensive', 'veryExpensive'],
};

/** Levels one step outside a band: allowed, but ranked lower. */
const ADJACENT: Record<Budget, PriceLevel[]> = {
  thrifty: ['moderate'],
  moderate: ['free', 'expensive'],
  splurge: ['moderate'],
};

/** Peso cut-offs used when a place has a real price range instead of a level. */
function levelFromPesos(min: number): PriceLevel {
  if (min === 0) return 'free';
  if (min < 250) return 'inexpensive';
  if (min < 600) return 'moderate';
  if (min < 1500) return 'expensive';
  return 'veryExpensive';
}

/**
 * 1 = in the band, 0.5 = adjacent or unknown price, 0 = clearly outside (excluded).
 */
export function budgetFit(place: Pick<Place, 'priceLevel' | 'priceRange'>, budget: Budget): number {
  const level = place.priceRange ? levelFromPesos(place.priceRange.min) : place.priceLevel;
  if (level === undefined) return 0.5;
  if (BAND[budget].includes(level)) return 1;
  if (ADJACENT[budget].includes(level)) return 0.5;
  return 0;
}

/**
 * Bayesian-adjusted rating, scaled to 0–1. Pulls ratings with few reviews toward
 * the pool's average, so 5.0 from 3 reviews doesn't beat 4.6 from 2,000.
 */
export function quality(place: Pick<Place, 'rating' | 'reviewCount' | 'signals'>, poolMean: number, m = 50): number {
  if (place.rating === undefined && place.signals) return signalQuality(place.signals);
  const v = place.reviewCount ?? 0;
  const r = place.rating ?? poolMean;
  const adjusted = (v / (v + m)) * r + (m / (v + m)) * poolMean;
  return Math.min(1, Math.max(0, (adjusted - 3) / 2));
}

/**
 * Quality without ratings (OpenStreetMap): how well-known and well-documented a
 * listing is. A place with hours, contact details and a cuisine listed is more
 * likely to be open, real and as described than a bare name on a map.
 */
export function signalQuality(s: PlaceSignals): number {
  const score =
    0.35 +
    (s.hasHours ? 0.2 : 0) +
    (s.hasContact ? 0.15 : 0) +
    (s.cuisine ? 0.1 : 0) +
    (s.notable ? 0.15 : 0) +
    (s.brand ? 0.05 : 0);
  return Math.min(1, score);
}

/** 1 at the center of the search, 0 at the edge of the radius. */
export function closeness(distanceMeters: number, radiusMeters: number): number {
  return Math.min(1, Math.max(0, 1 - distanceMeters / radiusMeters));
}

/** Mean rating of places that have one; 4.2 when none do. */
export function meanRating(places: Pick<Place, 'rating'>[]): number {
  const rated = places.filter((p) => p.rating !== undefined);
  if (rated.length === 0) return 4.2;
  return rated.reduce((sum, p) => sum + (p.rating ?? 0), 0) / rated.length;
}

export interface ScoreParts {
  quality: number;
  closeness: number;
  budgetFit: number;
}

/** Weighted total. Places with unknown opening hours are nudged down a little. */
export function totalScore(parts: ScoreParts, openNow: boolean | undefined): number {
  const base = 0.5 * parts.quality + 0.3 * parts.closeness + 0.2 * parts.budgetFit;
  return openNow === undefined ? base * 0.9 : base;
}
