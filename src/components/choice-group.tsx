import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { PixelRatio, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { borderWidth, colors, radius, size, spacing } from '@/theme';
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
   * rows: full-width rows with room for a description.
   * tiles: side by side, falling back to rows when a label wouldn't fit.
   */
  layout?: 'rows' | 'tiles';
  /** tiles only: width the widest label needs at 100% text size. */
  minLabelWidth?: number;
  /** tiles only: a short segmented control for options such as "3 km" or "English". */
  compact?: boolean;
  /** Hide the visible heading when a surrounding section already shows it (screen readers still get it). */
  showLabel?: boolean;
}

/** A light tap on the phone when a selection changes. */
export function selectionFeedback() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

/** The 2px selected outline, drawn on top so selecting never shifts the layout. */
export function SelectedRing({ visible, borderRadius = radius.md }: { visible: boolean; borderRadius?: number }) {
  if (!visible) return null;
  return <View pointerEvents="none" style={[styles.ring, { borderRadius }]} />;
}

/**
 * Single-choice group (a radio group): one option is always selected.
 * Selected never relies on color alone: tiles and rows get a dark ring and a
 * check; compact segments get a solid dark fill with a check.
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
  const { width: windowWidth } = useWindowDimensions();
  // The group's real width, so tiles still fit when it sits inside a padded card.
  const [measured, setMeasured] = useState<number | undefined>();
  const fontScale = PixelRatio.getFontScale();
  const columns = options.length;
  const groupWidth = measured ?? windowWidth - 2 * size.screenPadding;
  const contentWidth = (padding: number) => (groupWidth - (columns - 1) * spacing.xs) / columns - 2 * padding - 2 * borderWidth.default;
  const needed = minLabelWidth * fontScale;
  // Tighter padding before giving up on side-by-side: short segments can go a step further than tiles.
  const paddings: number[] = compact ? [spacing.sm, spacing.xs, spacing.xxs] : [spacing.sm, spacing.xs];
  const tilePadding = paddings.find((padding) => contentWidth(padding) >= needed);
  const rows = layout === 'rows' || tilePadding === undefined;
  // On the narrowest phones the tile label steps down one size, so whole words still fit on a line.
  const tileLabel = tilePadding === spacing.xs ? 'label' : 'bodyLargeStrong';

  const select = (next: T) => {
    if (next === value) return;
    selectionFeedback();
    onChange(next);
  };

  return (
    <View onLayout={(event) => setMeasured(event.nativeEvent.layout.width)}>
      {showLabel ? (
        <Text variant="h4" accessibilityRole="header">
          {label}
        </Text>
      ) : null}
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.group, rows && styles.groupRows, !showLabel && styles.noLabel]}>
        {options.map((option) => {
          const selected = option.value === value;
          const segment = compact && !rows;
          const OptionIcon = option.icon;
          const foreground = segment && selected ? colors.onInk : colors.ink;
          const leading = OptionIcon ? (
            <OptionIcon size={size.icon} color={foreground} weight={selected ? 'fill' : 'regular'} />
          ) : option.prefix ? (
            <Text variant="label" color="inkSecondary">
              {option.prefix}
            </Text>
          ) : null;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              aria-checked={selected}
              accessibilityLabel={option.accessibilityLabel ?? [option.label, option.detail].filter(Boolean).join(', ')}
              onPress={() => select(option.value)}
              style={({ pressed }) => [
                styles.option,
                rows ? styles.row : [styles.tile, { paddingHorizontal: tilePadding }, segment && styles.segment],
                selected && (segment ? styles.segmentSelected : styles.selected),
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
                  <View style={styles.checkSlot}>{selected ? <CheckCircleIcon size={20} color={colors.ink} weight="fill" /> : null}</View>
                </>
              ) : segment ? (
                <>
                  {leading}
                  {/* Same text style in both states, so selecting never shifts the layout. */}
                  <Text variant="label" style={[styles.centered, selected && styles.onInk]}>
                    {option.label}
                  </Text>
                </>
              ) : (
                <>
                  {leading}
                  <Text variant={tileLabel}>{option.label}</Text>
                  {option.detail ? (
                    <Text variant="body" color="inkSecondary">
                      {option.detail}
                    </Text>
                  ) : null}
                  {selected ? (
                    <View style={styles.checkCorner} pointerEvents="none">
                      <CheckCircleIcon size={18} color={colors.ink} weight="fill" />
                    </View>
                  ) : null}
                </>
              )}
              {segment ? null : <SelectedRing visible={selected} />}
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
    borderWidth: borderWidth.default,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tile: { flex: 1, minHeight: size.choiceTile, paddingVertical: spacing.sm, gap: spacing.xxs },
  segment: { minHeight: size.buttonSecondary, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs },
  segmentSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  centered: { textAlign: 'center' },
  onInk: { color: colors.onInk },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: size.listRow,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  leading: { width: spacing.xl, alignItems: 'flex-start' },
  rowText: { flex: 1 },
  checkSlot: { width: 20, alignItems: 'flex-end' },
  selected: {},
  pressed: { backgroundColor: colors.pressed },
  checkCorner: { position: 'absolute', top: spacing.xs, right: spacing.xs },
  ring: {
    position: 'absolute',
    top: -borderWidth.default,
    left: -borderWidth.default,
    right: -borderWidth.default,
    bottom: -borderWidth.default,
    borderWidth: borderWidth.strong,
    borderColor: colors.borderStrong,
    borderCurve: 'continuous',
  },
});
