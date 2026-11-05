import { PixelRatio, Pressable, StyleSheet, View } from 'react-native';
import { ACTIVITY_LABEL, useCopy } from '@/localization';
import { borderWidth, colors, radius, spacing } from '@/theme';
import type { Activity } from '@/types';
import { selectionFeedback, SelectedRing } from './choice-group';
import { CheckCircleIcon } from './icons';
import { ACTIVITY_ART } from './illustrations';
import { Text } from './text';

const ACTIVITIES: Activity[] = ['eat', 'goOut', 'anything'];
const TINT: Record<Activity, string> = { eat: colors.tintCoral, goOut: colors.sage, anything: colors.tintSand };
/** Above this system text size, three narrow tiles can't hold the words, so they stack as rows. */
const MAX_SCALE_FOR_TILES = 1.3;
const ART_SIZE = 56;

interface ActivitySelectorProps {
  label: string;
  value: Activity;
  onChange: (value: Activity) => void;
}

/** Kain, Gala or Kahit Ano. Brand words stay the same; the description follows the app language. */
export function ActivitySelector({ label, value, onChange }: ActivitySelectorProps) {
  const copy = useCopy();
  const rows = PixelRatio.getFontScale() > MAX_SCALE_FOR_TILES;
  return (
    <View>
      <Text variant="h4" accessibilityRole="header">
        {label}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.group, rows && styles.groupRows]}>
        {ACTIVITIES.map((activity) => {
          const selected = activity === value;
          const description = copy.activityDescription[activity];
          const Art = ACTIVITY_ART[activity];
          return (
            <Pressable
              key={activity}
              accessibilityRole="radio"
              aria-checked={selected}
              accessibilityLabel={`${ACTIVITY_LABEL[activity]}, ${description}`}
              onPress={() => {
                if (selected) return;
                selectionFeedback();
                onChange(activity);
              }}
              style={({ pressed }) => [styles.tile, rows && styles.tileRow, { backgroundColor: TINT[activity] }, pressed && styles.pressed]}
            >
              <View style={styles.words}>
                <Text variant="bodyLargeStrong">{ACTIVITY_LABEL[activity]}</Text>
                <Text variant="body" color="inkSecondary">
                  {description}
                </Text>
              </View>
              <View style={[styles.footer, rows && styles.footerRow]}>
                <View style={styles.check}>{selected ? <CheckCircleIcon size={20} color={colors.ink} weight="fill" /> : null}</View>
                <Art size={ART_SIZE} />
              </View>
              <SelectedRing visible={selected} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  groupRows: { flexDirection: 'column' },
  tile: {
    flex: 1,
    padding: spacing.xs,
    gap: spacing.xxs,
    justifyContent: 'space-between',
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: borderWidth.default,
    borderColor: 'transparent',
  },
  tileRow: { flexDirection: 'row', alignItems: 'center', flex: 0 },
  words: { flexShrink: 1 },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  footerRow: { alignItems: 'center', gap: spacing.xs },
  check: { minWidth: 20, minHeight: 20 },
  pressed: { opacity: 0.8 },
});
