import { Text as RNText, type TextProps } from 'react-native';
import { colors, typeScale, type ColorToken, type TypeVariant } from '@/theme';

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  color?: ColorToken;
}

/**
 * The only way screens render text: a named style from the type scale plus a
 * color token. Screens never set fontSize or fontFamily themselves.
 */
export function Text({ variant = 'bodyLarge', color = 'ink', style, ...rest }: AppTextProps) {
  return <RNText style={[typeScale[variant], { color: colors[color] }, style]} {...rest} />;
}
