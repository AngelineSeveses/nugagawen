import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { CategoryIcon } from '@/components/category-icon';
import { IconButton } from '@/components/icon-button';
import { BookmarkSimpleIcon, CaretLeftIcon, ClockIcon, GlobeIcon, ImagesIcon, MapPinIcon, NavigationArrowIcon, PhoneIcon, StarIcon, WalletIcon, WheelchairIcon, type Icon } from '@/components/icons';
import { ActionBar, DataAttribution, FactRow, Skeleton } from '@/components/misc';
import { mapAvailable, PlaceMap } from '@/components/map/place-map';
import { PhotoViewer } from '@/components/photo-viewer';
import { PICK_TINT, PickLabel } from '@/components/pick-label';
import { PlacePhoto } from '@/components/place-photo';
import { SectionHeader } from '@/components/section-header';
import { ErrorState } from '@/components/state-message';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { dataSource } from '@/config';
import { usePlacePhotos } from '@/hooks/use-place-photos';
import { categoryName, useCopy } from '@/localization';
import { describeWeek } from '@/utils/opening-hours';
import { whyThis } from '@/features/recommendation/explain';
import { googlePhotosUrl } from '@/services/maps/links';
import { placeCache, places, PlacesError } from '@/services/places';
import { usePreferences } from '@/state/preferences';
import { useSaved } from '@/state/saved';
import { colors, radius, size, spacing } from '@/theme';
import type { PickKind, PlaceDetails } from '@/types';
import { distanceMeters, formatCount, formatDistance, formatPrice, formatRating, formatTime, isPriceEstimate } from '@/utils/format';

const PICK_KINDS: PickKind[] = ['safe', 'surprise', 'gem'];

