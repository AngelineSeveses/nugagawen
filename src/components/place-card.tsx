import { Pressable, StyleSheet, View } from 'react-native';
import { borderWidth, colors, radius, size, spacing } from '@/theme';
import { IconButton } from './icon-button';
import type { Icon, IconWeight } from './icons';
import { PlacePhoto } from './place-photo';
import { Text } from './text';

interface PlaceCardProps {
  name: string;
  category: string;
  /** One more fact, such as the price. */
  detail?: string;
  photoUri?: string;
  group: 'eat' | 'goOut';
  kind?: string;
  onPress: () => void;
  /** Words a screen reader uses for the whole card. */
  accessibilityLabel: string;
  action: { icon: Icon; weight?: IconWeight; label: string; onPress: () => void };
}

/** A place in a list: a square image, the facts and one action. Same image size everywhere. */
export function PlaceCard({ name, category, detail, photoUri, group, kind, onPress, accessibilityLabel, action }: PlaceCardProps) {
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <PlacePhoto
          photo={photoUri ? { uri: photoUri } : undefined}
          placeName={name}
          group={group}
          kind={kind}
          aspectRatio={1}
          borderRadius={radius.md}
          style={styles.thumb}
        />
        <View style={styles.text}>
          <Text variant="bodyLargeStrong">{name}</Text>
          <Text variant="body" color="inkSecondary">
            {category}
          </Text>
          {detail ? <Text variant="body">{detail}</Text> : null}
        </View>
      </Pressable>
      <IconButton icon={action.icon} weight={action.weight} label={action.label} onPress={action.onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.xxs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: borderWidth.default,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.xs },
  pressed: { backgroundColor: colors.pressed },
  thumb: { width: size.thumb, height: size.thumb },
  text: { flex: 1 },
});
