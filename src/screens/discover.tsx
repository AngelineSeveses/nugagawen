import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { ChoiceGroup, type ChoiceOption } from '@/components/choice-group';
import { DiceFiveIcon, ForkKnifeIcon, PersonSimpleWalkIcon, SquaresFourIcon, type Icon } from '@/components/icons';
import { ActionBar, Divider, LocationRow, Logo } from '@/components/misc';
import { Text } from '@/components/text';
import { ACTIVITY_LABEL, FILIPINO_SUGGESTION, useLanguage } from '@/localization';
import { usePreferences } from '@/state/preferences';
import { colors, radius, size, spacing } from '@/theme';
import type { Activity, Budget } from '@/types';

const ACTIVITY_ICONS: Record<Activity, Icon> = { eat: ForkKnifeIcon, goOut: PersonSimpleWalkIcon, anything: SquaresFourIcon };
const ACTIVITIES: Activity[] = ['eat', 'goOut', 'anything'];
const BUDGETS: Budget[] = ['thrifty', 'moderate', 'splurge'];

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

/**
 * Screen 01: where, what (Kain / Gala / Kahit Ano), how much, then one button.
 * Below, a separate "Surprise me" for when you don't want to choose at all.
 */
export function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const prefs = usePreferences();
  const { copy } = useLanguage();

  if (!prefs.loaded) return <View style={styles.screen} />;

  // Brand labels stay the same in every language; the description under each follows the app language.
  const activityOptions: ChoiceOption<Activity>[] = ACTIVITIES.map((value) => ({
    value,
    label: ACTIVITY_LABEL[value],
    detail: copy.activityDescription[value],
    icon: ACTIVITY_ICONS[value],
  }));
  const budgetOptions: ChoiceOption<Budget>[] = BUDGETS.map((value) => {
    const b = copy.budget[value];
    // Screen readers would read "₱₱" as "peso sign peso sign", so they get words instead.
    return { value, label: b.label, prefix: b.symbol, detail: b.range, accessibilityLabel: b.a11y };
  });

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
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <Logo height={22} />
        <FilipinoSuggestion />

        <View style={styles.location}>
          <LocationRow
            title={prefs.area ? copy.discover.locationSet(prefs.area.label) : copy.discover.locationUnset}
            subtitle={prefs.area ? copy.discover.locationRadius(prefs.radiusKm) : copy.discover.locationUnsetHint}
            hint={copy.discover.changeLocation}
            onPress={() => router.push('/location')}
          />
        </View>

        <Text variant="display" accessibilityRole="header" style={styles.headline}>
          {copy.discover.headline}
        </Text>
        <Text variant="bodyLarge" color="inkSecondary" style={styles.support}>
          {copy.discover.support}
        </Text>

        <View style={styles.firstGroup}>
          <ChoiceGroup
            label={copy.discover.activityQuestion}
            options={activityOptions}
            value={prefs.activity}
            onChange={prefs.setActivity}
            layout="rows"
          />
        </View>
        <View style={styles.group}>
          <ChoiceGroup
            label={copy.discover.budgetQuestion}
            options={budgetOptions}
            value={prefs.budget}
            onChange={prefs.setBudget}
            layout="rows"
          />
        </View>

        {/* A separate, quieter path: no choices, one random good place nearby. */}
        <Divider spacing={spacing.xl} />
        <Text variant="h4" accessibilityRole="header">
          {copy.discover.surpriseTitle}
        </Text>
        <Text variant="bodyLarge" color="inkSecondary" style={styles.surpriseBody}>
          {copy.discover.surpriseBody}
        </Text>
        <Button variant="secondary" icon={DiceFiveIcon} title={copy.discover.surpriseCta} onPress={surprise} style={styles.surpriseButton} />
      </ScrollView>

      {/* The tab bar below already covers the home-indicator area. */}
      <ActionBar safeArea={false}>
        <Button title={copy.discover.cta} onPress={findThree} style={styles.flex} />
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: size.screenPadding, paddingBottom: spacing.xl },
  location: { marginTop: spacing.lg },
  headline: { marginTop: spacing.xl },
  support: { marginTop: spacing.xs, maxWidth: 340 },
  firstGroup: { marginTop: spacing.xl },
  group: { marginTop: spacing.xl },
  surpriseBody: { marginTop: spacing.xxs, maxWidth: 340 },
  surpriseButton: { alignSelf: 'flex-start', marginTop: spacing.md },
  suggestion: {
    marginTop: spacing.lg,
    padding: spacing.md,
    gap: spacing.xxs,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: colors.sage,
  },
  suggestionActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  flex: { flex: 1 },
});
