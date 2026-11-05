import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button } from '@/components/button';
import { ChoiceGroup } from '@/components/choice-group';
import { CrosshairIcon, MapPinIcon } from '@/components/icons';
import { ActionBar, Divider } from '@/components/misc';
import { SearchInput } from '@/components/search-input';
import { Text } from '@/components/text';
import { useCopy } from '@/localization';
import { canOpenSystemSettings, getCurrentArea, getPermission, openSystemSettings, requestPermission } from '@/services/location';
import { places, type AreaSuggestion } from '@/services/places';
import { RADIUS_STEPS, usePreferences } from '@/state/preferences';
import { borderWidth, colors, radius, size, spacing } from '@/theme';
import type { RadiusKm, SearchArea } from '@/types';

type GpsState = 'idle' | 'locating' | 'denied' | 'error';
/** Search results belong to the text they were found for, so older answers are ignored automatically. */
type SearchOutcome = { query: string; suggestions: AreaSuggestion[] } | { query: string; failed: true };

/** Screen 02 (modal): set where to search. Permission is asked only when the user taps "Use my current location". */
export function LocationScreen() {
  const copy = useCopy();
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const prefs = usePreferences();

  const [selected, setSelected] = useState<SearchArea | undefined>(prefs.area);
  const [radiusKm, setRadiusKm] = useState<RadiusKm>(prefs.radiusKm);
  const [gps, setGps] = useState<GpsState>('idle');
  const [query, setQuery] = useState('');
  const [outcome, setOutcome] = useState<SearchOutcome | undefined>();

  const q = query.trim();
  const searching = q.length >= 2;
  const answer = searching && outcome?.query === q ? outcome : undefined;
  const suggestions = answer && 'suggestions' in answer ? answer.suggestions : [];
  const searchFailed = answer !== undefined && 'failed' in answer;

  // If permission was denied before, say so up front instead of failing on tap.
  useEffect(() => {
    getPermission()
      .then((state) => state === 'denied' && setGps('denied'))
      .catch(() => {});
  }, []);

  // Search as the user types, waiting 300 ms after the last keystroke to save requests.
  useEffect(() => {
    if (!searching) return;
    const timer = setTimeout(() => {
      places
        .searchAreas(q, selected?.location)
        .then((list) => setOutcome({ query: q, suggestions: list }))
        .catch(() => setOutcome({ query: q, failed: true }));
    }, 300);
    return () => clearTimeout(timer);
    // `selected` is only a location bias; re-searching when it changes isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, searching]);

  const useCurrentLocation = async () => {
    setGps('locating');
    try {
      let permission = await getPermission();
      if (permission !== 'granted') permission = await requestPermission();
      if (permission !== 'granted') {
        setGps('denied');
        return;
      }
      setSelected(await getCurrentArea());
      setGps('idle');
    } catch {
      setGps('error');
    }
  };

  const chooseSuggestion = async (suggestion: AreaSuggestion) => {
    Keyboard.dismiss();
    try {
      setSelected(await places.resolveArea(suggestion.id));
      setQuery('');
    } catch {
      setOutcome({ query: q, failed: true });
    }
  };

  const confirm = () => {
    if (!selected) return;
    prefs.setArea(selected);
    prefs.setRadius(radiusKm);
    if (next === 'results') router.replace('/results');
    else if (next === 'surprise') router.replace('/surprise');
    else router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: copy.location.title,
          headerLeft: () => <Button variant="ghost" title={copy.location.cancel} onPress={() => router.back()} />,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {gps === 'denied' ? (
          <View style={styles.message}>
            <Text variant="bodyLarge">{copy.location.denied}</Text>
            {canOpenSystemSettings ? <Button variant="secondary" title={copy.location.openSettings} onPress={openSystemSettings} style={styles.alignStart} /> : null}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.location.useCurrent}
            accessibilityHint={copy.location.useCurrentHint}
            aria-busy={gps === 'locating'}
            disabled={gps === 'locating'}
            onPress={useCurrentLocation}
            style={({ pressed }) => [styles.current, pressed && styles.pressed]}
          >
            <View style={styles.badge}>
              <CrosshairIcon size={20} color={colors.ink} weight="regular" />
            </View>
            <View style={styles.flex}>
              <Text variant="bodyLargeStrong">{gps === 'locating' ? copy.location.locating : copy.location.useCurrent}</Text>
              <Text variant="body" color={gps === 'error' ? 'error' : 'inkSecondary'}>
                {gps === 'error' ? copy.location.gpsError : copy.location.useCurrentHint}
              </Text>
            </View>
            {gps === 'locating' ? <ActivityIndicator color={colors.ink} /> : null}
          </Pressable>
        )}

        <Divider spacing={spacing.md} />

        <SearchInput value={query} onChangeText={setQuery} placeholder={copy.location.searchPlaceholder} label={copy.location.searchLabel} clearLabel={copy.location.clearSearch} />

        {searching && !answer ? <ActivityIndicator color={colors.inkSecondary} style={styles.searchStatus} /> : null}
        {searchFailed ? (
          <Text variant="body" color="error" style={styles.searchStatus}>
            {copy.location.searchError}
          </Text>
        ) : null}
        {answer && !searchFailed && suggestions.length === 0 ? (
          <Text variant="body" color="inkSecondary" style={styles.searchStatus}>
            {copy.location.noMatches(q)}
          </Text>
        ) : null}
        <View style={styles.suggestions}>
          {suggestions.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityLabel={[s.title, s.subtitle].filter(Boolean).join(', ')}
              onPress={() => chooseSuggestion(s)}
              style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
            >
              <MapPinIcon size={20} color={colors.inkSecondary} weight="regular" />
              <View style={styles.flex}>
                <Text variant="bodyLargeStrong">{s.title}</Text>
                {s.subtitle ? (
                  <Text variant="body" color="inkSecondary">
                    {s.subtitle}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.distance}>
          <ChoiceGroup
            label={copy.location.distance}
            options={RADIUS_STEPS.map((km) => ({ value: km, label: copy.radius(km) }))}
            value={radiusKm}
            onChange={setRadiusKm}
            minLabelWidth={40}
            compact
          />
        </View>
      </ScrollView>

      <ActionBar>
        <View style={styles.flex}>
          <Text variant="body" color="inkSecondary" numberOfLines={1} style={styles.selected}>
            {selected ? copy.location.selected(selected.label) : copy.location.nothingSelected}
          </Text>
          <Button title={copy.location.confirm} onPress={confirm} disabled={!selected} />
        </View>
      </ActionBar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: size.screenPadding, paddingTop: spacing.md, paddingBottom: spacing.lg },
  flex: { flex: 1 },
  alignStart: { alignSelf: 'flex-start' },
  message: { gap: spacing.sm },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: size.input,
    padding: spacing.xs,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: borderWidth.default,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  badge: {
    width: size.iconBadge,
    height: size.iconBadge,
    borderRadius: radius.full,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestions: { marginTop: spacing.xs },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: size.buttonSecondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.pressed },
  searchStatus: { marginVertical: spacing.sm },
  distance: { marginTop: spacing.lg },
  selected: { marginBottom: spacing.xs },
});
