/**
 * Color tokens. Values and roles are documented (with verified WCAG contrast
 * ratios) in docs/03-design-system.md §9.2. Never use a hex value outside this file.
 *
 * The MVP is light-only (app.json sets userInterfaceStyle: "light"), so these are
 * plain constants. Dark mode later means adding a second set, not editing components.
 */
export const colors = {
  /** Screen background: warm, low-glare paper. */
  paper: '#F7F4ED',
  /** Raised surfaces: cards, inputs, selected options, sheets. */
  surface: '#FFFFFF',
  /** Nugagawen's own voice: "why this" explanations, and the Safe Choice and Gala tint. */
  sage: '#E6EBDE',
  /** Soft tint of the brand orange: the Surprise Me and Kain tint. Never an action color. */
  tintCoral: '#FBE6DB',
  /** Warm neutral tint: the Hidden Gem and Kahit Ano tint. */
  tintSand: '#F2EAD8',
  /** Primary text, icons, selected outlines and fills. */
  ink: '#24231F',
  /** Secondary text (adjusted from the brief's #777168 to pass 4.5:1). */
  inkSecondary: '#6B655C',
  /** Brand orange: the one primary action per screen. Never used as text on light backgrounds. */
  accent: '#E77D51',
  /** Text and icons placed on `accent` (white fails contrast on this orange). */
  onAccent: '#24231F',
  /** Orange-family text or icons on light backgrounds, when needed. */
  accentInk: '#A84B24',
  /** Text on `ink` fills. */
  onInk: '#FFFFFF',
  /** Default 1px border of cards, tiles and buttons (these are identified by their content). */
  border: '#DED8CC',
  /** Subtle dividers between rows. */
  hairline: '#DED8CC',
  /** Edges that identify a control (text inputs). Passes 3:1. */
  controlBorder: '#8A8377',
  /** Selected and focused outlines. */
  borderStrong: '#24231F',
  success: '#287A52',
  error: '#C13D36',
  warning: '#965A12',
  /** Behind text placed on photos. */
  scrim: 'rgba(36, 35, 31, 0.55)',
  /** Dims the page around the element the guide is highlighting. */
  overlay: 'rgba(36, 35, 31, 0.5)',
  /** Loading placeholders. */
  skeleton: '#EAE5DA',
  /** Pressed-state tint for rows. */
  pressed: 'rgba(36, 35, 31, 0.06)',
} as const;

/** Illustration palette: only for src/components/illustrations, never for interface elements. */
export const illustration = {
  ink: '#24231F',
  white: '#FFFFFF',
  paper: '#F7F4ED',
  coral: '#E77D51',
  coralDeep: '#C25F38',
  coralSoft: '#F4B697',
  sage: '#A9BA9B',
  sageDeep: '#6E8567',
  sageSoft: '#D4DDC8',
  sand: '#E8D8B5',
  sandDeep: '#CDB585',
} as const;

export type ColorToken = keyof typeof colors;
