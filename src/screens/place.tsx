import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { BookmarkSimpleIcon, CaretLeftIcon, ClockIcon, GlobeIcon, MapPinIcon, NavigationArrowIcon, StarIcon, WalletIcon, WarningIcon, WheelchairIcon } from '@/components/icons';
import { ActionBar, DataAttribution, FactRow, Skeleton } from '@/components/misc';
import { PickLabel } from '@/components/pick-label';
import { PlacePhoto } from '@/components/place-photo';
import { StateMessage } from '@/components/state-message';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { dataSource } from '@/config';
import { CategoryTile } from '@/components/category-icon';
import { categoryName, useCopy } from '@/localization';
import { describeWeek } from '@/utils/opening-hours';
import { whyThis } from '@/features/recommendation/explain';
import { placeCache, places, PlacesError } from '@/services/places';
import { usePreferences } from '@/state/preferences';
import { useSaved } from '@/state/saved';
import { colors, radius, shadows, size, spacing } from '@/theme';
import type { PickKind, PlaceDetails } from '@/types';
import { distanceMeters, formatCount, formatDistance, formatPrice, formatRating, formatTime, isPriceEstimate } from '@/utils/format';

const PICK_KINDS: PickKind[] = ['safe', 'surprise', 'gem'];

function directionsUrl(place: { id: string; location: { latitude: number; longitude: number } }) {
  const { latitude, longitude } = place.location;
  const placeId = place.id.startsWith('sample-') ? '' : `&destination_place_id=${encodeURIComponent(place.id)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}${placeId}`;
}

