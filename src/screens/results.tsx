import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { ArrowsClockwiseIcon, ArrowsOutIcon } from '@/components/icons';
import { LocationArt, NoResultsArt } from '@/components/illustrations';
import { DataAttribution, Skeleton } from '@/components/misc';
import { RecommendationCard } from '@/components/recommendation-card';
import { EmptyState, ErrorState } from '@/components/state-message';
import { Text } from '@/components/text';
import { useCopy } from '@/localization';
import { pickThree } from '@/features/recommendation/pick';
import { placeCache, places, PlacesError } from '@/services/places';
import { RADIUS_STEPS, usePreferences } from '@/state/preferences';
import { borderWidth, colors, motion, radius, size, spacing } from '@/theme';
import type { Place, Recommendation } from '@/types';

/** The result of one search. It belongs to a `key`, so a new search shows as loading without any extra step. */
type Outcome = { key: string; kind: 'ready' } | { key: string; kind: 'error'; offline: boolean };

function CardSkeleton({ lead }: { lead?: boolean }) {
  return (
    <View style={styles.skeletonCard}>
      {lead ? <Skeleton height={undefined} borderRadius={0} style={styles.skeletonPhoto} /> : null}
      <View style={styles.skeletonBody}>
        {lead ? null : <Skeleton width={size.thumb} height={size.thumb} borderRadius={radius.md} />}
        <View style={styles.skeletonText}>
          <Skeleton width={104} height={24} />
          <Skeleton width="70%" height={18} />
          <Skeleton width="45%" height={14} />
        </View>
      </View>
    </View>
  );
}

function ResultsSkeleton({ areaLabel }: { areaLabel: string }) {
  const copy = useCopy();
  return (
    <View accessibilityLabel={copy.results.loading(areaLabel)} accessible>
      <Skeleton width="70%" height={32} />
      <Text variant="bodyLarge" color="inkSecondary" style={styles.subtitle}>
        {copy.results.loading(areaLabel)}
      </Text>
      <View style={styles.picks}>
        <CardSkeleton lead />
        <CardSkeleton />
        <CardSkeleton />
      </View>
    </View>
  );
}

/** Screen 03: three picks. The Safe Choice leads; the others follow, each in the same card. */
export function ResultsScreen() {
  const copy = useCopy();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const prefs = usePreferences();
  const { area, activity, budget, radiusKm } = prefs;

  const [outcome, setOutcome] = useState<Outcome | undefined>();
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
  const searchKey = [lat, lng, radiusMeters, activity, budget, attempt].join();
  const current = outcome?.key === searchKey ? outcome : undefined;

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    let cancelled = false;
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
        setOutcome({ key: searchKey, kind: 'ready' });
      })
      .catch((error: unknown) => {
        if (!cancelled) setOutcome({ key: searchKey, kind: 'error', offline: error instanceof PlacesError && error.reason === 'offline' });
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, radiusMeters, activity, budget, searchKey]);

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
      <EmptyState art={<LocationArt size={120} />} title={copy.discover.locationUnset} body={copy.discover.locationUnsetHint}>
        <Button title={copy.location.confirm} onPress={() => router.replace({ pathname: '/location', params: { next: 'results' } })} />
      </EmptyState>
    );
  } else if (!current) {
    body = <ResultsSkeleton areaLabel={area.label} />;
  } else if (current.kind === 'error') {
    body = (
      <ErrorState
        offline={current.offline}
        title={copy.results.errorTitle}
        body={current.offline ? copy.results.offlineBody : copy.results.errorBody}
      >
        <Button variant="secondary" title={copy.results.retry} onPress={() => setAttempt((a) => a + 1)} />
      </ErrorState>
    );
  } else if (picks.length === 0) {
    body = (
      <EmptyState
        art={<NoResultsArt size={120} />}
        title={copy.results.noneTitle}
        body={`${copy.results.noneBody(radiusKm)}${nextRadius ? '' : ` ${copy.results.noneAtMax}`}`}
      >
        {widen && nextRadius ? <Button title={copy.results.widen(nextRadius)} icon={ArrowsOutIcon} onPress={widen} /> : null}
        <Button variant="secondary" title={copy.results.change} onPress={() => router.back()} />
      </EmptyState>
    );
  } else {
    // "Only two found" describes the first search. After "Show others", a short list just means we ran out.
    const few = round === 0 && picks.length < 3;
    body = (
      <View>
        <Text variant="display" accessibilityRole="header">
          {few ? copy.results.fewTitle(picks.length) : copy.results.title}
        </Text>
        <View style={styles.summary}>
          <Text variant="body" color="inkSecondary" style={styles.flex}>
            {few ? copy.results.fewBody(radiusKm) : copy.results.subtitle(area.label, budget)}
          </Text>
          <Button variant="ghost" title={copy.results.change} onPress={() => router.back()} style={styles.changeButton} />
        </View>
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
              <RecommendationCard recommendation={rec} variant={index === 0 ? 'lead' : 'row'} onPress={() => open(rec)} />
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
        {!few && !exhausted ? <Button variant="secondary" icon={ArrowsClockwiseIcon} title={copy.results.shuffle} onPress={showOthers} style={styles.shuffle} /> : null}
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
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
        {body}
        {current?.kind === 'ready' ? <DataAttribution style={styles.notice} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: size.screenPadding, paddingTop: spacing.xs },
  flex: { flex: 1 },
  subtitle: { marginTop: spacing.xxs },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxs },
  // Lines the word up with the cards' right edge; its padding is only there for a bigger tap area.
  changeButton: { marginRight: -spacing.xs },
  widen: { alignSelf: 'flex-start', marginTop: spacing.sm },
  picks: { marginTop: spacing.sm, gap: spacing.sm },
  exhausted: { marginTop: spacing.md },
  shuffle: { marginTop: spacing.md },
  notice: { marginTop: spacing.lg },
  skeletonCard: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: borderWidth.default,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  skeletonPhoto: { aspectRatio: 16 / 9, width: '100%' },
  skeletonBody: { flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  skeletonText: { flex: 1, gap: spacing.xs },
});
