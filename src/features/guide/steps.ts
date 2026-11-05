/**
 * The Home guide's steps, and the arithmetic for placing its tooltip. These are
 * plain functions with no React in them, so they can be tested on their own.
 */
export const GUIDE_STEPS = ['activity', 'budget', 'location', 'discover', 'explore'] as const;
export type GuideStep = (typeof GUIDE_STEPS)[number];

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Gap kept between the tooltip, the highlighted element and the edges. */
const MARGIN = 12;

/**
 * Where the tooltip's top edge goes: below the highlighted element if it fits,
 * otherwise above it, otherwise at the bottom of the screen. With nothing to
 * highlight (`hole` is null), it sits at the bottom.
 */
export function tooltipTop(hole: Rect | null, areaHeight: number, tooltipHeight: number): number {
  const atBottom = Math.max(MARGIN, areaHeight - tooltipHeight - MARGIN);
  if (!hole) return atBottom;
  const below = hole.y + hole.height + MARGIN;
  if (below + tooltipHeight <= areaHeight - MARGIN) return below;
  const above = hole.y - MARGIN - tooltipHeight;
  if (above >= MARGIN) return above;
  return atBottom;
}

/** How far to scroll so the element sits near the top, leaving room for the tooltip below it. */
export function scrollOffsetFor(target: Rect, currentScrollY: number, topInset: number): number {
  return Math.max(0, currentScrollY + target.y - topInset - MARGIN);
}

/**
 * The four dim rectangles around the highlighted element. Together they cover
 * everything except the hole, which stays tappable.
 */
export function dimRects(hole: Rect, areaWidth: number, areaHeight: number): Rect[] {
  const right = hole.x + hole.width;
  const bottom = hole.y + hole.height;
  return [
    { x: 0, y: 0, width: areaWidth, height: Math.max(0, hole.y) },
    { x: 0, y: bottom, width: areaWidth, height: Math.max(0, areaHeight - bottom) },
    { x: 0, y: hole.y, width: Math.max(0, hole.x), height: hole.height },
    { x: right, y: hole.y, width: Math.max(0, areaWidth - right), height: hole.height },
  ];
}
