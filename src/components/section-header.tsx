import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { size, spacing } from '@/theme';
import { Text } from './text';

interface SectionHeaderProps {
  title: string;
  /** One supporting line under the title. */
  hint?: string;
  /** A small action on the right, such as "See all". */
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}

/** The heading of a section. Screen readers can jump between these. */
export function SectionHeader({ title, hint, action, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.text}>
        <Text variant="h4" accessibilityRole="header">
          {title}
        </Text>
        {hint ? (
          <Text variant="body" color="inkSecondary">
            {hint}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action.label} onPress={action.onPress} style={styles.action}>
          <Text variant="label" color="accentInk">
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { flex: 1, gap: spacing.xxs },
  action: { minHeight: size.touchMin, minWidth: size.touchMin, alignItems: 'flex-end', justifyContent: 'center' },
});
