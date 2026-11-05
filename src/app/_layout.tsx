/**
 * Root layout: loads the brand font, provides app-wide state, and defines the
 * stack navigator. Expo Router concept: every file in src/app is a screen, and
 * `_layout.tsx` files decide how those screens are arranged (stack, tabs, modal).
 */
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DefaultTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { deleteDatabaseAsync, SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { ToastProvider } from '@/components/toast';
import { LanguageProvider, useLanguage } from '@/localization';
import { attachOsmDatabase, failOsmDatabase } from '@/services/places';
import { OSM_DATA_VERSION } from '@/services/places/osm/data-version';
import { loadJSON, saveJSON } from '@/services/storage';
import { FirstRunProvider, useFirstRun } from '@/state/first-run';
import { PreferencesProvider } from '@/state/preferences';
import { SavedProvider } from '@/state/saved';
import { colors, size, typeScale } from '@/theme';
import '@/theme/web-states';

// Keep the splash screen up until the font is ready, so text never flashes in the wrong font.
SplashScreen.preventAutoHideAsync();

/** The tabs always sit underneath, so Back works even when a link opens Results or a place directly. */
export const unstable_settings = { anchor: '(tabs)' };

const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.paper, card: colors.paper, text: colors.ink, border: colors.hairline, primary: colors.ink },
};

/** The bundled OpenStreetMap database. A new data version gets a new file name, so updates are copied in fresh. */
const OSM_DB_NAME = `places-${OSM_DATA_VERSION}.db`;
const OSM_DB_KEY = 'nugagawen:osm-db-name';

async function onDatabaseReady(db: SQLiteDatabase) {
  attachOsmDatabase(db);
  // Remove the copy from a previous app version so old data doesn't take up space.
  const previous = await loadJSON<string>(OSM_DB_KEY);
  if (previous && previous !== OSM_DB_NAME) await deleteDatabaseAsync(previous).catch(() => {});
  await saveJSON(OSM_DB_KEY, OSM_DB_NAME);
}

/**
 * The stack navigator. A separate component so its titles can follow the app language.
 *
 * Expo Router concept: `Stack.Protected` makes screens exist only while `guard`
 * is true. Onboarding and the rest of the app swap places, so Home can't flash
 * first, and Back can't leave onboarding by accident.
 */
function RootStack() {
  const { copy } = useLanguage();
  const firstRun = useFirstRun();
  if (!firstRun.loaded) return null;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { ...typeScale.nav, color: colors.ink },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Protected guard={firstRun.showOnboarding}>
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={!firstRun.showOnboarding}>
        {/* The title is what Back buttons and screen readers call this screen ("Home, back"). */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: copy.tabs.home }} />
        <Stack.Screen name="location" options={{ presentation: 'modal', title: copy.location.title }} />
        <Stack.Screen name="results" options={{ title: '' }} />
        <Stack.Screen name="surprise" options={{ title: '' }} />
        <Stack.Screen name="place/[id]" options={{ title: '' }} />
        <Stack.Screen name="directions/[id]" options={{ title: copy.directions.title }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <LanguageProvider>
      <FirstRunProvider>
      <PreferencesProvider>
        <SavedProvider>
          <ToastProvider>
            {/* Opens the bundled place database beside the app, so screens render while it's prepared. */}
            <SQLiteProvider
              databaseName={OSM_DB_NAME}
              assetSource={{ assetId: require('@/assets/data/places.db') }}
              onInit={onDatabaseReady}
              onError={failOsmDatabase}
            >
              {null}
            </SQLiteProvider>
            <StatusBar style="dark" />
            {/* Phones fill this; on a wide browser window the app stays phone-width and centered. */}
            <View style={styles.page}>
              <View style={styles.column}>
                <RootStack />
              </View>
            </View>
          </ToastProvider>
        </SavedProvider>
      </PreferencesProvider>
      </FirstRunProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  column: { flex: 1, width: '100%', maxWidth: size.contentMax, alignSelf: 'center' },
});
