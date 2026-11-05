import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { ArrowsOutIcon } from '@/components/icons';
import { NoResultsArt, SurpriseArt } from '@/components/illustrations';
import { EmptyState, ErrorState } from '@/components/state-message';
import { Text } from '@/components/text';
import { pickSurprise } from '@/features/recommendation/pick';
import { useCopy } from '@/localization';
import { placeCache, places, PlacesError } from '@/services/places';
import { RADIUS_STEPS, usePreferences } from '@/state/preferences';
import { colors, size, spacing } from '@/theme';

/** How a search ended. It belongs to a `key`, so a new search shows as loading without any extra step. */
type Outcome = { key: string; kind: 'none' } | { key: string; kind: 'error'; offline: boolean };

/**
 * "Surprise Me": no choices. Searches everything nearby (any activity, your
 * budget), picks one good place at random and opens it. This screen only shows
 * while that happens, or when nothing could be picked.
 */
export function SurpriseScreen() {
  const copy = useCopy();
  const router = useRouter();
  const { area, budget, radiusKm, setRadius } = usePreferences();
  const [outcome, setOutcome] = useState<Outcome | undefined>();
  const [attempt, setAttempt] = useState(0);
  const lat = area?.location.latitude;
  const lng = area?.location.longitude;
  const nextRadius = RADIUS_STEPS.find((km) => km > radiusKm);
  const searchKey = [lat, lng, radiusKm, budget, attempt].join();
  const current = outcome?.key === searchKey ? outcome : undefined;

  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      router.replace({ pathname: '/location', params: { next: 'surprise' } });
      return;
    }
    let cancelled = false;
    const center = { latitude: lat, longitude: lng };
    places
      .searchNearby({ center, radiusMeters: radiusKm * 1000, activity: 'anything' })
      .then((pool) => {
        if (cancelled) return;
        const pick = pickSurprise(pool, { origin: center, radiusMeters: radiusKm * 1000, budget });
        if (!pick) {
          setOutcome({ key: searchKey, kind: 'none' });
          return;
        }
        placeCache.remember([pick.place]);
        // Replace this screen, so Back from the place goes straight home.
        router.replace({ pathname: '/place/[id]', params: { id: pick.place.id, kind: 'surprise' } });
      })
      .catch((error: unknown) => {
        if (!cancelled) setOutcome({ key: searchKey, kind: 'error', offline: error instanceof PlacesError && error.reason === 'offline' });
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, radiusKm, budget, searchKey, router]);

  return (
    <View style={styles.screen}>
      {!current ? (
        <View style={styles.loading} accessible accessibilityLabel={copy.surprise.loading(area?.label ?? '')}>
          <SurpriseArt size={120} />
          <View style={styles.loadingLine}>
            <ActivityIndicator color={colors.ink} />
            <Text variant="bodyLarge" color="inkSecondary" style={styles.flex}>
              {copy.surprise.loading(area?.label ?? '')}
            </Text>
          </View>
        </View>
      ) : current.kind === 'none' ? (
        <EmptyState art={<NoResultsArt size={120} />} title={copy.surprise.noneTitle} body={copy.surprise.noneBody}>
          {nextRadius ? <Button title={copy.results.widen(nextRadius)} icon={ArrowsOutIcon} onPress={() => setRadius(nextRadius)} /> : null}
          <Button variant="secondary" title={copy.results.change} onPress={() => router.back()} />
        </EmptyState>
      ) : (
        <ErrorState offline={current.offline} title={copy.results.errorTitle} body={current.offline ? copy.results.offlineBody : copy.results.errorBody}>
          <Button variant="secondary" title={copy.results.retry} onPress={() => setAttempt((a) => a + 1)} />
        </ErrorState>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: size.screenPadding, paddingTop: spacing.md },
  loading: { gap: spacing.md, paddingTop: spacing.lg },
  loadingLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
