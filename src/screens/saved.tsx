import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { BookmarkSimpleIcon } from '@/components/icons';
import { EmptySavedArt } from '@/components/illustrations';
import { PlaceCard } from '@/components/place-card';
import { EmptyState } from '@/components/state-message';
import { useToast } from '@/components/toast';
import { categoryName, useCopy } from '@/localization';
import { formatPrice } from '@/utils/format';
import { useSaved } from '@/state/saved';
import { colors, size, spacing } from '@/theme';
import type { SavedPlace } from '@/types';

/** Screen 05: places kept for later. Remove is a visible button (never only a hidden swipe), with Undo. */
export function SavedScreen() {
  const copy = useCopy();
  // Older saves stored English text; newer ones store the price itself, worded in the current language.
  const categoryOf = (item: SavedPlace) => categoryName({ kind: item.kind, category: item.category, signals: { cuisine: item.cuisine } }, copy);
  const priceOf = (item: SavedPlace) => (item.priceLevel || item.priceRange ? formatPrice(item, copy.price) : item.priceText);
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
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      ListEmptyComponent={
        <EmptyState art={<EmptySavedArt size={120} />} title={copy.saved.emptyTitle} body={copy.saved.emptyBody}>
          <Button variant="secondary" title={copy.saved.emptyAction} onPress={() => router.navigate('/')} />
        </EmptyState>
      }
      renderItem={({ item }) => (
        <PlaceCard
          name={item.name}
          category={categoryOf(item)}
          detail={priceOf(item)}
          photoUri={item.photoUri}
          group={item.group ?? 'eat'}
          kind={item.kind}
          accessibilityLabel={[item.name, categoryOf(item), priceOf(item)].filter(Boolean).join(', ')}
          onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id } })}
          action={{ icon: BookmarkSimpleIcon, weight: 'fill', label: copy.saved.remove(item.name), onPress: () => remove(item) }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: size.screenPadding, paddingTop: spacing.xs, paddingBottom: spacing.lg },
  gap: { height: spacing.xs },
});