/** A phone number or website: a whole row to tap, at least 44 tall. */
function ContactRow({ icon: RowIcon, text, label, role, onPress }: { icon: Icon; text: string; label: string; role: 'button' | 'link'; onPress: () => void }) {
  return (
    <Pressable accessibilityRole={role} accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.contactRow, pressed && styles.pressedRow]}>
      <RowIcon size={20} color={colors.inkSecondary} weight="regular" />
      <Text variant="bodyLarge" style={styles.contactText}>
        {text}
      </Text>
    </Pressable>
  );
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
  const [attempt, setAttempt] = useState(0);
  // Failures belong to one request, so retrying clears the message by itself.
  const requestKey = `${id}-${attempt}`;
  const [failure, setFailure] = useState<{ key: string; reason: 'notFound' | 'error' } | undefined>();
  const failed = failure?.key === requestKey ? failure.reason : undefined;

  useEffect(() => {
    let cancelled = false;
    places
      .getDetails(id)
      .then((d) => !cancelled && setDetails(d))
      .catch((e: unknown) => !cancelled && setFailure({ key: requestKey, reason: e instanceof PlacesError && e.reason === 'notFound' ? 'notFound' : 'error' }));
    return () => {
      cancelled = true;
    };
  }, [id, requestKey]);

  const place = details ?? cached;
  // Google details bring their own photos; OpenStreetMap places load theirs from Wikimedia Commons.
  const { photos } = usePlacePhotos(place, details?.photos ?? []);
  const [viewerAt, setViewerAt] = useState<number | undefined>(undefined);
  const header = (
    <Stack.Screen
      options={{
        headerTransparent: true,
        // Without this the header's own background would cover the top of the photo.
        headerStyle: { backgroundColor: 'transparent' },
        headerTitle: '',
        headerLeft: () => <IconButton icon={CaretLeftIcon} iconSize={20} label={copy.place.back} variant="onPhoto" onPress={() => router.back()} />,
      }}
    />
  );

  if (!place) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.xxxxl }]}>
        {header}
        <View style={styles.pad}>
          {failed ? (
            <ErrorState title={failed === 'notFound' ? copy.place.unavailable : copy.results.errorTitle} body={failed === 'notFound' ? undefined : copy.results.errorBody}>
              {failed === 'error' ? <Button variant="secondary" title={copy.results.retry} onPress={() => setAttempt((a) => a + 1)} /> : null}
            </ErrorState>
          ) : (
            <View style={styles.loading}>
              <Skeleton height={undefined} borderRadius={radius.lg} style={styles.loadingPhoto} />
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
  const why = whyThis(place, prefs.budget, distance, copy);
  const hoursLines = details?.week ? describeWeek(details.week, copy.hours) : details?.weekdayHours;
  // Monday is the first line, and JavaScript counts from Sunday.
  const todayLine = (new Date().getDay() + 6) % 7;
  const website = place.website && /^https?:\/\//.test(place.website) ? place.website : undefined;
  const phone = details?.phone;

  const openDirections = () => router.push({ pathname: '/directions/[id]', params: { id: place.id } });

  const toggleSave = () => {
    if (isSaved) {
      const removed = saved.remove(place.id);
      toast.show({ message: copy.place.removedToast, actionLabel: copy.place.undo, onAction: () => removed && saved.restore(removed) });
    } else {
      saved.save({ ...place, photo: photos[0] ?? place.photo });
      toast.show({ message: copy.place.savedToast });
    }
  };

  let openLine: React.ReactNode = null;
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
  }
  const hasPrice = place.priceLevel !== undefined || place.priceRange !== undefined;

  return (
    <View style={styles.screen}>
      {header}
      <ScrollView contentContainerStyle={styles.scroll}>
        {photos.length === 0 ? (
          // No photo: a plain band with the category icon. Never a stock or generated image.
          <View style={[styles.noPhoto, { paddingTop: insets.top + spacing.xl, backgroundColor: kind ? PICK_TINT[kind] : colors.sage }]}>
            <CategoryIcon kind={place.kind} group={place.group} size={48} />
          </View>
        ) : (
          <View>
            <Pressable accessibilityRole="imagebutton" accessibilityLabel={copy.place.openPhoto(1, photos.length)} onPress={() => setViewerAt(0)}>
              <PlacePhoto photo={photos[0]} placeName={place.name} group={place.group} kind={place.kind} aspectRatio={4 / 3} borderRadius={0} showAttribution />
            </Pressable>
            {/* Short scrim so the status bar stays readable over any photo. */}
            <View style={[styles.topScrim, { height: insets.top + spacing.xxxxl }]} pointerEvents="none" />
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
          <View style={styles.heading}>
            {kind ? <PickLabel kind={kind} /> : null}
            <Text variant="h1" accessibilityRole="header">
              {place.name}
            </Text>
            <Text variant="bodyLarge" color="inkSecondary">
              {categoryName(place, copy)}
            </Text>
          </View>

          <View style={styles.facts}>
            {/* Unknown hours and prices are left out, never guessed. */}
            {openLine ? <FactRow icon={ClockIcon}>{openLine}</FactRow> : null}
            {hasPrice ? (
              <FactRow icon={WalletIcon}>
                <Text variant="bodyLarge">
                  {formatPrice(place, copy.price)}
                  {place.priceLevel !== 'free' ? ` ${copy.place.perPerson}` : ''}
                  {isPriceEstimate(place) ? <Text color="inkSecondary">{` ${copy.place.estimate}`}</Text> : null}
                </Text>
              </FactRow>
            ) : null}
            {distance !== undefined ? (
              <FactRow icon={MapPinIcon}>
                <Text variant="bodyLarge">{copy.place.away(formatDistance(distance))}</Text>
              </FactRow>
            ) : null}
            {place.rating !== undefined && place.reviewCount ? (
              <FactRow icon={StarIcon}>
                <Text variant="bodyLarge">{copy.place.ratingLine(formatRating(place.rating), formatCount(place.reviewCount), dataSource === 'google')}</Text>
              </FactRow>
            ) : null}
            {details?.wheelchairAccessibleEntrance ? (
              <FactRow icon={WheelchairIcon}>
                <Text variant="bodyLarge">{copy.place.accessible}</Text>
              </FactRow>
            ) : null}
          </View>

          {details?.description ? (
            <View style={styles.section}>
              <SectionHeader title={copy.place.aboutTitle} />
              <Text variant="bodyLarge" style={styles.sectionBody}>
                {details.description}
              </Text>
            </View>
          ) : null}

          {why ? (
            <View style={styles.why}>
              <SectionHeader title={copy.place.whyTitle} />
              <Text variant="bodyLarge" style={styles.gapXxs}>
                {why}
              </Text>
            </View>
          ) : null}

          {/* Photos: a gallery when free photos exist, and always a way to see more on Google Maps. */}
          <View style={styles.section}>
            <SectionHeader title={copy.place.photosTitle} />
            {photos.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stripScroll} contentContainerStyle={styles.strip}>
                {photos.slice(1).map((photo, i) => (
                  <Pressable
                    key={photo.uri}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={copy.place.openPhoto(i + 2, photos.length)}
                    onPress={() => setViewerAt(i + 1)}
                    style={({ pressed }) => pressed && styles.pressedPhoto}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.stripPhoto} contentFit="cover" transition={150} />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
            {photos.length > 0 && photos[0].sourceUrl ? (
              <Text variant="caption" color="inkSecondary" style={styles.gapXs}>
                {copy.place.photosFrom}
              </Text>
            ) : null}
            <Button variant="secondary" icon={ImagesIcon} title={copy.place.seePhotosOnGoogle} onPress={() => Linking.openURL(googlePhotosUrl(place))} style={styles.googlePhotos} />
          </View>

          {place.address || mapAvailable ? (
            <View style={styles.section}>
              <SectionHeader title={place.address ? copy.place.addressTitle : copy.place.mapTitle} />
              {place.address ? (
                <Text variant="bodyLarge" style={styles.sectionBody}>
                  {place.address}
                </Text>
              ) : null}
              {mapAvailable ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.directions.mapPreviewLabel(place.name)}
                  onPress={openDirections}
                  style={({ pressed }) => [styles.mapPreview, pressed && styles.pressedPhoto]}
                >
                  {/* The map ignores touches here, so a tap anywhere on it opens directions. */}
                  <View style={styles.mapNoTouch}>
                    <PlaceMap destination={place.location} interactive={false} accessibilityLabel={copy.directions.mapPreviewLabel(place.name)} style={styles.mapFill} />
                  </View>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {hoursLines?.length ? (
            <View style={styles.section}>
              <SectionHeader title={copy.place.hoursTitle} />
              <View style={styles.sectionBody}>
                {hoursLines.map((line, index) => (
                  <Text key={line} variant={index === todayLine ? 'label' : 'body'} color={index === todayLine ? 'ink' : 'inkSecondary'}>
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          ) : details?.hoursText ? (
            <View style={styles.section}>
              <SectionHeader title={copy.place.hoursTitle} />
              <Text variant="body" color="inkSecondary" style={styles.sectionBody}>
                {copy.place.listedHours(details.hoursText)}
              </Text>
            </View>
          ) : null}

          {phone || website ? (
            <View style={styles.section}>
              <SectionHeader title={copy.place.contactTitle} />
              <View style={styles.contact}>
                {phone ? <ContactRow icon={PhoneIcon} text={phone} label={copy.place.callA11y(phone)} role="button" onPress={() => Linking.openURL(`tel:${phone.replace(/[^+\d]/g, '')}`)} /> : null}
                {website ? <ContactRow icon={GlobeIcon} text={copy.place.website} label={copy.place.website} role="link" onPress={() => Linking.openURL(website)} /> : null}
              </View>
            </View>
          ) : null}

          <DataAttribution detailed style={styles.section} />
        </View>
      </ScrollView>

      <PhotoViewer photos={photos} placeName={place.name} openAt={viewerAt} onClose={() => setViewerAt(undefined)} />

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
        <Button title={copy.place.directions} icon={NavigationArrowIcon} onPress={openDirections} style={styles.flex} />
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingBottom: spacing.lg },
  pad: { paddingHorizontal: size.screenPadding },
  flex: { flex: 1 },
  noPhoto: { alignItems: 'center', justifyContent: 'center', paddingBottom: spacing.lg },
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
    paddingVertical: spacing.xxs,
  },
  countText: { color: colors.onInk },
  loading: { gap: spacing.sm },
  loadingPhoto: { aspectRatio: 4 / 3, width: '100%' },
  heading: { marginTop: spacing.md, gap: spacing.xxs },
  facts: { marginTop: spacing.md, gap: spacing.xs },
  why: { marginTop: spacing.lg, backgroundColor: colors.sage, borderRadius: radius.lg, borderCurve: 'continuous', padding: spacing.md },
  section: { marginTop: spacing.lg },
  sectionBody: { marginTop: spacing.xs },
  gapXs: { marginTop: spacing.xs },
  gapXxs: { marginTop: spacing.xxs },
  // Lets photos run to the screen edge while they scroll, starting in line with the text.
  stripScroll: { marginHorizontal: -size.screenPadding, marginTop: spacing.sm },
  strip: { gap: spacing.xs, paddingHorizontal: size.screenPadding },
  stripPhoto: { width: 112, height: 112, borderRadius: radius.md },
  pressedPhoto: { opacity: 0.8 },
  mapPreview: { marginTop: spacing.sm, height: 168 },
  mapNoTouch: { flex: 1, pointerEvents: 'none' },
  mapFill: { flex: 1 },
  googlePhotos: { alignSelf: 'flex-start', marginTop: spacing.sm },
  contact: { marginTop: spacing.xxs },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: size.touchMin, borderRadius: radius.sm },
  contactText: { flex: 1, textDecorationLine: 'underline' },
  pressedRow: { backgroundColor: colors.pressed },
});
