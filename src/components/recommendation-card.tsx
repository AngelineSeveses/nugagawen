import { Pressable, StyleSheet, View } from 'react-native';
import { explain } from '@/features/recommendation/explain';
import { usePlacePhotos } from '@/hooks/use-place-photos';
import { categoryName, useCopy, type Copy } from '@/localization';
import { useSaved } from '@/state/saved';
import { borderWidth, colors, radius, size, spacing } from '@/theme';
import type { Recommendation } from '@/types';
import { formatCount, formatDistance, formatPrice, formatRating } from '@/utils/format';
import { CategoryTile } from './category-icon';
import { IconButton } from './icon-button';
import { BookmarkSimpleIcon, CaretRightIcon, MapPinIcon, StarIcon, WalletIcon, type Icon } from './icons';
import { PICK_TINT, PickLabel } from './pick-label';
import { PlacePhoto } from './place-photo';
import { Text } from './text';
import { useToast } from './toast';

function MetaItem({ icon: ItemIcon, text }: { icon: Icon; text: string }) {
  return (
    <View style={styles.metaItem}>
      <ItemIcon size={size.iconSmall} color={colors.inkSecondary} weight="regular" />
      <Text variant="body">{text}</Text>
    </View>
  );
}

/** Everything on the card as one sentence, in the app's language, for screen readers. */
function describe(rec: Recommendation, copy: Copy, reason: string): string {
  const { place } = rec;
  const hasPrice = place.priceLevel !== undefined || place.priceRange !== undefined;
  return [
    `${copy.pick[rec.kind]}.`,
    `${place.name}, ${categoryName(place, copy)}.`,
    place.rating !== undefined ? copy.results.ratedA11y(formatRating(place.rating)) : '',
    copy.results.awayA11y(formatDistance(rec.distanceMeters)),
    hasPrice ? `${formatPrice(place, copy.price)}.` : '',
    reason,
  ]
    .filter(Boolean)
    .join(' ');
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  /** lead: the first pick, with a large photo when one exists. row: a thumbnail beside the text. */
  variant: 'lead' | 'row';
  onPress: () => void;
}

/** One of the three answers. Tapping the card opens the place; the bookmark saves it without leaving. */
export function RecommendationCard({ recommendation: rec, variant, onPress }: RecommendationCardProps) {
  const copy = useCopy();
  const saved = useSaved();
  const toast = useToast();
  const { place } = rec;
  const category = categoryName(place, copy);
  const reason = explain(rec.kind, place, rec.facts, copy);
  // OpenStreetMap places with a Wikimedia link get their first photo here; others keep the category tile.
  const photo = usePlacePhotos(place).photos[0];
  const isSaved = saved.isSaved(place.id);
  const largePhoto = variant === 'lead' && photo !== undefined;
  const rating =
    place.rating !== undefined
      ? `${formatRating(place.rating)}${variant === 'lead' && place.reviewCount ? ` (${formatCount(place.reviewCount)})` : ''}`
      : undefined;

  const toggleSave = () => {
    if (isSaved) {
      const removed = saved.remove(place.id);
      toast.show({ message: copy.place.removedToast, actionLabel: copy.place.undo, onAction: () => removed && saved.restore(removed) });
    } else {
      saved.save({ ...place, photo: photo ?? place.photo });
      toast.show({ message: copy.place.savedToast });
    }
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={describe(rec, copy, reason)}
        accessibilityHint={copy.results.seeDetails}
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {largePhoto ? <PlacePhoto photo={photo} placeName={place.name} group={place.group} kind={place.kind} borderRadius={0} showAttribution /> : null}
        <View style={styles.body}>
          <View style={styles.top}>
            {largePhoto ? null : photo ? (
              <PlacePhoto photo={photo} placeName={place.name} group={place.group} kind={place.kind} aspectRatio={1} borderRadius={radius.md} style={styles.thumb} />
            ) : (
              <CategoryTile kind={place.kind} group={place.group} size={size.thumb} tint={PICK_TINT[rec.kind]} />
            )}
            <View style={styles.heading}>
              <PickLabel kind={rec.kind} />
              <Text variant={variant === 'lead' ? 'h3' : 'h4'} style={styles.name}>
                {place.name}
              </Text>
              <Text variant="body" color="inkSecondary">
                {category}
              </Text>
            </View>
          </View>
          <View style={styles.meta}>
            {rating ? <MetaItem icon={StarIcon} text={rating} /> : null}
            <MetaItem icon={MapPinIcon} text={formatDistance(rec.distanceMeters)} />
            {place.priceLevel !== undefined || place.priceRange !== undefined ? <MetaItem icon={WalletIcon} text={formatPrice(place, copy.price)} /> : null}
          </View>
          <Text variant="body">{reason}</Text>
          <View style={styles.footer}>
            <Text variant="label">{copy.results.seeDetails}</Text>
            <CaretRightIcon size={size.iconSmall} color={colors.ink} weight="regular" />
          </View>
        </View>
      </Pressable>

      <IconButton
        icon={BookmarkSimpleIcon}
        weight={isSaved ? 'fill' : 'regular'}
        selected={isSaved}
        label={isSaved ? copy.saved.remove(place.name) : copy.results.saveA11y(place.name)}
        variant={largePhoto ? 'onPhoto' : 'plain'}
        onPress={toggleSave}
        style={styles.save}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: borderWidth.default,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { backgroundColor: colors.pressed },
  body: { padding: spacing.sm, gap: spacing.xs },
  top: { flexDirection: 'row', gap: spacing.sm },
  // alignSelf stops the row from stretching the square thumbnail to the text's height.
  thumb: { width: size.thumb, height: size.thumb, alignSelf: 'flex-start' },
  // Keeps long names clear of the bookmark in the corner.
  heading: { flex: 1, gap: spacing.xxs, paddingRight: spacing.lg },
  name: { marginTop: spacing.xxs },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: spacing.xxs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xxs, minHeight: spacing.lg },
  save: { position: 'absolute', top: spacing.xxs, right: spacing.xxs },
});
