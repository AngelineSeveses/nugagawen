import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { ChoiceGroup } from '@/components/choice-group';
import {
  ArrowBendUpLeftIcon,
  ArrowBendUpRightIcon,
  ArrowClockwiseIcon,
  ArrowSquareOutIcon,
  ArrowUDownLeftIcon,
  ArrowUpIcon,
  BicycleIcon,
  BoatIcon,
  CarIcon,
  FlagCheckeredIcon,
  NavigationArrowIcon,
  PersonSimpleWalkIcon,
  type Icon,
} from '@/components/icons';
import { PlaceMap } from '@/components/map/place-map';
import { Divider, Skeleton } from '@/components/misc';
import { LocationArt } from '@/components/illustrations';
import { EmptyState, ErrorState } from '@/components/state-message';
import { Text } from '@/components/text';
import { useDirections } from '@/hooks/use-directions';
import { useCopy } from '@/localization';
import { FIX_THE_MAP_URL, googleDirectionsUrl } from '@/services/maps/links';
import type { RouteStep, TravelMode } from '@/services/routing/types';
import { usePreferences } from '@/state/preferences';
import { colors, size, spacing } from '@/theme';
import { formatDistance } from '@/utils/format';

const MODES: TravelMode[] = ['walking', 'driving', 'cycling'];
const MODE_ICONS: Record<TravelMode, Icon> = { walking: PersonSimpleWalkIcon, driving: CarIcon, cycling: BicycleIcon };

function iconForStep(step: RouteStep): Icon {
  switch (step.type) {
    case 'depart':
      return NavigationArrowIcon;
    case 'arrive':
      return FlagCheckeredIcon;
    case 'ferry':
      return BoatIcon;
    case 'roundabout':
    case 'exit-roundabout':
      return ArrowClockwiseIcon;
    default:
      if (step.modifier === 'uturn') return ArrowUDownLeftIcon;
      if (step.modifier?.includes('left')) return ArrowBendUpLeftIcon;
      if (step.modifier?.includes('right')) return ArrowBendUpRightIcon;
      return ArrowUpIcon;
  }
}

/**
 * The trip in one screen: the map, how long and how far, and written directions.
 * Google Maps stays one tap away for live navigation and public transport.
 */
