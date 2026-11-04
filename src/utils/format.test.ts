import { describe, expect, it } from '@jest/globals';
import { en } from '@/localization/en';
import { fil } from '@/localization/fil';
import { distanceMeters, formatDistance, formatPrice, formatTime, isPriceEstimate } from './format';

describe('distance', () => {
  it('measures about 1.11 km per 0.01° of latitude', () => {
    const d = distanceMeters({ latitude: 14.55, longitude: 121.02 }, { latitude: 14.56, longitude: 121.02 });
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1125);
  });

  it('formats meters and kilometers', () => {
    expect(formatDistance(846)).toBe('850 m');
    expect(formatDistance(1420)).toBe('1.4 km');
  });
});

describe('price', () => {
  it('shows real ranges as-is and marks level-based prices as estimates', () => {
    expect(formatPrice({ priceRange: { min: 200, max: 400 } }, en.price)).toBe('₱200–₱400');
    expect(formatPrice({ priceLevel: 'moderate' }, en.price)).toBe('~₱250–600');
    expect(formatPrice({}, en.price)).toBe('No price listed');
    expect(formatPrice({ priceLevel: 'free' }, fil.price)).toBe('Libre');
    expect(isPriceEstimate({ priceLevel: 'moderate' })).toBe(true);
    expect(isPriceEstimate({ priceRange: { min: 200 } })).toBe(false);
  });
});

describe('time', () => {
  it('formats a 12-hour clock time', () => {
    const iso = new Date(2026, 10, 4, 22, 0).toISOString();
    expect(formatTime(iso)).toBe('10:00 PM');
  });
});
