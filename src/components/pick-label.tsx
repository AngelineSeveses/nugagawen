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

/** "Safe choice" / "Surprise me" / "Hidden gem": icon plus words, on sage (Nugagawen's voice). */
export function PickLabel({ kind }: { kind: PickKind }) {
  const copy = useCopy();
  const KindIcon = ICONS[kind];
  return (
    <View style={styles.label}>
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
    gap: spacing.xxs + 2,
    backgroundColor: colors.sage,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    paddingVertical: 2,
    paddingLeft: spacing.xs - 2,
    paddingRight: spacing.xs,
  },
});
