import { describe, expect, it } from '@jest/globals';
import { en } from '@/localization/en';
import { fil } from '@/localization/fil';
import type { Place, Recommendation } from '@/types';
import { explain, whyThis } from './explain';
import { pickSurprise, pickThree, rankCandidates } from './pick';
import { budgetFit, quality } from './score';

const origin = { latitude: 14.5547, longitude: 121.0244 };
/** A point `meters` north of the origin (1° latitude ≈ 111,320 m). */
const north = (meters: number) => ({ latitude: origin.latitude + meters / 111320, longitude: origin.longitude });

function place(id: string, overrides: Partial<Place> = {}): Place {
  return {
    id,
    name: `Place ${id}`,
    category: 'Restaurant',
    group: 'eat',
    location: north(500),
    rating: 4.3,
    reviewCount: 200,
    priceLevel: 'moderate',
    openNow: true,
    ...overrides,
  };
}

const ctx = { origin, radiusMeters: 3000, budget: 'moderate' as const, random: () => 0 };
const reasonOf = (r: Recommendation) => explain(r.kind, r.place, r.facts, en);

describe('budgetFit', () => {
  it('matches, allows adjacent, and excludes clear mismatches', () => {
    expect(budgetFit({ priceLevel: 'moderate' }, 'moderate')).toBe(1);
    expect(budgetFit({ priceLevel: 'expensive' }, 'moderate')).toBe(0.5);
    expect(budgetFit({ priceLevel: 'veryExpensive' }, 'thrifty')).toBe(0);
    expect(budgetFit({}, 'thrifty')).toBe(0.5);
  });

  it('prefers a real peso range over the price level', () => {
    expect(budgetFit({ priceLevel: 'expensive', priceRange: { min: 150, max: 300 } }, 'thrifty')).toBe(1);
  });
});

describe('quality', () => {
  it('does not let a perfect rating from 3 reviews beat 4.6 from 2,000', () => {
    expect(quality({ rating: 5, reviewCount: 3 }, 4.3)).toBeLessThan(quality({ rating: 4.6, reviewCount: 2000 }, 4.3));
  });
});

describe('rankCandidates', () => {
  it('drops places that are closed now, outside the radius, excluded, or out of budget', () => {
    const pool = [
      place('open'),
      place('closed', { openNow: false }),
      place('far', { location: north(9000) }),
      place('seen'),
      place('pricey', { priceLevel: 'veryExpensive' }),
    ];
    const ids = rankCandidates(pool, { ...ctx, exclude: new Set(['seen']) }).map((s) => s.place.id);
    expect(ids).toEqual(['open']);
  });
});

describe('pickThree', () => {
  const pool = [
    place('proven', { rating: 4.5, reviewCount: 1500, location: north(400) }),
    place('gem', { rating: 4.8, reviewCount: 40, location: north(1500) }),
    place('gallery', { category: 'Art gallery', group: 'goOut', priceLevel: 'free', reviewCount: 600 }),
    place('plain', { rating: 4.0, reviewCount: 300 }),
  ];

  it('returns safe, surprise and gem, each a different place', () => {
    const picks = pickThree(pool, ctx);
    expect(picks.map((p) => p.kind)).toEqual(['safe', 'surprise', 'gem']);
    expect(picks.find((p) => p.kind === 'safe')?.place.id).toBe('proven');
    expect(picks.find((p) => p.kind === 'gem')?.place.id).toBe('gem');
    expect(new Set(picks.map((p) => p.place.id)).size).toBe(3);
  });

  it('prefers a different category for the surprise', () => {
    const surprise = pickThree(pool, ctx).find((p) => p.kind === 'surprise');
    expect(surprise?.place.category).toBe('Art gallery');
  });

  it('never repeats places already shown (shuffle)', () => {
    const first = pickThree(pool, ctx).map((p) => p.place.id);
    const second = pickThree(pool, { ...ctx, exclude: new Set(first) });
    expect(second.every((p) => !first.includes(p.place.id))).toBe(true);
  });

  it('returns fewer than three honestly when the pool is small', () => {
    expect(pickThree([place('only')], ctx)).toHaveLength(1);
    expect(pickThree([], ctx)).toEqual([]);
  });

  it('builds reasons only from real attributes', () => {
    for (const pick of pickThree(pool, ctx)) {
      expect(reasonOf(pick).length).toBeGreaterThan(0);
    }
    expect(explain('gem', place('g', { rating: 4.8, reviewCount: 40 }), { distance: 0, nearestThirdDistance: 0, differsFromSafe: false }, en)).toBe(
      'Loved by the few who know it: 4.8 from 40 reviews.',
    );
  });
});

