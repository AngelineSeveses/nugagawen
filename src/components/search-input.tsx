import { useState } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { borderWidth, colors, radius, size, spacing, typeScale } from '@/theme';
import { IconButton } from './icon-button';
import { MagnifyingGlassIcon, XIcon } from './icons';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** What a screen reader calls this field. */
  label: string;
  clearLabel: string;
  style?: StyleProp<ViewStyle>;
}

/** The app's text search box. The border darkens while typing, so focus is always visible. */
export function SearchInput({ value, onChangeText, placeholder, label, clearLabel, style }: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, focused && styles.focused, style]}>
      <MagnifyingGlassIcon size={20} color={colors.inkSecondary} weight="regular" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSecondary}
        accessibilityLabel={label}
        returnKeyType="search"
        autoCorrect={false}
        style={styles.input}
      />
      {value ? <IconButton icon={XIcon} label={clearLabel} iconSize={18} onPress={() => onChangeText('')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: size.input,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xxs,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: borderWidth.default,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surface,
  },
  // A dark outline that doesn't change the box's size.
  focused: { borderColor: colors.borderStrong, boxShadow: `0px 0px 0px 1px ${colors.borderStrong}` },
  input: { flex: 1, ...typeScale.bodyLarge, color: colors.ink, paddingVertical: spacing.sm },
});
