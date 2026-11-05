import { describe, expect, it } from '@jest/globals';
import { dimRects, GUIDE_STEPS, scrollOffsetFor, tooltipTop } from './steps';

describe('guide steps', () => {
  it('walks through the five steps in the agreed order', () => {
    expect(GUIDE_STEPS).toEqual(['activity', 'budget', 'location', 'discover', 'explore']);
  });
});

describe('tooltipTop', () => {
  const hole = { x: 16, y: 100, width: 288, height: 150 };

  it('goes below the element when it fits', () => {
    expect(tooltipTop(hole, 640, 200)).toBe(262);
  });

  it('goes above the element when there is no room below', () => {
    const lowHole = { ...hole, y: 450, height: 60 };
    expect(tooltipTop(lowHole, 640, 200)).toBe(238);
  });

  it('falls back to the bottom on a small screen with no room either way', () => {
    const bigHole = { ...hole, y: 40, height: 300 };
    expect(tooltipTop(bigHole, 400, 200)).toBe(188);
  });

  it('sits at the bottom when there is nothing to highlight', () => {
    expect(tooltipTop(null, 640, 200)).toBe(428);
  });

  it('never goes above the top of the screen', () => {
    expect(tooltipTop(null, 150, 200)).toBe(12);
  });
});

describe('scrollOffsetFor', () => {
  it('scrolls down to bring a lower element near the top', () => {
    expect(scrollOffsetFor({ x: 0, y: 400, width: 10, height: 10 }, 100, 0)).toBe(488);
  });

  it('leaves room for the status bar', () => {
    expect(scrollOffsetFor({ x: 0, y: 400, width: 10, height: 10 }, 0, 44)).toBe(344);
  });

  it('never scrolls past the top of the page', () => {
    expect(scrollOffsetFor({ x: 0, y: 20, width: 10, height: 10 }, 0, 44)).toBe(0);
  });
});

describe('dimRects', () => {
  it('covers everything except the hole', () => {
    const hole = { x: 16, y: 100, width: 288, height: 150 };
    const rects = dimRects(hole, 320, 640);
    const covered = rects.reduce((sum, r) => sum + r.width * r.height, 0);
    expect(covered).toBe(320 * 640 - 288 * 150);
  });

  it('never produces a negative size at the screen edge', () => {
    const rects = dimRects({ x: 0, y: 0, width: 320, height: 640 }, 320, 640);
    for (const r of rects) {
      expect(r.width).toBeGreaterThanOrEqual(0);
      expect(r.height).toBeGreaterThanOrEqual(0);
    }
  });
});
