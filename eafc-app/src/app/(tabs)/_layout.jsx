import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
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

const SCREENS = [
  { name: 'dashboard',   title: 'Home',        icon: '🏠' },
  { name: 'matches',     title: 'Matches',     icon: '⚽' },
  { name: 'tournaments', title: 'Tournaments', icon: '🏆' },
  { name: 'teams',       title: 'Clubs',       icon: '🛡️' },
  { name: 'profile',     title: 'Profile',     icon: '👤' },
];

export default function TabsLayout() {
  const { theme } = useThemeStore();
  const C = theme === 'dark' ? DARK : LIGHT;

  const sharedScreenOptions = {
    headerShown: false,
    tabBarActiveTintColor: C.primary,
    tabBarInactiveTintColor: C.muted,
  };

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs
        screenOptions={{
          ...sharedScreenOptions,
          tabBarStyle: { backgroundColor: C.surface },
        }}
      >
        {SCREENS.map(({ name, title, icon }) => (
          <NativeTabs.Screen
            key={name}
            name={name}
            options={{ title, tabBarIcon: () => icon }}
          />
        ))}
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        ...sharedScreenOptions,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          height: 60,
          paddingBottom: 6,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      {SCREENS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: () => icon,
          }}
        />
      ))}
      <Tabs.Screen name="social" options={{ href: null }} />
    </Tabs>
  );
}
