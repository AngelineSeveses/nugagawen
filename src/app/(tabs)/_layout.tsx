/**
 * Bottom tabs: Home, Saved, Settings. Labels are always visible next to the
 * icons; the active tab uses the filled icon weight.
 */
import { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookmarkSimpleIcon, GearSixIcon, HouseSimpleIcon } from '@/components/icons';
import { useCopy } from '@/localization';
import { colors, size, typeScale } from '@/theme';

export default function TabsLayout() {
  const copy = useCopy();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSecondary,
        // An explicit height (icon, label and the tab's own padding), so labels are never cut off.
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.hairline,
          height: size.tabBar + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: typeScale.tab,
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        headerTitleContainerStyle: { marginHorizontal: size.screenPadding },
        headerTitleStyle: { ...typeScale.h1, color: colors.ink },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: copy.tabs.home,
          tabBarAccessibilityLabel: copy.tabs.home,
          headerShown: false,
          tabBarIcon: ({ focused }) => <HouseSimpleIcon size={24} color={focused ? colors.ink : colors.inkSecondary} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: copy.tabs.saved,
          tabBarAccessibilityLabel: copy.tabs.saved,
          tabBarIcon: ({ focused }) => <BookmarkSimpleIcon size={24} color={focused ? colors.ink : colors.inkSecondary} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: copy.tabs.settings,
          tabBarAccessibilityLabel: copy.tabs.settings,
          tabBarIcon: ({ focused }) => <GearSixIcon size={24} color={focused ? colors.ink : colors.inkSecondary} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
    </Tabs>
  );
}
