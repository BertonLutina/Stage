import React from 'react';
import { Platform, View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import useThemeStore from '../../store/themeStore';

const DARK = {
  surface: '#0A1F4A',
  border: '#1A3566',
  primary: '#5FE3E8',
  muted: '#6B7280',
};

const LIGHT = {
  surface: '#FFFFFF',
  border: '#E5E7EB',
  primary: '#0891B2',
  muted: '#6B7280',
};

function TabIcon({ label, icon, focused }) {
  const { theme } = useThemeStore();
  const C = theme === 'dark' ? DARK : LIGHT;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={{ fontSize: 11, marginTop: 2, color: focused ? C.primary : C.muted }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { theme } = useThemeStore();
  const C = theme === 'dark' ? DARK : LIGHT;
  const isIOS = Platform.OS === 'ios';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        ...(isIOS
          ? {
              tabBarVariant: 'uiTabBar',
              tabBarStyle: {
                backgroundColor: C.surface,
              },
            }
          : {
              tabBarStyle: {
                backgroundColor: C.surface,
                borderTopColor: C.border,
                height: 60,
              },
            }),
      }}
    >
      <Tabs.Screen
        name="social/feedscreen"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => <TabIcon label="Feed" icon="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tournaments/fixturesscreen"
        options={{
          title: 'Fixtures',
          tabBarIcon: ({ focused }) => <TabIcon label="Fixtures" icon="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="social/reelsscreen"
        options={{
          title: 'Reels',
          tabBarIcon: ({ focused }) => <TabIcon label="Reels" icon="🎬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tournaments/tournamentlistscreen"
        options={{
          title: 'Tournaments',
          tabBarIcon: ({ focused }) => <TabIcon label="Tournaments" icon="🏆" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile/profilescreen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" icon="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
