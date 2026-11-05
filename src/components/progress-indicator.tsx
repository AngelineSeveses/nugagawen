import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

const DOT = 8;
const CURRENT = 24;

interface ProgressIndicatorProps {
  /** Zero-based step being shown. */
  step: number;
  total: number;
  /** What a screen reader says, such as "Step 2 of 3". */
  label: string;
}

/** Steps in onboarding and the guide. The current step is longer, so it never relies on color alone. */
export function ProgressIndicator({ step, total, label }: ProgressIndicatorProps) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 1, max: total, now: step + 1 }} style={styles.row}>
      {Array.from({ length: total }, (_, index) => (
        <View key={index} style={[styles.dot, index <= step && styles.done, index === step && styles.current]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: DOT, height: DOT, borderRadius: radius.full, backgroundColor: colors.controlBorder, opacity: 0.45 },
  done: { backgroundColor: colors.ink, opacity: 1 },
  current: { width: CURRENT },
});
