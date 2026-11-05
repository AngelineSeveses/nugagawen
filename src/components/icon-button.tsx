import { Pressable, StyleSheet, type Insets, type StyleProp, type ViewStyle } from 'react-native';
import { borderWidth, colors, radius, shadows, size } from '@/theme';
import type { Icon, IconWeight } from './icons';

interface IconButtonProps {
  icon: Icon;
  /** Required: an icon has no visible words, so this is what a screen reader says. */
  label: string;
  onPress: () => void;
  /** plain: no background. surface: white circle with a border. onPhoto: white circle over a photo. onDark: light icon on dark. */
  variant?: 'plain' | 'surface' | 'onPhoto' | 'onDark';
  /** `fill` for an active state (e.g. saved). */
  weight?: IconWeight;
  iconSize?: number;
  /** True when this button turns something on or off, such as Save. */
  selected?: boolean;
  hitSlop?: Insets | number;
  style?: StyleProp<ViewStyle>;
}

/** A 44 x 44 round button with only an icon: back, close, save, clear. */
export function IconButton({ icon: ButtonIcon, label, onPress, variant = 'plain', weight = 'regular', iconSize = size.icon, selected, hitSlop, style }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-selected={selected}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, style]}
    >
      <ButtonIcon size={iconSize} color={variant === 'onDark' ? colors.onInk : colors.ink} weight={weight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plain: {},
  surface: { backgroundColor: colors.surface, borderWidth: borderWidth.default, borderColor: colors.border },
  onPhoto: { backgroundColor: colors.surface, boxShadow: shadows.onPhoto },
  onDark: {},
  pressed: { opacity: 0.7 },
});
