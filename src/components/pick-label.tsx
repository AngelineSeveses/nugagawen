import { StyleSheet, View } from 'react-native';
import { useCopy } from '@/localization';
import { colors, radius, size, spacing } from '@/theme';
import type { PickKind } from '@/types';
import { CheckCircleIcon, DiamondIcon, DiceFiveIcon, type Icon } from './icons';
import { Text } from './text';

const ICONS: Record<PickKind, Icon> = {
  safe: CheckCircleIcon,
  surprise: DiceFiveIcon,
  gem: DiamondIcon,
};

/** Each kind of pick has its own tint. The word and icon say the same thing, so color is never the only cue. */
export const PICK_TINT: Record<PickKind, string> = {
  safe: colors.sage,
  surprise: colors.tintCoral,
  gem: colors.tintSand,
};

/** "Safe Choice" / "Surprise Me" / "Hidden Gem". */
export function PickLabel({ kind }: { kind: PickKind }) {
  const copy = useCopy();
  const KindIcon = ICONS[kind];
  return (
    <View style={[styles.label, { backgroundColor: PICK_TINT[kind] }]}>
      <KindIcon size={size.iconSmall} color={colors.ink} weight="regular" />
      <Text variant="label">{copy.pick[kind]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xxs,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
});
