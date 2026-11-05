import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ChoiceGroup } from '@/components/choice-group';
import { Logo, SettingsGroup, SettingsRow } from '@/components/misc';
import { Text } from '@/components/text';
import { dataSource } from '@/config';
import { OSM_FETCHED_AT } from '@/services/places/osm/data-version';
import { LANGUAGE_NAMES, useLanguage, type Language } from '@/localization';
import { canOpenSystemSettings, getPermission, openSystemSettings, type PermissionState } from '@/services/location';
import { RADIUS_STEPS, usePreferences } from '@/state/preferences';
import { useSaved } from '@/state/saved';
import { colors, size, spacing } from '@/theme';

const LANGUAGES: Language[] = ['en', 'fil'];

/** Screen 06: defaults, privacy, about. No account. */
export function SettingsScreen() {
  const { copy, language, setLanguage } = useLanguage();
  const permissionText: Record<PermissionState, string> = {
    granted: copy.settings.permissionGranted,
    denied: copy.settings.permissionDenied,
    undetermined: copy.settings.permissionUndetermined,
  };
  const router = useRouter();
  const prefs = usePreferences();
  const saved = useSaved();
  const [permission, setPermission] = useState<PermissionState>('undetermined');

  // Re-check whenever the tab is shown: the user may have changed it in system Settings.
  useFocusEffect(
    useCallback(() => {
      getPermission()
        .then(setPermission)
        .catch(() => {});
    }, []),
  );

  const confirmClear = () => {
    const { clearConfirmTitle, clearConfirmBody, clearConfirmAction, cancel } = copy.settings;
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`${clearConfirmTitle} ${clearConfirmBody}`)) saved.clear();
      return;
    }
    // The only confirmation dialog in the app: this action can't be undone.
    Alert.alert(clearConfirmTitle, clearConfirmBody, [
      { text: cancel, style: 'cancel' },
      { text: clearConfirmAction, style: 'destructive', onPress: saved.clear },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingsGroup title={copy.settings.language}>
        <View style={styles.inGroup}>
          {/* Language names are shown in their own language, so they're findable whatever the app is in. */}
          <ChoiceGroup
            label={copy.settings.language}
            options={LANGUAGES.map((lang) => ({ value: lang, label: LANGUAGE_NAMES[lang] }))}
            value={language}
            onChange={setLanguage}
            minLabelWidth={72}
            compact
            showLabel={false}
          />
        </View>
      </SettingsGroup>

      <SettingsGroup title={copy.settings.searchSection}>
        <SettingsRow
          label={copy.settings.location}
          value={prefs.area?.label ?? copy.settings.locationNone}
          onPress={() => router.push('/location')}
        />
        <View style={styles.inGroup}>
          <ChoiceGroup
            label={copy.settings.distance}
            options={RADIUS_STEPS.map((km) => ({ value: km, label: copy.radius(km) }))}
            value={prefs.radiusKm}
            onChange={prefs.setRadius}
            minLabelWidth={44}
            compact
          />
        </View>
      </SettingsGroup>

      <SettingsGroup title={copy.settings.privacySection}>
        <View style={styles.textBlock}>
          <Text variant="bodyLargeStrong">{copy.settings.storedTitle}</Text>
          <Text variant="body" color="inkSecondary">
            {copy.settings.storedBody}
          </Text>
        </View>
        <SettingsRow
          label={copy.settings.permission}
          value={permissionText[permission]}
          onPress={canOpenSystemSettings ? openSystemSettings : undefined}
        />
        {saved.items.length > 0 ? <SettingsRow label={copy.settings.clearSaved} destructive onPress={confirmClear} last /> : null}
      </SettingsGroup>

      <SettingsGroup title={copy.settings.aboutSection}>
        <View style={styles.textBlock}>
          <Logo height={20} />
          <Text variant="body" color="inkSecondary">
            {copy.tagline}
          </Text>
        </View>
        <SettingsRow
          label={copy.settings.dataSource}
          value={dataSource === 'osm' ? copy.settings.dataOsm : copy.settings.dataGoogle}
        />
        <SettingsRow label={copy.settings.photosSource} value={dataSource === 'osm' ? 'Wikimedia Commons' : copy.settings.dataGoogle} />
        {dataSource === 'osm' ? (
          <View style={styles.textBlock}>
            <Text variant="body" color="inkSecondary">
              {copy.settings.dataUpdated(new Date(OSM_FETCHED_AT).toLocaleDateString(copy.locale, { day: 'numeric', month: 'long', year: 'numeric' }))}
            </Text>
            <Text variant="body" color="inkSecondary">
              {copy.settings.osmLicence}
            </Text>
          </View>
        ) : null}
        <View style={styles.textBlock}>
          <Text variant="body" color="inkSecondary">
            {copy.settings.accessibility}
          </Text>
        </View>
        <SettingsRow label={copy.settings.version} value={Constants.expoConfig?.version ?? '1.0.0'} last />
      </SettingsGroup>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: size.screenPadding, paddingTop: spacing.xs, paddingBottom: spacing.xxl, gap: spacing.xl },
  inGroup: { paddingVertical: spacing.md },
  textBlock: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
});
