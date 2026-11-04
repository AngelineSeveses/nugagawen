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
  /** Raised surfaces: inputs, selected options, sheets. */
  surface: '#FFFFFF',
  /** Nugagawen's own voice: pick labels and "why this" explanations. */
  sage: '#E6EBDE',
  /** Primary text, icons, selected outlines. */
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
  /** Decorative dividers only. */
  hairline: '#DED8CC',
  /** Edges that identify a control (text inputs). Passes 3:1. */
  controlBorder: '#8A8377',
  success: '#287A52',
  error: '#C13D36',
  warning: '#965A12',
  /** Behind text placed on photos. */
  scrim: 'rgba(36, 35, 31, 0.55)',
  /** Loading placeholders. */
  skeleton: '#EAE5DA',
  /** Pressed-state tint for rows. */
  pressed: 'rgba(36, 35, 31, 0.06)',
} as const;

export type ColorToken = keyof typeof colors;
