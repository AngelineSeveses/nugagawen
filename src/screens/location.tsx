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
  TextInput,
  View,
} from 'react-native';
import { Button } from '@/components/button';
import { ChoiceGroup } from '@/components/choice-group';
import { CrosshairIcon, MagnifyingGlassIcon, MapPinIcon, XIcon } from '@/components/icons';
import { ActionBar, Divider } from '@/components/misc';
import { Text } from '@/components/text';
import { useCopy } from '@/localization';
import { canOpenSystemSettings, getCurrentArea, getPermission, openSystemSettings, requestPermission } from '@/services/location';
import { places, type AreaSuggestion } from '@/services/places';
import { RADIUS_STEPS, usePreferences } from '@/state/preferences';
import { colors, fonts, radius, size, spacing } from '@/theme';
import type { RadiusKm, SearchArea } from '@/types';

type GpsState = 'idle' | 'locating' | 'denied' | 'error';
type SearchState = 'idle' | 'loading' | 'done' | 'error';

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
  const [suggestions, setSuggestions] = useState<AreaSuggestion[]>([]);
  const [search, setSearch] = useState<SearchState>('idle');

  // If permission was denied before, say so up front instead of failing on tap.
  useEffect(() => {
    getPermission()
      .then((state) => state === 'denied' && setGps('denied'))
      .catch(() => {});
  }, []);

  // Search as the user types, waiting 300 ms after the last keystroke to save requests.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSearch('idle');
      return;
    }
    setSearch('loading');
    const timer = setTimeout(() => {
      places
        .searchAreas(q, selected?.location)
        .then((list) => {
          setSuggestions(list);
          setSearch('done');
        })
        .catch(() => setSearch('error'));
    }, 300);
    return () => clearTimeout(timer);
    // `selected` is only a location bias; re-searching when it changes isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

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
      setSearch('error');
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
            {canOpenSystemSettings ? (
              <Button variant="secondary" title={copy.location.openSettings} onPress={openSystemSettings} style={styles.alignStart} />
            ) : null}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.location.useCurrent}
            accessibilityHint={copy.location.useCurrentHint}
            accessibilityState={{ busy: gps === 'locating' }}
            disabled={gps === 'locating'}
            onPress={useCurrentLocation}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <CrosshairIcon size={size.icon} color={colors.ink} weight="regular" />
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

        <View style={styles.inputWrap}>
          <MagnifyingGlassIcon size={20} color={colors.inkSecondary} weight="regular" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={copy.location.searchPlaceholder}
            placeholderTextColor={colors.inkSecondary}
            accessibilityLabel={copy.location.searchLabel}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.input}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel={copy.location.clearSearch} hitSlop={10} onPress={() => setQuery('')}>
              <XIcon size={18} color={colors.inkSecondary} weight="regular" />
            </Pressable>
          ) : null}
        </View>

        {search === 'loading' ? <ActivityIndicator color={colors.inkSecondary} style={styles.searchStatus} /> : null}
        {search === 'error' ? (
          <Text variant="body" color="error" style={styles.searchStatus}>
            {copy.location.searchError}
          </Text>
        ) : null}
        {search === 'done' && suggestions.length === 0 ? (
          <Text variant="body" color="inkSecondary" style={styles.searchStatus}>
            {copy.location.noMatches(query.trim())}
          </Text>
        ) : null}
        {suggestions.map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={[s.title, s.subtitle].filter(Boolean).join(', ')}
            onPress={() => chooseSuggestion(s)}
            style={({ pressed }) => [styles.row, styles.suggestion, pressed && styles.pressed]}
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

        <View style={styles.distance}>
          <ChoiceGroup
            label={copy.location.distance}
            options={RADIUS_STEPS.map((km) => ({ value: km, label: copy.radius(km) }))}
            value={radiusKm}
            onChange={setRadiusKm}
            minLabelWidth={44}
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
  content: { paddingHorizontal: size.screenPadding, paddingTop: spacing.md, paddingBottom: spacing.xl },
  flex: { flex: 1 },
  alignStart: { alignSelf: 'flex-start' },
  message: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: size.listRow,
    marginHorizontal: -spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  suggestion: { minHeight: 48 },
  pressed: { backgroundColor: colors.pressed },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: size.input,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, paddingVertical: spacing.sm },
  searchStatus: { marginVertical: spacing.sm },
  distance: { marginTop: spacing.xl },
  selected: { marginBottom: spacing.xs },
});