export function DirectionsScreen() {
  const copy = useCopy();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { area } = usePreferences();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { place, origin, mode, setMode, route, status, retry } = useDirections(id);

  const openGoogle = place ? () => Linking.openURL(googleDirectionsUrl(place, mode)) : undefined;
  const googleButton = openGoogle ? (
    <Button variant="secondary" icon={ArrowSquareOutIcon} title={copy.directions.openGoogle} onPress={openGoogle} />
  ) : null;

  const modePicker = mode ? (
    <ChoiceGroup
      label={copy.directions.modeQuestion}
      options={MODES.map((value) => ({ value, label: copy.directions.mode[value], icon: MODE_ICONS[value] }))}
      value={mode}
      onChange={setMode}
      minLabelWidth={72}
      compact
      showLabel={false}
    />
  ) : null;

  let body: React.ReactNode;
  if (status === 'noPlace') {
    body = <ErrorState title={copy.place.unavailable} />;
  } else if (status === 'noOrigin') {
    body = (
      <EmptyState art={<LocationArt size={120} />} title={copy.directions.noOriginTitle} body={copy.directions.noOriginBody}>
        <Button title={copy.discover.locationUnset} onPress={() => router.push('/location')} />
      </EmptyState>
    );
  } else if (status === 'offline' || status === 'error' || status === 'noRoute') {
    body = (
      <View>
        {modePicker}
        <ErrorState
          offline={status === 'offline'}
          title={status === 'noRoute' ? copy.directions.noRouteTitle : copy.directions.errorTitle}
          body={status === 'noRoute' ? copy.directions.noRouteBody : status === 'offline' ? copy.results.offlineBody : copy.directions.errorBody}
        >
          {status === 'noRoute' ? null : <Button variant="secondary" title={copy.results.retry} onPress={retry} />}
          {googleButton}
        </ErrorState>
      </View>
    );
  } else if (status === 'ready' && route && place) {
    body = (
      <View>
        <Text variant="h1" accessibilityRole="header">
          {copy.directions.duration(route.durationSeconds)}
        </Text>
        <Text variant="bodyLarge" color="inkSecondary" style={styles.gapXxs}>
          {copy.directions.summary(formatDistance(route.distanceMeters), place.name)}
        </Text>
        <Text variant="body" color="inkSecondary" style={styles.gapXs}>
          {origin?.source === 'gps' ? copy.directions.fromHere : `${copy.directions.fromArea(area?.label ?? '')} ${copy.directions.fromAreaHint}`}
        </Text>
        {mode === 'driving' ? (
          <Text variant="body" color="inkSecondary">
            {copy.directions.noTraffic}
          </Text>
        ) : null}

        <View style={styles.section}>{modePicker}</View>

        <View style={styles.section}>
          <Text variant="h4" accessibilityRole="header">
            {copy.directions.stepsTitle}
          </Text>
          <View style={styles.steps}>
            {route.steps.map((step, index) => {
              const StepIcon = iconForStep(step);
              const instruction = copy.directions.instruction(step, place.name);
              const distance = step.distanceMeters > 0 ? formatDistance(step.distanceMeters) : undefined;
              return (
                <View key={`${index}-${step.type}`}>
                  {index > 0 ? <Divider spacing={spacing.sm} /> : null}
                  {/* Read as one sentence by screen readers: the instruction, then how far. */}
                  <View accessible accessibilityLabel={[instruction, distance].filter(Boolean).join(', ')} style={styles.step}>
                    <View style={styles.stepIcon}>
                      <StepIcon size={size.icon} color={colors.ink} weight="regular" />
                    </View>
                    <View style={styles.flex}>
                      <Text variant="bodyLarge">{instruction}</Text>
                      {distance ? (
                        <Text variant="body" color="inkSecondary">
                          {distance}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="body" color="inkSecondary">
            {copy.directions.noTransit}
          </Text>
          <View style={styles.gapSm}>{googleButton}</View>
        </View>

        <View style={styles.section}>
          <Text variant="caption" color="inkSecondary">
            {copy.directions.credit}
          </Text>
          <Pressable accessibilityRole="link" accessibilityLabel={copy.directions.fixMap} onPress={() => Linking.openURL(FIX_THE_MAP_URL)} style={styles.fixMap}>
            <Text variant="caption" color="inkSecondary" style={styles.link}>
              {copy.directions.fixMap}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  } else {
    // Still finding the start or the route: keep the layout steady with a skeleton.
    body = (
      <View accessible accessibilityLabel={copy.directions.loading}>
        <Skeleton width={120} height={32} />
        <Text variant="bodyLarge" color="inkSecondary" style={styles.gapXs}>
          {copy.directions.loading}
        </Text>
        <View style={styles.section}>{modePicker}</View>
        <View style={styles.section}>
          <Skeleton width="80%" height={16} />
          <Skeleton width="60%" height={16} style={styles.gapSm} />
          <Skeleton width="70%" height={16} style={styles.gapSm} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: copy.directions.title }} />
      {place ? (
        <PlaceMap
          destination={place.location}
          origin={origin?.location}
          line={route?.coordinates}
          accessibilityLabel={copy.directions.mapLabel(place.name)}
          style={[styles.map, { height: Math.min(height * 0.4, 340) }]}
        />
      ) : null}
      <ScrollView style={styles.flex} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {body}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  flex: { flex: 1 },
  map: { borderRadius: 0 },
  content: { paddingHorizontal: size.screenPadding, paddingTop: spacing.lg },
  section: { marginTop: spacing.lg },
  gapXxs: { marginTop: spacing.xxs },
  gapXs: { marginTop: spacing.xs },
  gapSm: { marginTop: spacing.sm },
  steps: { marginTop: spacing.sm },
  step: { flexDirection: 'row', gap: spacing.sm },
  stepIcon: { paddingTop: 1, width: spacing.lg },
  link: { textDecorationLine: 'underline' },
  // Small text, but still a full-size tap target.
  fixMap: { alignSelf: 'flex-start', minHeight: size.touchMin, justifyContent: 'center' },
});
