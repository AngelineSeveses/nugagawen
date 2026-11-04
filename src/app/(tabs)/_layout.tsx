/**
 * Bottom tabs: Discover, Saved, Settings. Labels are always visible next to the
 * icons; the active tab uses the filled icon weight.
 */
import { Tabs } from 'expo-router/js-tabs';
import { BookmarkSimpleIcon, CompassIcon, GearSixIcon } from '@/components/icons';
import { useCopy } from '@/localization';
import { colors, fonts } from '@/theme';

export default function TabsLayout() {
  const copy = useCopy();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSecondary,
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.hairline },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        headerTitleStyle: { fontFamily: fonts.semiBold, fontSize: 24, letterSpacing: -0.4, color: colors.ink },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: copy.tabs.discover,
          tabBarAccessibilityLabel: copy.tabs.discover,
          headerShown: false,
          tabBarIcon: ({ focused }) => <CompassIcon size={24} color={focused ? colors.ink : colors.inkSecondary} weight={focused ? 'fill' : 'regular'} />,
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
