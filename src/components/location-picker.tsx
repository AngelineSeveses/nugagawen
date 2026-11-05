import { Pressable, StyleSheet, View } from 'react-native';
import { borderWidth, colors, radius, size, spacing } from '@/theme';
import { CaretRightIcon, MapPinIcon } from './icons';
import { Text } from './text';

interface LocationPickerProps {
  title: string;
  subtitle: string;
  /** Screen reader hint: what tapping does. */
  hint: string;
  onPress: () => void;
}

/** Where the search happens, on Home: tap to change it. */
export function LocationPicker({ title, subtitle, hint, onPress }: LocationPickerProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.field, pressed && styles.pressed]}
    >
      <View style={styles.badge}>
        <MapPinIcon size={20} color={colors.ink} weight="regular" />
      </View>
      <View style={styles.text}>
        <Text variant="bodyLargeStrong" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="body" color="inkSecondary" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <CaretRightIcon size={18} color={colors.inkSecondary} weight="regular" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: size.input,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: borderWidth.default,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.paper },
  badge: {
    width: size.iconBadge,
    height: size.iconBadge,
    borderRadius: radius.full,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
});
