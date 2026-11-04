/**
 * Choose up to three places: Safe choice, Surprise me, Hidden gem
 * (docs/01-product.md §1.6). Pure function; randomness is injected so tests are repeatable.
 */
import type { Budget, LatLng, Place, PickKind, Recommendation } from '@/types';
import { distanceMeters } from '@/utils/format';
import { budgetFit, closeness, meanRating, quality, totalScore } from './score';

export interface PickContext {
  origin: LatLng;
  radiusMeters: number;
  budget: Budget;
  /** Places already shown this session (for "Show others"). */
  exclude?: ReadonlySet<string>;
  /** Defaults to Math.random; tests pass a seeded function. */
  random?: () => number;
}

export interface Scored {
  place: Place;
  distance: number;
  score: number;
}

/** Filter the pool to valid candidates and score them, best first. */
export function rankCandidates(pool: Place[], ctx: PickContext): Scored[] {
  const mean = meanRating(pool);
  return pool
    .filter((p) => !ctx.exclude?.has(p.id))
    .filter((p) => p.openNow !== false) // never recommend a place that is closed right now
    .map((place) => {
      const distance = distanceMeters(ctx.origin, place.location);
      const fit = budgetFit(place, ctx.budget);
      const score = totalScore(
        { quality: quality(place, mean), closeness: closeness(distance, ctx.radiusMeters), budgetFit: fit },
        place.openNow,
      );
      return { place, distance, score, fit };
    })
    .filter((s) => s.fit > 0 && s.distance <= ctx.radiusMeters * 1.05)
    .sort((a, b) => b.score - a.score)
    .map(({ place, distance, score }) => ({ place, distance, score }));
}

/** Safe choice: a strong track record (ratings), or without ratings, a known name or a well-documented listing. */
function isProven(p: Place) {
  if (p.rating !== undefined) return p.rating >= 4.2 && (p.reviewCount ?? 0) >= 100;
  const s = p.signals;
  return !!s && (s.notable || !!s.brand || (s.hasHours && s.hasContact));
}

/** Hidden gem: highly rated but little-known, or without ratings, an independent place with real detail listed. */
function isGem(p: Place, lowReviewCutoff: number) {
  if (p.rating !== undefined) {
    const reviews = p.reviewCount ?? 0;
    return p.rating >= 4.4 && reviews >= 10 && reviews <= Math.max(300, lowReviewCutoff);
  }
  const s = p.signals;
  return !!s && !s.brand && (!!s.cuisine || s.hasHours || s.notable);
}

/** Weighted random choice: higher scores are more likely, never a low-quality wildcard. */
function weightedPick(items: Scored[], random: () => number): Scored | undefined {
  const total = items.reduce((sum, s) => sum + s.score, 0);
  if (items.length === 0 || total <= 0) return items[0];
  let r = random() * total;
  for (const s of items) {
    r -= s.score;
    if (r <= 0) return s;
  }
  return items[items.length - 1];
}

export function pickThree(pool: Place[], ctx: PickContext): Recommendation[] {
  const random = ctx.random ?? Math.random;
  const ranked = rankCandidates(pool, ctx);
  if (ranked.length === 0) return [];

  // Safe choice: best-scoring place with a strong track record, else best overall.
  const safe = ranked.find((s) => isProven(s.place)) ?? ranked[0];
  let rest = ranked.filter((s) => s !== safe);

  // Hidden gem: highly rated but relatively few reviews (absolute, or bottom third of the pool).
  const counts = ranked.map((s) => s.place.reviewCount ?? 0).sort((a, b) => a - b);
  const lowReviewCutoff = counts[Math.floor((counts.length - 1) / 3)] ?? 0;
  const gem = rest
    .filter((s) => isGem(s.place, lowReviewCutoff))
    .sort((a, b) => (b.place.rating ?? 0) - (a.place.rating ?? 0) || b.score - a.score)[0];
  rest = rest.filter((s) => s !== gem);

  // Surprise me: any remaining place scoring within 80% of the best remaining one
  // (still a good pick), preferring a different category than the Safe choice.
  const bestRest = rest[0]?.score ?? 0;
  const goodEnough = rest.filter((s) => s.score >= 0.8 * bestRest);
  const different = goodEnough.filter((s) => s.place.category !== safe.place.category);
  const surprise = weightedPick(different.length > 0 ? different : goodEnough, random);

  const chosen: [PickKind, Scored | undefined][] = [
    ['safe', safe],
    ['surprise', surprise],
    ['gem', gem],
  ];
  const kept = chosen.filter((c): c is [PickKind, Scored] => c[1] !== undefined);
  const nearestThird = ranked
    .map((s) => s.distance)
    .sort((a, b) => a - b)[Math.floor((ranked.length - 1) / 3)];

  return kept.map(([kind, s]) => ({
    kind,
    place: s.place,
    distanceMeters: s.distance,
    facts: {
      distance: s.distance,
      nearestThirdDistance: nearestThird ?? s.distance,
      differsFromSafe: kind === 'surprise' && s.place.category !== safe.place.category,
    },
  }));
}

/**
 * "Surprise me" on the home screen: one place, picked at random from the good
 * ones nearby (within 80% of the best score), for any activity.
 */
export function pickSurprise(pool: Place[], ctx: PickContext): Recommendation | undefined {
  const ranked = rankCandidates(pool, ctx);
  if (ranked.length === 0) return undefined;
  const goodEnough = ranked.filter((s) => s.score >= 0.8 * ranked[0].score);
  const chosen = weightedPick(goodEnough, ctx.random ?? Math.random);
  if (!chosen) return undefined;
  return {
    kind: 'surprise',
    place: chosen.place,
    distanceMeters: chosen.distance,
    facts: { distance: chosen.distance, nearestThirdDistance: chosen.distance, differsFromSafe: false },
  };
}
