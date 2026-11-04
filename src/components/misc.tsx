/**
 * Small layout primitives used across screens.
 */
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_NAME, useCopy } from '@/localization';
import { dataSource } from '@/config';
import { colors, radius, size, spacing } from '@/theme';
import { CaretRightIcon, InfoIcon, MapPinIcon, type Icon } from './icons';
import { Text } from './text';

const LOGO_RATIO = 1767 / 315;

/** The Nugagawen wordmark, tinted to any color token (ink on paper, white on orange). */
export function Logo({ height = 24, color = colors.ink }: { height?: number; color?: string }) {
  return (
    <Image
      source={require('@/assets/images/logo.png')}
      style={{ height, width: height * LOGO_RATIO }}
      tintColor={color}
      contentFit="contain"
      accessibilityRole="image"
      accessibilityLabel={BRAND_NAME}
    />
  );
}

/** Pinned bottom bar for a screen's primary action, with a hairline above. */
export function ActionBar({ children, safeArea = true }: { children: ReactNode; safeArea?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.actionBar, { paddingBottom: safeArea ? Math.max(insets.bottom, spacing.md) : spacing.md }]}>
      {children}
    </View>
  );
}

export function Divider({ spacing: gap = spacing.md }: { spacing?: number }) {
  return <View style={[styles.divider, { marginVertical: gap }]} />;
}

/** Icon + text line used in the place details fact list. */
export function FactRow({ icon: RowIcon, children }: { icon: Icon; children: ReactNode }) {
  return (
    <View style={styles.fact}>
      <View style={styles.factIcon}>
        <RowIcon size={20} color={colors.inkSecondary} weight="regular" />
      </View>
      <View style={styles.factText}>{children}</View>
    </View>
  );
}

/** Static loading placeholder (no shimmer, so nothing moves for Reduce Motion users). */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ width, height, borderRadius, backgroundColor: colors.skeleton }, style]} />;
}

/** The Discover location line: tap to change where to search. */
export function LocationRow({ title, subtitle, hint, onPress }: { title: string; subtitle: string; hint: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.locationRow, pressed && styles.pressedRow]}
    >
      <MapPinIcon size={size.icon} color={colors.ink} weight="regular" />
      <View style={styles.flex}>
        <Text variant="bodyLargeStrong">{title}</Text>
        <Text variant="body" color="inkSecondary">
          {subtitle}
        </Text>
      </View>
      <CaretRightIcon size={18} color={colors.inkSecondary} weight="regular" />
    </Pressable>
  );
}

/** Data source credit, required by the OpenStreetMap licence wherever its data is shown. */
export function DataAttribution({ detailed = false, style }: { detailed?: boolean; style?: StyleProp<ViewStyle> }) {
  const copy = useCopy();
  if (dataSource !== 'osm') return null;
  return (
    <View style={[styles.notice, style]}>
      <InfoIcon size={16} color={colors.inkSecondary} weight="regular" />
      <Text variant="caption" color="inkSecondary" style={styles.flex}>
        {detailed ? `${copy.data.osmDetails} ${copy.data.osmAttribution}.` : copy.data.osmAttribution}
      </Text>
    </View>
  );
}

/** A grouped settings row: label on the left, value or action on the right. */
export function SettingsRow({
  label,
  value,
  onPress,
  destructive = false,
  last = false,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  const content = (
    <>
      <Text variant="bodyLarge" style={[styles.flex, destructive && { color: colors.error }]}>
        {label}
      </Text>
      {value ? (
        <Text variant="bodyLarge" color="inkSecondary">
          {value}
        </Text>
      ) : null}
      {onPress && !destructive ? <CaretRightIcon size={16} color={colors.inkSecondary} weight="regular" /> : null}
    </>
  );
  const rowStyle = [styles.settingsRow, !last && styles.settingsRowDivider];
  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [rowStyle, pressed && styles.pressedRow]}
    >
      {content}
    </Pressable>
  );
}

export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="label" color="inkSecondary" accessibilityRole="header" style={styles.groupTitle}>
        {title}
      </Text>
      <View style={styles.groupBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  actionBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: size.screenPadding,
    paddingTop: spacing.md,
    backgroundColor: colors.paper,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline },
  fact: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  factIcon: { paddingTop: 2 },
  factText: { flex: 1 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: size.listRow,
    marginHorizontal: -spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  pressedRow: { backgroundColor: colors.pressed },
  notice: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' },
  group: { gap: spacing.xs },
  groupTitle: { paddingHorizontal: spacing.xxs },
  groupBody: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: size.listRow, paddingVertical: spacing.sm },
  settingsRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
});
