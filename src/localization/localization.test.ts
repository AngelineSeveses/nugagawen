import { describe, expect, it } from '@jest/globals';
import { ACTIVITY_LABEL } from './brand';
import { en } from './en';
import { fil } from './fil';

/** Every string (or function result) in a copy object, with its key path. */
function leaves(obj: unknown, path = ''): [string, string][] {
  if (typeof obj === 'string') return [[path, obj]];
  if (typeof obj === 'function') {
    // Call functions with sample arguments so their output is checked too.
    const sample = [2, 3, 'moderate', 'sample'];
    const args = Array.from({ length: obj.length }, (_, i) => sample[i] ?? 'sample');
    const out = path.endsWith('compose')
      ? obj({ budget: { budget: 'moderate', estimate: true }, rating: '4.5', openNow: true, distance: '850 m' })
      : path.endsWith('subtitle')
        ? obj('Baguio', 'moderate')
        : obj(...args);
    return [[path, String(out)]];
  }
  if (Array.isArray(obj)) return obj.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (obj && typeof obj === 'object') return Object.entries(obj).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}

/** Strings that are rightly the same in both languages: names, numbers and loanwords Filipinos use. */
const SAME_IN_BOTH = new Set([
  'radius', // "2 km"
  'budget.moderate.range', // "₱250–600"
  'place.website',
  'settings.dataGoogle',
  'settings.dataOsm',
  'categories.fast_food',
  'categories.food_court',
  'categories.zoo',
  'categories.theme_park',
  'categories.bowling',
  'categories.mall',
  'budget.thrifty.symbol',
  'budget.moderate.symbol',
  'budget.splurge.symbol',
]);

describe('translations', () => {
  const enLeaves = new Map(leaves(en));
  const filLeaves = new Map(leaves(fil));

  it('has the same keys in English and Filipino', () => {
    expect([...filLeaves.keys()].sort()).toEqual([...enLeaves.keys()].sort());
  });

  it('has no empty strings', () => {
    for (const [key, value] of [...enLeaves, ...filLeaves]) expect({ key, empty: value.trim() === '' }).toEqual({ key, empty: false });
  });

  it('has no English left untranslated in Filipino', () => {
    const untranslated = [...filLeaves].filter(([key, value]) => !SAME_IN_BOTH.has(key) && value === enLeaves.get(key)).map(([key]) => key);
    expect(untranslated).toEqual([]);
  });

  it('never translates the brand activity labels', () => {
    expect(ACTIVITY_LABEL).toEqual({ eat: 'Kain', goOut: 'Gala', anything: 'Kahit Ano' });
    // The descriptions under them do change with the language.
    expect(en.activityDescription.eat).not.toBe(fil.activityDescription.eat);
  });

  it('uses the agreed key copy', () => {
    expect(en.discover.headline).toBe('No plans yet?');
    expect(fil.discover.headline).toBe('Wala pang plano?');
    expect([fil.budget.thrifty.label, fil.budget.moderate.label, fil.budget.splurge.label]).toEqual(['Tipid', 'Sakto', 'Sosyal']);
    expect([en.budget.thrifty.label, en.budget.moderate.label, en.budget.splurge.label]).toEqual(['Budget-friendly', 'Moderate', 'Premium']);
    expect(fil.discover.surpriseCta).toBe('Sorpresahin ako');
    expect(fil.place.directions).toBe('Pumunta dito');
  });
});
