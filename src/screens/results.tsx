import { Stack, useRouter } from 'expo-router';
import { Fragment, useEffect, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { ArrowsClockwiseIcon, ArrowsOutIcon, MapPinIcon, WarningIcon, WifiSlashIcon } from '@/components/icons';
import { DataAttribution, Divider, Skeleton } from '@/components/misc';
import { RecommendationItem } from '@/components/recommendation-item';
import { StateMessage } from '@/components/state-message';
import { Text } from '@/components/text';
import { useCopy } from '@/localization';
import { pickThree } from '@/features/recommendation/pick';
import { placeCache, places, PlacesError } from '@/services/places';
import { RADIUS_STEPS, usePreferences } from '@/state/preferences';
import { colors, motion, radius, size, spacing } from '@/theme';
import type { Place, Recommendation } from '@/types';

type Status = { kind: 'loading' } | { kind: 'ready' } | { kind: 'error'; offline: boolean };

function ResultsSkeleton({ areaLabel }: { areaLabel: string }) {
  const copy = useCopy();
  return (
    <View accessibilityLabel={copy.results.loading(areaLabel)} accessible>
      <Skeleton width="70%" height={32} />
      <Text variant="bodyLarge" color="inkSecondary" style={styles.subtitle}>
        {copy.results.loading(areaLabel)}
      </Text>
      <Skeleton width={112} height={24} style={styles.gapLg} />
      <Skeleton height={undefined} borderRadius={radius.lg} style={[styles.gapSm, { aspectRatio: 16 / 9 }]} />
      <Skeleton width="60%" height={20} style={styles.gapSm} />
      <Skeleton width="40%" height={14} style={styles.gapXs} />
      <Skeleton width="85%" height={14} style={styles.gapSm} />
      {[0, 1].map((i) => (
        <Fragment key={i}>
          <Divider />
          <View style={styles.skeletonRow}>
            <Skeleton width={size.thumbResult} height={size.thumbResult} borderRadius={radius.md} />
            <View style={styles.flex}>
              <Skeleton width={110} height={24} />
              <Skeleton width="70%" height={18} style={styles.gapXs} />
              <Skeleton width="45%" height={14} style={styles.gapXs} />
            </View>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

/** Screen 03: three picks. The Safe choice leads; the alternatives follow as rows. */
export function ResultsScreen() {
  const copy = useCopy();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const prefs = usePreferences();
  const { area, activity, budget, radiusKm } = prefs;

  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [pool, setPool] = useState<Place[]>([]);
  const [picks, setPicks] = useState<Recommendation[]>([]);
  const [shown, setShown] = useState<Set<string>>(new Set());
  const [round, setRound] = useState(0);
  const [exhausted, setExhausted] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const radiusMeters = radiusKm * 1000;
  const nextRadius = RADIUS_STEPS.find((km) => km > radiusKm);
  const lat = area?.location.latitude;
  const lng = area?.location.longitude;

  // One search per visit (and per retry / radius change). "Show others" reuses this pool.
  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    let cancelled = false;
    setStatus({ kind: 'loading' });
    places
      .searchNearby({ center: { latitude: lat, longitude: lng }, radiusMeters, activity })
      .then((list) => {
        if (cancelled) return;
        placeCache.remember(list);
        const first = pickThree(list, { origin: { latitude: lat, longitude: lng }, radiusMeters, budget });
        setPool(list);
        setPicks(first);
        setShown(new Set(first.map((p) => p.place.id)));
        setRound(0);
        setExhausted(false);
        setStatus({ kind: 'ready' });
      })
      .catch((error: unknown) => {
        if (!cancelled) setStatus({ kind: 'error', offline: error instanceof PlacesError && error.reason === 'offline' });
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, radiusMeters, activity, budget, attempt]);

  const showOthers = () => {
    if (!area) return;
    const next = pickThree(pool, { origin: area.location, radiusMeters, budget, exclude: shown });
    if (next.length === 0) {
      setExhausted(true);
      return;
    }
    setPicks(next);
    setShown(new Set([...shown, ...next.map((p) => p.place.id)]));
    setRound((r) => r + 1);
    // Fewer than three new picks means the unseen places have run out.
    if (next.length < 3) setExhausted(true);
    AccessibilityInfo.announceForAccessibility(copy.results.shuffled);
  };

  const open = (rec: Recommendation) => router.push({ pathname: '/place/[id]', params: { id: rec.place.id, kind: rec.kind } });

  const startOver = () => {
    prefs.resetChoices();
    router.back();
  };

  const widen = nextRadius ? () => prefs.setRadius(nextRadius) : undefined;

  let body: React.ReactNode;
  if (!area) {
    body = (
      <StateMessage icon={MapPinIcon} title={copy.discover.locationUnset} body={copy.discover.locationUnsetHint}>
        <Button title={copy.location.confirm} onPress={() => router.replace({ pathname: '/location', params: { next: 'results' } })} />
      </StateMessage>
    );
  } else if (status.kind === 'loading') {
    body = <ResultsSkeleton areaLabel={area.label} />;
  } else if (status.kind === 'error') {
    body = (
      <StateMessage
        icon={status.offline ? WifiSlashIcon : WarningIcon}
        title={copy.results.errorTitle}
        body={status.offline ? copy.results.offlineBody : copy.results.errorBody}
      >
        <Button variant="secondary" title={copy.results.retry} onPress={() => setAttempt((a) => a + 1)} />
      </StateMessage>
    );
  } else if (picks.length === 0) {
    body = (
      <StateMessage
        title={copy.results.noneTitle}
        body={`${copy.results.noneBody(radiusKm)}${nextRadius ? '' : ` ${copy.results.noneAtMax}`}`}
      >
        {widen && nextRadius ? <Button title={copy.results.widen(nextRadius)} icon={ArrowsOutIcon} onPress={widen} /> : null}
        <Button variant="secondary" title={copy.results.change} onPress={() => router.back()} />
      </StateMessage>
    );
  } else {
    // "Only two found" describes the first search. After "Show others", a short list just means we ran out.
    const few = round === 0 && picks.length < 3;
    body = (
      <View>
        <Text variant="display" accessibilityRole="header">
          {few ? copy.results.fewTitle(picks.length) : copy.results.title}
        </Text>
        <Text variant="bodyLarge" color="inkSecondary" style={styles.subtitle}>
          {few ? copy.results.fewBody(radiusKm) : copy.results.subtitle(area.label, budget)}
        </Text>
        {few && widen && nextRadius ? (
          <Button variant="secondary" icon={ArrowsOutIcon} title={copy.results.widen(nextRadius)} onPress={widen} style={styles.widen} />
        ) : null}

        <View style={styles.picks}>
          {picks.map((rec, index) => (
            <Animated.View
              key={`${round}-${rec.place.id}`}
              // The one orchestrated moment: first results arrive in sequence; "Show others" just cross-fades.
              entering={round === 0 ? FadeIn.duration(motion.base).delay(index * motion.stagger) : FadeIn.duration(motion.fast)}
            >
              {index > 0 ? <Divider /> : null}
              <RecommendationItem recommendation={rec} variant={index === 0 ? 'lead' : 'row'} onPress={() => open(rec)} />
            </Animated.View>
          ))}
        </View>

        {exhausted ? (
          <View style={styles.exhausted}>
            <Text variant="body" color="inkSecondary">
              {copy.results.exhausted}
            </Text>
            {widen && nextRadius ? (
              <Button variant="secondary" icon={ArrowsOutIcon} title={copy.results.widen(nextRadius)} onPress={widen} style={styles.widen} />
            ) : null}
          </View>
        ) : null}
        <View style={styles.actions}>
          {!few && !exhausted ? (
            <Button variant="secondary" icon={ArrowsClockwiseIcon} title={copy.results.shuffle} onPress={showOthers} style={styles.flex} />
          ) : null}
          <Button variant="secondary" title={copy.results.change} onPress={() => router.back()} style={styles.flex} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => <Button variant="ghost" title={copy.results.startOver} onPress={startOver} />,
        }}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {body}
        {status.kind === 'ready' ? <DataAttribution style={styles.notice} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: size.screenPadding, paddingTop: spacing.xs },
  flex: { flex: 1 },
  subtitle: { marginTop: spacing.xxs },
  widen: { alignSelf: 'flex-start', marginTop: spacing.md },
  picks: { marginTop: spacing.lg },
  exhausted: { marginTop: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xl },
  notice: { marginTop: spacing.xl },
  gapXs: { marginTop: spacing.xs },
  gapSm: { marginTop: spacing.sm },
  gapLg: { marginTop: spacing.lg },
  skeletonRow: { flexDirection: 'row', gap: spacing.md },
});
