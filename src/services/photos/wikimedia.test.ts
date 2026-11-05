import { describe, expect, it } from '@jest/globals';
import { cleanArtist, parsePhotoRefs } from './wikimedia';

describe('parsePhotoRefs', () => {
  it('splits the stored link into files, categories and Wikidata items', () => {
    expect(parsePhotoRefs('Category:Baclaran Church|wikidata:Q6978434|File:Front.jpg')).toEqual({
      files: ['File:Front.jpg'],
      categories: ['Category:Baclaran Church'],
      wikidata: ['Q6978434'],
    });
  });
});

describe('cleanArtist', () => {
  it('keeps only the readable name from Commons HTML', () => {
    expect(cleanArtist('<a href="//commons.wikimedia.org/wiki/User:Ramon">Ramon F. Velasquez</a>')).toBe('Ramon F. Velasquez');
    expect(cleanArtist('')).toBeUndefined();
  });
});

// The live check against Wikimedia runs outside Jest (Jest replaces fetch): node scripts/check-photos.mjs
