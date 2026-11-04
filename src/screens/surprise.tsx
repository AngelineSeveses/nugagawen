import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { ArrowsOutIcon, WarningIcon, WifiSlashIcon } from '@/components/icons';
import { StateMessage } from '@/components/state-message';
import { Text } from '@/components/text';
import { pickSurprise } from '@/features/recommendation/pick';
import { useCopy } from '@/localization';
import { placeCache, places, PlacesError } from '@/services/places';
import { RADIUS_STEPS, usePreferences } from '@/state/preferences';
import { colors, size, spacing } from '@/theme';

type Status = { kind: 'loading' } | { kind: 'none' } | { kind: 'error'; offline: boolean };

/**
 * "Surprise me": no choices. Searches everything nearby (any activity, your
 * budget), picks one good place at random and opens it. This screen only shows
 * while that happens, or when nothing could be picked.
 */
export function SurpriseScreen() {
  const copy = useCopy();
  const router = useRouter();
  const { area, budget, radiusKm, setRadius } = usePreferences();
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const lat = area?.location.latitude;
  const lng = area?.location.longitude;
  const nextRadius = RADIUS_STEPS.find((km) => km > radiusKm);

  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      router.replace({ pathname: '/location', params: { next: 'surprise' } });
      return;
    }
    let cancelled = false;
    setStatus({ kind: 'loading' });
    const center = { latitude: lat, longitude: lng };
    places
      .searchNearby({ center, radiusMeters: radiusKm * 1000, activity: 'anything' })
      .then((pool) => {
        if (cancelled) return;
        const pick = pickSurprise(pool, { origin: center, radiusMeters: radiusKm * 1000, budget });
        if (!pick) {
          setStatus({ kind: 'none' });
          return;
        }
        placeCache.remember([pick.place]);
        // Replace this screen, so Back from the place goes straight home.
        router.replace({ pathname: '/place/[id]', params: { id: pick.place.id, kind: 'surprise' } });
      })
      .catch((error: unknown) => {
        if (!cancelled) setStatus({ kind: 'error', offline: error instanceof PlacesError && error.reason === 'offline' });
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, radiusKm, budget, attempt, router]);

  return (
    <View style={styles.screen}>
      {status.kind === 'loading' ? (
        <View style={styles.loading} accessible accessibilityLabel={copy.surprise.loading(area?.label ?? '')}>
          <ActivityIndicator color={colors.ink} />
          <Text variant="bodyLarge" color="inkSecondary">
            {copy.surprise.loading(area?.label ?? '')}
          </Text>
        </View>
      ) : status.kind === 'none' ? (
        <StateMessage title={copy.surprise.noneTitle} body={copy.surprise.noneBody}>
          {nextRadius ? <Button title={copy.results.widen(nextRadius)} icon={ArrowsOutIcon} onPress={() => setRadius(nextRadius)} /> : null}
          <Button variant="secondary" title={copy.results.change} onPress={() => router.back()} />
        </StateMessage>
      ) : (
        <StateMessage
          icon={status.offline ? WifiSlashIcon : WarningIcon}
          title={copy.results.errorTitle}
          body={status.offline ? copy.results.offlineBody : copy.results.errorBody}
        >
          <Button variant="secondary" title={copy.results.retry} onPress={() => setAttempt((a) => a + 1)} />
        </StateMessage>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: size.screenPadding, paddingTop: spacing.lg },
  loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