/** Screen 04: answer "is it open, how far, how much?" first, then let the person go. */
export function PlaceScreen() {
  const copy = useCopy();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const prefs = usePreferences();
  const saved = useSaved();
  const params = useLocalSearchParams<{ id: string; kind?: string }>();
  const id = params.id;
  const kind = PICK_KINDS.find((k) => k === params.kind);

  const cached = placeCache.get(id);
  const [details, setDetails] = useState<PlaceDetails | undefined>();
  const [failure, setFailure] = useState<'notFound' | 'error' | undefined>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFailure(undefined);
    places
      .getDetails(id)
      .then((d) => !cancelled && setDetails(d))
      .catch((e: unknown) => !cancelled && setFailure(e instanceof PlacesError && e.reason === 'notFound' ? 'notFound' : 'error'));
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const place = details ?? cached;
  const header = (
    <Stack.Screen
      options={{
        headerTransparent: true,
        headerTitle: '',
        headerLeft: () => (
          <Pressable accessibilityRole="button" accessibilityLabel={copy.place.back} onPress={() => router.back()} style={styles.roundButton}>
            <CaretLeftIcon size={20} color={colors.ink} weight="regular" />
          </Pressable>
        ),
      }}
    />
  );

  if (!place) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 64 }]}>
        {header}
        <View style={styles.pad}>
          {failure ? (
            <StateMessage
              icon={WarningIcon}
              title={failure === 'notFound' ? copy.place.unavailable : copy.results.errorTitle}
              body={failure === 'notFound' ? undefined : copy.results.errorBody}
            >
              {failure === 'error' ? <Button variant="secondary" title={copy.results.retry} onPress={() => setAttempt((a) => a + 1)} /> : null}
            </StateMessage>
          ) : (
            <View style={styles.loading}>
              <Skeleton width="60%" height={28} />
              <Skeleton width="40%" height={16} />
              <Skeleton width="80%" height={16} />
            </View>
          )}
        </View>
      </View>
    );
  }

  const isSaved = saved.isSaved(place.id);
  const distance = prefs.area ? distanceMeters(prefs.area.location, place.location) : undefined;
  const photos = details?.photos.length ? details.photos : place.photo ? [place.photo] : [];
  const why = whyThis(place, prefs.budget, distance, copy);
  const hoursLines = details?.week ? describeWeek(details.week, copy.hours) : details?.weekdayHours;

  const toggleSave = () => {
    if (isSaved) {
      const removed = saved.remove(place.id);
      toast.show({ message: copy.place.removedToast, actionLabel: copy.place.undo, onAction: () => removed && saved.restore(removed) });
    } else {
      saved.save(place);
      toast.show({ message: copy.place.savedToast });
    }
  };

  let openLine: React.ReactNode;
  if (place.openNow === true) {
    openLine = (
      <Text variant="bodyLarge">
        <Text variant="bodyLargeStrong" color="success">
          {copy.place.openNow}
        </Text>
        {place.nextChange ? ` ${copy.place.closesAt(formatTime(place.nextChange))}` : ''}
      </Text>
    );
  } else if (place.openNow === false) {
    openLine = (
      <Text variant="bodyLarge">
        <Text variant="bodyLargeStrong" color="error">
          {copy.place.closedNow}
        </Text>
        {place.nextChange ? ` ${copy.place.opensAt(formatTime(place.nextChange))}` : ''}
      </Text>
    );
  } else {
    openLine = (
      <Text variant="bodyLarge" color="inkSecondary">
        {copy.place.hoursUnknown}
      </Text>
    );
  }

  return (
    <View style={styles.screen}>
      {header}
      <ScrollView contentContainerStyle={styles.scroll}>
        {photos.length === 0 ? (
          <View style={[styles.pad, { paddingTop: insets.top + 64 }]}>
            <CategoryTile kind={place.kind} group={place.group} size={64} />
          </View>
        ) : (
        <View>
          <PlacePhoto photo={photos[0]} placeName={place.name} group={place.group} kind={place.kind} aspectRatio={4 / 3} borderRadius={0} showAttribution />
          {/* Short scrim so the status bar stays readable over any photo. */}
          <View style={[styles.topScrim, { height: insets.top + 56 }]} pointerEvents="none" />
          {photos.length > 1 ? (
            <View style={styles.count}>
              <Text variant="caption" style={styles.countText}>
                1 / {photos.length}
              </Text>
            </View>
          ) : null}
        </View>
        )}

        <View style={styles.pad}>
          {kind ? (
            <View style={styles.label}>
              <PickLabel kind={kind} />
            </View>
          ) : null}
          <Text variant="h1" accessibilityRole="header" style={styles.name}>
            {place.name}
          </Text>
          <Text variant="bodyLarge" color="inkSecondary">
            {categoryName(place, copy)}
          </Text>

          <View style={styles.facts}>
            <FactRow icon={ClockIcon}>{openLine}</FactRow>
            <FactRow icon={MapPinIcon}>
              <Text variant="bodyLarge">{[distance !== undefined ? formatDistance(distance) : undefined, place.address].filter(Boolean).join(', ')}</Text>
            </FactRow>
            <FactRow icon={WalletIcon}>
              <Text variant="bodyLarge">
                {formatPrice(place, copy.price)}
                {place.priceLevel !== 'free' && (place.priceRange || place.priceLevel) ? ` ${copy.place.perPerson}` : ''}
                {isPriceEstimate(place) ? <Text color="inkSecondary">{` ${copy.place.estimate}`}</Text> : null}
              </Text>
            </FactRow>
            {place.rating !== undefined && place.reviewCount ? (
              <FactRow icon={StarIcon}>
                <Text variant="bodyLarge">
                  {copy.place.ratingLine(formatRating(place.rating), formatCount(place.reviewCount), dataSource === 'google')}
                </Text>
              </FactRow>
            ) : null}
            {details?.wheelchairAccessibleEntrance ? (
              <FactRow icon={WheelchairIcon}>
                <Text variant="bodyLarge">{copy.place.accessible}</Text>
              </FactRow>
            ) : null}
            {place.website && /^https?:\/\//.test(place.website) ? (
              <FactRow icon={GlobeIcon}>
                <Text variant="bodyLarge" accessibilityRole="link" onPress={() => Linking.openURL(place.website!)} style={styles.link}>
                  {copy.place.website}
                </Text>
              </FactRow>
            ) : null}
          </View>

          {why ? (
            <View style={styles.why}>
              <Text variant="h4" accessibilityRole="header">
                {copy.place.whyTitle}
              </Text>
              <Text variant="bodyLarge" style={styles.gapXs}>
                {why}
              </Text>
            </View>
          ) : null}

          {details?.description ? (
            <View style={styles.section}>
              <Text variant="h4" accessibilityRole="header">
                {copy.place.aboutTitle}
              </Text>
              <Text variant="bodyLarge" style={styles.gapXs}>
                {details.description}
              </Text>
            </View>
          ) : null}

          {hoursLines?.length ? (
            <View style={styles.section}>
              <Text variant="h4" accessibilityRole="header">
                {copy.place.hoursTitle}
              </Text>
              <View style={styles.gapXs}>
                {hoursLines.map((line) => (
                  <Text key={line} variant="body" color="inkSecondary">
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}

          {details?.hoursText ? (
            <View style={styles.section}>
              <Text variant="h4" accessibilityRole="header">
                {copy.place.hoursTitle}
              </Text>
              <Text variant="body" color="inkSecondary" style={styles.gapXs}>
                {copy.place.listedHours(details.hoursText)}
              </Text>
            </View>
          ) : null}

          {photos.length > 1 ? (
            <View style={styles.section}>
              <Text variant="h4" accessibilityRole="header">
                {copy.place.photosTitle}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
                {photos.slice(1).map((photo) => (
                  <Image
                    key={photo.uri}
                    source={{ uri: photo.uri }}
                    style={styles.stripPhoto}
                    contentFit="cover"
                    accessibilityLabel={copy.place.photoLabel(place.name)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <DataAttribution detailed style={styles.section} />
        </View>
      </ScrollView>

      <ActionBar>
        <Button
          variant="secondary"
          size="lg"
          icon={BookmarkSimpleIcon}
          iconWeight={isSaved ? 'fill' : 'regular'}
          title={isSaved ? copy.place.saved : copy.place.save}
          accessibilityLabel={isSaved ? copy.place.saved : copy.place.saveA11y}
          onPress={toggleSave}
        />
        <Button
          title={copy.place.directions}
          icon={NavigationArrowIcon}
          onPress={() => Linking.openURL(directionsUrl(place))}
          style={styles.flex}
        />
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingBottom: spacing.xl },
  pad: { paddingHorizontal: size.screenPadding },
  flex: { flex: 1 },
  roundButton: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.onPhoto,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    experimental_backgroundImage: 'linear-gradient(rgba(36, 35, 31, 0.35), rgba(36, 35, 31, 0))',
  },
  count: {
    position: 'absolute',
    right: spacing.xs,
    bottom: spacing.xs,
    backgroundColor: colors.scrim,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  countText: { color: colors.onInk },
  link: { textDecorationLine: 'underline' },
  loading: { gap: spacing.sm },
  label: { marginTop: spacing.lg },
  name: { marginTop: spacing.xs },
  facts: { marginTop: spacing.lg, gap: spacing.sm },
  why: { marginTop: spacing.lg, backgroundColor: colors.sage, borderRadius: radius.md, borderCurve: 'continuous', padding: spacing.md },
  section: { marginTop: spacing.xl },
  gapXs: { marginTop: spacing.xs },
  strip: { gap: spacing.xs, marginTop: spacing.sm },
  stripPhoto: { width: 112, height: 112, borderRadius: radius.md },
});
