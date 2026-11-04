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
import { ToastProvider } from '@/components/toast';
import { LanguageProvider, useLanguage } from '@/localization';
import { attachOsmDatabase, failOsmDatabase } from '@/services/places';
import { OSM_DATA_VERSION } from '@/services/places/osm/data-version';
import { loadJSON, saveJSON } from '@/services/storage';
import { PreferencesProvider } from '@/state/preferences';
import { SavedProvider } from '@/state/saved';
import { colors, fonts } from '@/theme';

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

/** The stack navigator. A separate component so its titles can follow the app language. */
function RootStack() {
  const { copy } = useLanguage();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.semiBold, fontSize: 17, color: colors.ink },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      {/* The title is what Back buttons and screen readers call this screen ("Discover, back"). */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: copy.tabs.discover }} />
      <Stack.Screen name="location" options={{ presentation: 'modal', title: copy.location.title }} />
      <Stack.Screen name="results" options={{ title: '' }} />
      <Stack.Screen name="surprise" options={{ title: '' }} />
      <Stack.Screen name="place/[id]" options={{ title: '' }} />
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
            <RootStack />
          </ToastProvider>
        </SavedProvider>
      </PreferencesProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
