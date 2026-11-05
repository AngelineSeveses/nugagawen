import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, motion, radius, spacing } from '@/theme';
import { OnboardingChooseArt, OnboardingDecideArt, OnboardingDiscoverArt } from './illustrations';
import { Text } from './text';

/** Each slide has its own art on its own tint, so the three feel different at a glance. */
const SLIDES = [
  { Art: OnboardingDiscoverArt, tint: colors.tintCoral },
  { Art: OnboardingChooseArt, tint: colors.sage },
  { Art: OnboardingDecideArt, tint: colors.tintSand },
];

interface OnboardingSlideProps {
  /** Zero-based slide number. */
  index: number;
  title: string;
  body: string;
  /** What the illustration shows, for screen readers. */
  artLabel: string;
  children?: ReactNode;
}

/** One intro slide: illustration, heading and a short explanation. */
export function OnboardingSlide({ index, title, body, artLabel, children }: OnboardingSlideProps) {
  const { Art, tint } = SLIDES[index];
  // The art scales to the real width of the panel, so it fits every phone.
  const [panelWidth, setPanelWidth] = useState(0);
  return (
    <Animated.View entering={FadeIn.duration(motion.fast)} style={styles.slide}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={artLabel}
        onLayout={(event) => setPanelWidth(event.nativeEvent.layout.width)}
        style={[styles.panel, { backgroundColor: tint }]}
      >
        {panelWidth > 0 ? <Art width={panelWidth} /> : null}
      </View>
      <Text variant="display" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyLarge" color="inkSecondary">
        {body}
      </Text>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slide: { gap: spacing.xs },
  panel: { aspectRatio: 4 / 3, borderRadius: radius.xxl, borderCurve: 'continuous', overflow: 'hidden' },
  title: { marginTop: spacing.md },
});
