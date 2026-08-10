import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../../store/themeStore';

let NativeTabs = null;
let NativeIcon = null;
let NativeLabel = null;
let NativeVectorIcon = null;

if (Platform.OS === 'ios') {
  try {
    ({ NativeTabs } = require('expo-router/unstable-native-tabs'));
    ({ Icon: NativeIcon, Label: NativeLabel, VectorIcon: NativeVectorIcon } =
      require('expo-router/build/native-tabs/common/elements'));
  } catch {
    // NativeTabs unavailable in this expo-router version — falls back to AndroidTabs
  }
}


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
  {
    name: 'dashboard',
    title: 'Home',
    icon: 'home',
    iconFocused: 'home',
  },
  {
    name: 'matches',
    title: 'Matches',
    icon: 'football-outline',
    iconFocused: 'football',
  },
  {
    name: 'tournaments',
    title: 'Tournaments',
    icon: 'trophy-outline',
    iconFocused: 'trophy',
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: 'person-outline',
    iconFocused: 'person',
  },
];

export default function TabsLayout() {
  const { resolvedTheme } = useThemeStore();
  const C = resolvedTheme === 'dark' ? DARK : LIGHT;

  const sharedScreenOptions = {
    headerShown: false,
    tabBarActiveTintColor: C.primary,
    tabBarInactiveTintColor: '#FFFFFF',
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
          <NativeTabs.Trigger key={name} name={name}>
            <NativeIcon src={<NativeVectorIcon family={Ionicons} name={icon} />} />
            <NativeLabel>{title}</NativeLabel>
          </NativeTabs.Trigger>

        ))}
        <NativeTabs.Trigger key="search" name="search" role="search">
          <NativeIcon src={<NativeVectorIcon family={Ionicons} name="search" />} />
          <NativeLabel>Apps</NativeLabel>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        ...sharedScreenOptions,
        tabBarItemStyle: { borderRadius: 999, margin: 6 },
        tabBarStyle: {
          position: 'absolute',
          bottom: 34,
          height: 64,
          backgroundColor: 'rgba(15,23,42,0.35)', // glassy background
          paddingBottom: 8,
          paddingHorizontal: 8,
          alignSelf: 'center',
          marginHorizontal: 20,
          borderRadius: 999,
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: 'rgba(148,163,184,0.4)',
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
        },
        tabBarLabelStyle: { fontSize: 9 },
      }}
    >
      {SCREENS.map(({ name, title, icon, iconFocused }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? iconFocused : icon}
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Apps',
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
