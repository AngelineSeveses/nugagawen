import type { ComponentRef, Ref } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type View, type ViewStyle } from 'react-native';
import { borderWidth, colors, radius, size, spacing } from '@/theme';
import type { Icon, IconWeight } from './icons';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  /** primary = the one orange action on a screen; secondary = outlined; ghost = text only; dark = a main action inside a card or tooltip. */
  variant?: Variant;
  /** lg (52 tall) for primary actions, md (48 tall) otherwise. */
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
  /** Lets a parent move keyboard focus to this button. */
  ref?: Ref<ComponentRef<typeof View>>;
}

const foreground: Record<Variant, string> = {
  primary: colors.onAccent,
  secondary: colors.ink,
  ghost: colors.ink,
  dark: colors.onInk,
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
  ref,
}: ButtonProps) {
  const inactive = disabled || loading;
  const fg = foreground[variant];
  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      aria-disabled={inactive}
      aria-busy={loading}
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
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    borderCurve: 'continuous',
    borderWidth: borderWidth.default,
    borderColor: 'transparent',
  },
  lg: { minHeight: size.buttonPrimary },
  md: { minHeight: size.buttonSecondary },
  primary: { backgroundColor: colors.accent },
  dark: { backgroundColor: colors.ink },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: spacing.xs, minHeight: size.touchMin },
  // Feedback on press-in, not release: slight dim and shrink.
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.4 },
});