describe('explain', () => {
  it('only says "highly rated" when there are enough reviews behind it', () => {
    const facts = { distance: 100, nearestThirdDistance: 500, differsFromSafe: false };
    expect(explain('safe', place('many', { rating: 4.5, reviewCount: 800 }), facts, en)).toBe('Highly rated and close by.');
    expect(explain('safe', place('few', { rating: 4.5, reviewCount: 9 }), facts, en)).toBe('Rated 4.5 by 9 people.');
    expect(explain('safe', place('many', { rating: 4.5, reviewCount: 800 }), facts, fil)).toBe('Mataas ang rating at malapit lang.');
  });
});

describe('pickSurprise', () => {
  it('returns one good place, or nothing when nothing qualifies', () => {
    const pool = [place('a', { rating: 4.6, reviewCount: 900 }), place('b', { rating: 4.5, reviewCount: 400 }), place('closed', { openNow: false })];
    const surprise = pickSurprise(pool, ctx);
    expect(surprise?.kind).toBe('surprise');
    expect(['a', 'b']).toContain(surprise?.place.id);
    expect(pickSurprise([place('closed', { openNow: false })], ctx)).toBeUndefined();
  });
});

describe('whyThis', () => {
  it('claims a budget fit only when the price is inside the band', () => {
    expect(whyThis(place('a'), 'moderate', 850, en)).toBe('It usually fits a moderate budget, is rated 4.3, is open now and is 850 m from you.');
    expect(whyThis(place('b', { priceLevel: undefined, openNow: undefined }), 'moderate', 850, en)).toBe('It is rated 4.3 and is 850 m from you.');
    expect(whyThis(place('c', { priceRange: { min: 300, max: 500 } }), 'moderate', 850, en)).toMatch(/^It fits a moderate budget/);
    expect(whyThis(place('a'), 'moderate', 850, fil)).toBe('Karaniwang pasok sa sakto na badyet, may 4.3 na rating, bukas ngayon at 850 m lang mula sa iyo.');
  });
});

describe('without ratings (OpenStreetMap)', () => {
  const osm = (id: string, overrides: Partial<Place>): Place =>
    place(id, { rating: undefined, reviewCount: undefined, signals: { notable: false, hasHours: false, hasContact: false }, ...overrides });
  const pool = [
    osm('chain', { category: 'Fast food', priceLevel: 'inexpensive', signals: { brand: 'Jollibee', notable: false, hasHours: true, hasContact: true } }),
    osm('local', { category: 'Filipino restaurant', priceLevel: undefined, location: north(1200), signals: { notable: false, hasHours: true, hasContact: false, cuisine: 'Filipino' } }),
    osm('cafe', { category: 'Café', location: north(900), signals: { notable: false, hasHours: false, hasContact: true } }),
    osm('bare', { category: 'Restaurant', priceLevel: undefined, location: north(300) }),
  ];

  it('picks a known name as the safe choice and an independent, detailed place as the gem', () => {
    const picks = pickThree(pool, ctx);
    expect(picks.find((p) => p.kind === 'safe')?.place.id).toBe('chain');
    expect(picks.find((p) => p.kind === 'gem')?.place.id).toBe('local');
  });

  it('explains picks only with what the listing says', () => {
    const picks = pickThree(pool, ctx);
    expect(reasonOf(picks.find((p) => p.kind === 'safe')!)).toBe('A familiar name, so you know what to expect.');
    expect(reasonOf(picks.find((p) => p.kind === 'gem')!)).toBe('A local, independent spot for Filipino food.');
    for (const pick of picks) expect(reasonOf(pick)).not.toMatch(/rated|reviews/i);
  });
});
