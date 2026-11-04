import * as Haptics from 'expo-haptics';
import { PixelRatio, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { colors, radius, size, spacing } from '@/theme';
import { CheckCircleIcon, type Icon } from './icons';
import { Text } from './text';

export interface ChoiceOption<T extends string | number> {
  value: T;
  label: string;
  icon?: Icon;
  /** Short symbol before the label, e.g. "₱₱". */
  prefix?: string;
  /** Description under the label, e.g. "Food & dining" or "₱250–600". */
  detail?: string;
  accessibilityLabel?: string;
}

export interface ChoiceGroupProps<T extends string | number> {
  label: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * rows: full-width rows with room for a description (Discover's selectors).
   * tiles: side by side, falling back to rows when a label wouldn't fit.
   */
  layout?: 'rows' | 'tiles';
  /** tiles only: width the widest label needs at 100% text size. */
  minLabelWidth?: number;
  /** tiles only: short, centered options such as "3 km" or "English". */
  compact?: boolean;
  /** Hide the visible heading when a surrounding section already shows it (screen readers still get it). */
  showLabel?: boolean;
}

/**
 * Single-choice group (a radio group): one option is always selected.
 * Selected = white surface, ink outline and a filled check, never color alone.
 */
export function ChoiceGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  layout = 'tiles',
  minLabelWidth = 76,
  compact = false,
  showLabel = true,
}: ChoiceGroupProps<T>) {
  const { width } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();
  const columns = options.length;
  const available = width - 2 * size.screenPadding - (columns - 1) * spacing.xs;
  const contentWidth = (padding: number) => available / columns - 2 * padding - 3;
  const needed = minLabelWidth * fontScale;
  const tilePadding = contentWidth(spacing.sm) >= needed ? spacing.sm : contentWidth(spacing.xs) >= needed ? spacing.xs : undefined;
  const rows = layout === 'rows' || tilePadding === undefined;

  const select = (next: T) => {
    if (next === value) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    onChange(next);
  };

  return (
    <View>
      {showLabel ? (
        <Text variant="h4" accessibilityRole="header">
          {label}
        </Text>
      ) : null}
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.group, rows && styles.groupRows, !showLabel && styles.noLabel]}>
        {options.map((option) => {
          const selected = option.value === value;
          const OptionIcon = option.icon;
          const leading = OptionIcon ? (
            <OptionIcon size={size.icon} color={colors.ink} weight={selected ? 'fill' : 'regular'} />
          ) : option.prefix ? (
            <Text variant="label" color="inkSecondary">
              {option.prefix}
            </Text>
          ) : null;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, selected }}
              accessibilityLabel={option.accessibilityLabel ?? [option.label, option.detail].filter(Boolean).join(', ')}
              onPress={() => select(option.value)}
              style={({ pressed }) => [
                styles.option,
                rows ? styles.row : [styles.tile, { paddingHorizontal: tilePadding }, compact && styles.compact],
                selected && styles.selected,
                pressed && !selected && styles.pressed,
              ]}
            >
              {rows ? (
                <>
                  {leading ? <View style={styles.leading}>{leading}</View> : null}
                  <View style={styles.rowText}>
                    <Text variant="bodyLargeStrong">{option.label}</Text>
                    {option.detail ? (
                      <Text variant="body" color="inkSecondary">
                        {option.detail}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.checkSlot}>
                    {selected ? <CheckCircleIcon size={20} color={colors.ink} weight="fill" /> : null}
                  </View>
                </>
              ) : (
                <>
                  {leading}
                  {/* Same text style in both states, so selecting never shifts the layout. */}
                  <Text variant="bodyLargeStrong" style={compact && styles.centered}>
                    {option.label}
                  </Text>
                  {option.detail ? (
                    <Text variant="body" color="inkSecondary">
                      {option.detail}
                    </Text>
                  ) : null}
                  {selected && !compact ? (
                    <View style={styles.checkCorner} pointerEvents="none">
                      <CheckCircleIcon size={18} color={colors.ink} weight="fill" />
                    </View>
                  ) : null}
                </>
              )}
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
  noLabel: { marginTop: 0 },
  option: {
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: 'transparent',
  },
  tile: { flex: 1, minHeight: size.choiceTile, paddingVertical: spacing.sm, gap: spacing.xxs },
  compact: { minHeight: size.buttonSecondary, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs },
  centered: { textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  leading: { width: 32, alignItems: 'flex-start' },
  rowText: { flex: 1 },
  checkSlot: { width: 20, alignItems: 'flex-end' },
  // Selected: white surface, ink outline, filled check.
  selected: { backgroundColor: colors.surface, borderColor: colors.ink },
  pressed: { backgroundColor: colors.pressed },
  checkCorner: { position: 'absolute', top: spacing.xs, right: spacing.xs },
});
