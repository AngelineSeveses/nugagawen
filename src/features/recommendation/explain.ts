/**
 * One-line reasons, built only from real attributes. Never invents atmosphere,
 * dishes or events.
 */
import type { Copy } from '@/localization/en';
import type { Budget, Place, PickKind, ReasonFacts } from '@/types';
import { formatCount, formatDistance, formatRating, isPriceEstimate } from '@/utils/format';
import { budgetFit } from './score';

/** The one-line reason under a pick, in the language of `copy`. */
export function explain(kind: PickKind, place: Place, facts: ReasonFacts, copy: Copy): string {
  const { rating, reviewCount } = place;
  switch (kind) {
    case 'safe':
      // "Highly rated" needs enough reviews to mean something; otherwise state the facts.
      if (rating !== undefined && rating >= 4.2 && (reviewCount ?? 0) >= 50 && facts.distance <= facts.nearestThirdDistance) {
        return copy.reasons.safeRatedClose;
      }
      if (rating !== undefined && reviewCount) {
        return copy.reasons.safeRated(formatRating(rating), formatCount(reviewCount));
      }
      if (place.signals?.brand) return copy.reasons.safeBrand;
      if (place.signals?.notable) return copy.reasons.safeNotable;
      if (place.signals?.hasHours && place.signals.hasContact) return copy.reasons.safeListed;
      return copy.reasons.safeClose;
    case 'surprise':
      return facts.differsFromSafe ? copy.reasons.surpriseDifferent : copy.reasons.surpriseGeneric;
    case 'gem':
      if (rating !== undefined) return copy.reasons.gem(formatRating(rating), reviewCount ?? 0);
      return place.signals?.cuisine ? copy.reasons.gemLocalCuisine(place.signals.cuisine) : copy.reasons.gemLocal;
  }
}

/** The longer "Why this?" sentence on the details screen, in the language of `copy`. */
export function whyThis(place: Place, budget: Budget, distanceMeters: number | undefined, copy: Copy): string | undefined {
  return copy.why.compose({
    // Only claim a budget fit when the price is inside the band; "usually" when it's our estimate.
    budget: budgetFit(place, budget) === 1 ? { budget, estimate: isPriceEstimate(place) } : undefined,
    rating: place.rating !== undefined ? formatRating(place.rating) : undefined,
    openNow: place.openNow === true,
    distance: distanceMeters !== undefined ? formatDistance(distanceMeters) : undefined,
  });
}
