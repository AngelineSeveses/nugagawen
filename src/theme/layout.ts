/**
 * Spacing, radius, size, shadow and motion tokens (docs/03-design-system.md §10).
 * Kept in one file while the app is small; split per token class if it grows.
 */

/** 8-point grid with a 4-point sub-grid: 4, 8, 12, 16, 24, 32, 40, 48, 64. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  xxxxl: 64,
} as const;

export const radius = {
  /** Small controls: chips, labels. */
  sm: 8,
  /** Inputs and option tiles. */
  md: 12,
  /** Buttons. */
  button: 14,
  /** Cards and photos. */
  lg: 16,
  xl: 20,
  /** Large panels and sheets. */
  xxl: 24,
  full: 9999,
} as const;

/** Border widths: 1 by default; 2 for selected and focused outlines. */
export const borderWidth = {
  default: 1,
  strong: 2,
} as const;

/** Minimum sizes. Heights are always minimums so larger text can grow a control. */
export const size = {
  touchMin: 44,
  buttonPrimary: 52,
  buttonSecondary: 48,
  input: 52,
  iconButton: 44,
  iconBadge: 40,
  choiceTile: 76,
  listRow: 56,
  thumb: 72,
  tabBar: 56,
  /** Left and right padding of every screen. */
  screenPadding: 16,
  /** Widest the content gets, on tablets and browser windows. */
  contentMax: 560,
  icon: 22,
  iconSmall: 16,
} as const;

/** The only shadow in the app: round buttons sitting on photos. */
export const shadows = {
  onPhoto: '0px 1px 3px rgba(36, 35, 31, 0.16)',
} as const;

export const motion = {
  press: 100,
  fast: 150,
  base: 250,
  stagger: 60,
} as const;
