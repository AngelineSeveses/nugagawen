import type { TextStyle } from 'react-native';

/**
 * Font family names as registered by @expo-google-fonts/plus-jakarta-sans
 * (loaded in src/app/_layout.tsx). Each weight is its own font file, so we set
 * `fontFamily` per weight instead of `fontWeight`; otherwise iOS fakes the weight.
 */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

/**
 * Type scale, by role. Large sizes get tighter tracking, which reads cleaner.
 * Headings are kept modest so the choices stay above the fold on small phones.
 * Line heights are fixed so rows stay aligned; text still scales with the
 * user's system text size (allowFontScaling stays on).
 *
 * display: the big question or answer on a screen (Home, Results, onboarding)
 * h1: screen headings (a place's name, tab titles)
 * h2, h3: state titles, place names in cards
 * h4: section headings
 * bodyLarge: default reading text; body: secondary information
 * label: small emphasis and form labels; caption: non-essential notes only
 * button: button labels; nav: stack header titles; tab: tab bar labels
 */
export const typeScale = {
  display: { fontFamily: fonts.semiBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  h1: { fontFamily: fonts.semiBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.semiBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.semiBold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  h4: { fontFamily: fonts.semiBold, fontSize: 18, lineHeight: 24, letterSpacing: -0.1 },
  bodyLarge: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  bodyLargeStrong: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  button: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 20, letterSpacing: 0.1 },
  nav: { fontFamily: fonts.semiBold, fontSize: 17, lineHeight: 22, letterSpacing: -0.1 },
  tab: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof typeScale;
