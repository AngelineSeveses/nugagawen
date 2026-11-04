import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { BookmarkSimpleIcon } from '@/components/icons';
import { Divider } from '@/components/misc';
import { PlacePhoto } from '@/components/place-photo';
import { StateMessage } from '@/components/state-message';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { categoryName, useCopy } from '@/localization';
import { formatPrice } from '@/utils/format';
import { useSaved } from '@/state/saved';
import { colors, radius, size, spacing } from '@/theme';
import type { SavedPlace } from '@/types';

/** Screen 05: places kept for later. Remove is a visible button (never only a hidden swipe), with Undo. */
export function SavedScreen() {
  const copy = useCopy();
  // Older saves stored English text; newer ones store the price itself, worded in the current language.
  const categoryOf = (item: SavedPlace) => categoryName({ kind: item.kind, category: item.category, signals: { cuisine: item.cuisine } }, copy);
  const priceOf = (item: SavedPlace) =>
    item.priceLevel || item.priceRange ? formatPrice(item, copy.price) : (item.priceText ?? copy.price.unknown);
  const router = useRouter();
  const saved = useSaved();
  const toast = useToast();

  const remove = (item: SavedPlace) => {
    const removed = saved.remove(item.id);
    toast.show({ message: copy.place.removedToast, actionLabel: copy.place.undo, onAction: () => removed && saved.restore(removed) });
  };

  if (!saved.loaded) return <View style={styles.screen} />;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={saved.items}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <Divider spacing={spacing.xs} />}
      ListEmptyComponent={
        <StateMessage icon={BookmarkSimpleIcon} title={copy.saved.emptyTitle} body={copy.saved.emptyBody}>
          <Button variant="secondary" title={copy.saved.emptyAction} onPress={() => router.navigate('/')} />
        </StateMessage>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${categoryOf(item)}, ${priceOf(item)}`}
            onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id } })}
            style={({ pressed }) => [styles.main, pressed && styles.pressed]}
          >
            <PlacePhoto
              photo={item.photoUri ? { uri: item.photoUri } : undefined}
              placeName={item.name}
              group={item.group ?? 'eat'}
              kind={item.kind}
              aspectRatio={1}
              borderRadius={radius.md}
              style={styles.thumb}
            />
            <View style={styles.text}>
              <Text variant="bodyLargeStrong">{item.name}</Text>
              <Text variant="body" color="inkSecondary">
                {categoryOf(item)}
              </Text>
              <Text variant="body">{priceOf(item)}</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.saved.remove(item.name)}
            hitSlop={4}
            onPress={() => remove(item)}
            style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
          >
            <BookmarkSimpleIcon size={size.icon} color={colors.ink} weight="fill" />
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: size.screenPadding, paddingTop: spacing.xs, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    marginLeft: -spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.pressed },
  thumb: { width: size.thumbSaved, height: size.thumbSaved },
  text: { flex: 1 },
  remove: { width: size.iconButton, height: size.iconButton, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
});
