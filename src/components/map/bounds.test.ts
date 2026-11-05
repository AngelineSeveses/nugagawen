import { describe, expect, it } from '@jest/globals';
import { boundsOf } from './bounds';

const place = { latitude: 14.56, longitude: 121.03 };

describe('boundsOf', () => {
  it('has no box for a single place, so the map centers on it', () => {
    expect(boundsOf(place)).toBeUndefined();
  });

  it('wraps the destination and the start', () => {
    expect(boundsOf(place, { latitude: 14.5, longitude: 121.1 })).toEqual([121.03, 14.5, 121.1, 14.56]);
  });

  it('includes a route line that swings outside both', () => {
    expect(boundsOf(place, undefined, [[121.0, 14.6], [121.03, 14.56]])).toEqual([121.0, 14.56, 121.03, 14.6]);
  });
});
