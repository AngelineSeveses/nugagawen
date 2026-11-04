import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, size, spacing } from '@/theme';
import type { Icon, IconWeight } from './icons';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  /** primary = the one orange action on a screen; secondary = outlined; ghost = text only. */
  variant?: Variant;
  /** lg (56 pt) for primary actions, md (48 pt) otherwise. */
  size?: 'md' | 'lg';
  icon?: Icon;
  /** `fill` for an active state (e.g. Saved). */
  iconWeight?: IconWeight;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  /** Fuller label for screen readers when the visible title is short. */
  accessibilityLabel?: string;
  /** Layout only (margins, flex). Colors come from the variant. */
  style?: StyleProp<ViewStyle>;
}

const foreground: Record<Variant, string> = {
  primary: colors.onAccent,
  secondary: colors.ink,
  ghost: colors.ink,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size: sizeName = variant === 'primary' ? 'lg' : 'md',
  icon: IconComponent,
  iconWeight = 'regular',
  loading = false,
  disabled = false,
  accessibilityHint,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const inactive = disabled || loading;
  const fg = foreground[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeName === 'lg' ? styles.lg : styles.md,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {IconComponent ? <IconComponent size={size.icon} color={fg} weight={iconWeight} /> : null}
          <Text variant="button" style={{ color: fg }}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  lg: { minHeight: size.buttonPrimary },
  // Smaller side padding on medium buttons so two fit side by side without wrapping.
  md: { minHeight: size.buttonSecondary, paddingHorizontal: spacing.md },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surface, borderColor: colors.hairline },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: spacing.xs, minHeight: size.touchMin },
  // Feedback on press-in, not release: slight dim and shrink.
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.4 },
});
