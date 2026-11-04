import { Pressable, StyleSheet, View } from 'react-native';
import { explain } from '@/features/recommendation/explain';
import { categoryName, useCopy, type Copy } from '@/localization';
import { colors, radius, size, spacing } from '@/theme';
import type { Recommendation } from '@/types';
import { formatCount, formatDistance, formatPrice, formatRating } from '@/utils/format';
import { CategoryTile } from './category-icon';
import { MapPinIcon, StarIcon, WalletIcon, type Icon } from './icons';
import { PickLabel } from './pick-label';
import { PlacePhoto } from './place-photo';
import { Text } from './text';

function MetaItem({ icon: ItemIcon, text }: { icon: Icon; text: string }) {
  return (
    <View style={styles.metaItem}>
      <ItemIcon size={size.iconSmall} color={colors.inkSecondary} weight="regular" />
      <Text variant="body">{text}</Text>
    </View>
  );
}

function describe(rec: Recommendation, copy: Copy, reason: string): string {
  const { place } = rec;
  const rating = place.rating !== undefined ? `Rated ${formatRating(place.rating)}.` : '';
  return [
    `${copy.pick[rec.kind]}.`,
    `${place.name}, ${categoryName(place, copy)}.`,
    rating,
    `${formatDistance(rec.distanceMeters)} away.`,
    `${formatPrice(place, copy.price)}.`,
    reason,
  ]
    .filter(Boolean)
    .join(' ');
}

interface Props {
  recommendation: Recommendation;
  /** lead = the Safe choice, with a large photo; row = the two alternatives. */
  variant: 'lead' | 'row';
  onPress: () => void;
}

/** One of the three answers. The whole item is a single tap target. */
export function RecommendationItem({ recommendation: rec, variant, onPress }: Props) {
  const copy = useCopy();
  const { place } = rec;
  const category = categoryName(place, copy);
  const reason = explain(rec.kind, place, rec.facts, copy);
  const rating =
    place.rating !== undefined
      ? `${formatRating(place.rating)}${variant === 'lead' && place.reviewCount ? ` (${formatCount(place.reviewCount)})` : ''}`
      : undefined;
  const meta = (
    <View style={styles.meta}>
      {rating ? <MetaItem icon={StarIcon} text={rating} /> : null}
      <MetaItem icon={MapPinIcon} text={formatDistance(rec.distanceMeters)} />
      <MetaItem icon={WalletIcon} text={formatPrice(place, copy.price)} />
    </View>
  );

  // The large photo layout only when there is a photo; otherwise the category tile tells the kind of place.
  if (variant === 'lead' && place.photo) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={describe(rec, copy, reason)}
        onPress={onPress}
        style={({ pressed }) => [styles.lead, pressed && styles.leadPressed]}
      >
        <PickLabel kind={rec.kind} />
        <PlacePhoto photo={place.photo} placeName={place.name} group={place.group} showAttribution style={styles.leadPhoto} />
        <View style={styles.leadText}>
          <Text variant="h3">{place.name}</Text>
          <Text variant="body" color="inkSecondary">
            {category}
          </Text>
          <View style={styles.spacer} />
          {meta}
          <Text variant="body" style={styles.reason}>
            {reason}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={describe(rec, copy, reason)}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {place.photo ? (
        <PlacePhoto
          photo={place.photo}
          placeName={place.name}
          group={place.group}
          kind={place.kind}
          aspectRatio={1}
          borderRadius={radius.md}
          style={[styles.thumb, variant === 'lead' && styles.thumbLead]}
        />
      ) : (
        <View style={styles.tileWrap}>
          <CategoryTile kind={place.kind} group={place.group} size={variant === 'lead' ? size.thumbResult + 16 : size.thumbResult} />
        </View>
      )}
      <View style={styles.rowText}>
        <PickLabel kind={rec.kind} />
        <Text variant={variant === 'lead' ? 'h3' : 'h4'} style={styles.rowName}>
          {place.name}
        </Text>
        <Text variant="body" color="inkSecondary">
          {category}
        </Text>
        {meta}
        <Text variant="body" style={styles.reasonRow}>
          {reason}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lead: { gap: spacing.sm },
  leadPressed: { opacity: 0.85 },
  leadPhoto: { marginTop: 0 },
  leadText: { gap: spacing.xxs },
  spacer: { height: spacing.xxs },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: spacing.xxs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  reason: { marginTop: spacing.xxs },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    marginHorizontal: -spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  rowPressed: { backgroundColor: colors.pressed },
  // alignSelf stops the row from stretching the square thumbnail to the text's height.
  thumb: { width: size.thumbResult, height: size.thumbResult, alignSelf: 'flex-start' },
  thumbLead: { width: size.thumbResult + 16, height: size.thumbResult + 16 },
  tileWrap: { alignSelf: 'flex-start' },
  rowText: { flex: 1, gap: 2 },
  rowName: { marginTop: spacing.xxs },
  reasonRow: { marginTop: spacing.xxs },
});
