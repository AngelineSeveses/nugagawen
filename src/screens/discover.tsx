import { useRouter } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivitySelector } from '@/components/activity-selector';
import { BudgetSelector } from '@/components/budget-selector';
import { Button } from '@/components/button';
import { DiceFiveIcon } from '@/components/icons';
import { SurpriseArt } from '@/components/illustrations';
import { LocationPicker } from '@/components/location-picker';
import { ActionBar, Logo } from '@/components/misc';
import { SectionHeader } from '@/components/section-header';
import { Text } from '@/components/text';
import { GuideOverlay, type ViewHandle } from '@/features/guide/guide-overlay';
import type { GuideStep } from '@/features/guide/steps';
import { FILIPINO_SUGGESTION, useLanguage } from '@/localization';
import { useFirstRun } from '@/state/first-run';
import { usePreferences } from '@/state/preferences';
import { colors, radius, size, spacing } from '@/theme';

/** One-time suggestion for phones set to Filipino. Written in Filipino, with English for the "no" answer. */
function FilipinoSuggestion() {
  const { suggestFilipino, answerSuggestion } = useLanguage();
  if (!suggestFilipino) return null;
  return (
    <View style={styles.suggestion}>
      <Text variant="bodyLargeStrong">{FILIPINO_SUGGESTION.title}</Text>
      <Text variant="body" color="inkSecondary">
        {FILIPINO_SUGGESTION.body}
      </Text>
      <View style={styles.suggestionActions}>
        <Button variant="secondary" title={FILIPINO_SUGGESTION.accept} onPress={() => answerSuggestion(true)} />
        <Button variant="ghost" title={FILIPINO_SUGGESTION.decline} onPress={() => answerSuggestion(false)} />
      </View>
    </View>
  );
}

/** The one-time offer of a walkthrough. Declining counts as done; Settings can replay it. */
function GuideOffer() {
  const { copy } = useLanguage();
  const { startGuide, finishGuide } = useFirstRun();
  return (
    <View style={styles.suggestion}>
      <Text variant="bodyLargeStrong">{copy.guide.offerTitle}</Text>
      <Text variant="body" color="inkSecondary">
        {copy.guide.offerBody}
      </Text>
      <View style={styles.suggestionActions}>
        <Button variant="secondary" title={copy.guide.offerStart} onPress={startGuide} />
        <Button variant="ghost" title={copy.guide.offerDismiss} onPress={finishGuide} />
      </View>
    </View>
  );
}

/**
 * Screen 01: where, what (Kain / Gala / Kahit Ano), how much, then one button.
 * Below, a separate "Surprise Me" for when you don't want to choose at all.
 */
export function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const prefs = usePreferences();
  const { copy, suggestFilipino } = useLanguage();
  const firstRun = useFirstRun();

  // The elements the guide points at, and what it needs to bring them into view.
  const targets = useRef<Partial<Record<GuideStep, ViewHandle | null>>>({});
  const scrollView = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(0);

  if (!prefs.loaded) return <View style={styles.screen} />;

  const findThree = () => {
    if (prefs.area) router.push('/results');
    else router.push({ pathname: '/location', params: { next: 'results' } });
  };
  const surprise = () => {
    if (prefs.area) router.push('/surprise');
    else router.push({ pathname: '/location', params: { next: 'surprise' } });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollView}
        scrollEnabled={!firstRun.guideRunning}
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={32}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
      >
        <Logo height={20} />
        <FilipinoSuggestion />
        {/* One question at a time: the language suggestion first, then the guide. */}
        {firstRun.offerGuide && !suggestFilipino ? <GuideOffer /> : null}

        <Text variant="display" accessibilityRole="header" style={styles.headline}>
          {copy.discover.headline}
        </Text>
        <Text variant="bodyLarge" color="inkSecondary" style={styles.support}>
          {copy.discover.support}
        </Text>

        <View
          ref={(view) => {
            targets.current.location = view;
          }}
          collapsable={false}
          style={styles.location}
        >
          <LocationPicker
            title={prefs.area ? copy.discover.locationSet(prefs.area.label) : copy.discover.locationUnset}
            subtitle={prefs.area ? copy.discover.locationRadius(prefs.radiusKm) : copy.discover.locationUnsetHint}
            hint={copy.discover.changeLocation}
            onPress={() => router.push('/location')}
          />
        </View>

        <View
          ref={(view) => {
            targets.current.activity = view;
          }}
          collapsable={false}
          style={styles.group}
        >
          <ActivitySelector label={copy.discover.activityQuestion} value={prefs.activity} onChange={prefs.setActivity} />
        </View>
        <View
          ref={(view) => {
            targets.current.budget = view;
          }}
          collapsable={false}
          style={styles.group}
        >
          <BudgetSelector label={copy.discover.budgetQuestion} value={prefs.budget} onChange={prefs.setBudget} />
        </View>

        {/* A separate, quieter path: no choices, one random good place nearby. */}
        <View style={styles.surprise}>
          <View style={styles.surpriseWords}>
            <SectionHeader title={copy.discover.surpriseTitle} hint={copy.discover.surpriseBody} />
            <Button variant="secondary" icon={DiceFiveIcon} title={copy.discover.surpriseCta} onPress={surprise} style={styles.surpriseButton} />
          </View>
          <SurpriseArt size={72} />
        </View>
      </ScrollView>

      {/* The tab bar below already covers the home-indicator area. */}
      <ActionBar safeArea={false}>
        <View
          ref={(view) => {
            targets.current.discover = view;
          }}
          collapsable={false}
          style={styles.flex}
        >
          <Button title={copy.discover.cta} onPress={findThree} />
        </View>
      </ActionBar>

      {firstRun.guideRunning ? (
        <GuideOverlay
          getTarget={(step) => targets.current[step]}
          pinned={['discover']}
          scroller={{ getY: () => scrollY.current, scrollTo: (y) => scrollView.current?.scrollTo({ y, animated: false }) }}
          topInset={insets.top}
          onFinish={() => {
            firstRun.finishGuide();
            scrollView.current?.scrollTo({ y: 0, animated: false });
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: size.screenPadding, paddingBottom: spacing.lg },
  headline: { marginTop: spacing.md },
  support: { marginTop: spacing.xxs },
  location: { marginTop: spacing.md },
  group: { marginTop: spacing.lg },
  surprise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: colors.tintCoral,
  },
  surpriseWords: { flex: 1 },
  surpriseButton: { alignSelf: 'flex-start', marginTop: spacing.sm },
  suggestion: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.xxs,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: colors.sage,
  },
  suggestionActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  flex: { flex: 1 },
});
