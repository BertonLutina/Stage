import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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


const SCREENS = [
  {
    name: 'dashboard',
    title: 'Home',
    icon: 'home',
    iconFocused: 'home',
  },
  {
    name: 'matches',
    title: 'Game Day',
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
  const tokens = useThemeStore((s) => s.tokens);
  const C = {
    surface: tokens.isDark ? '#0A1F4A' : tokens.cardSolid,
    primary: tokens.cyan,
    muted: tokens.muted,
  };

  const sharedScreenOptions = {
    headerShown: false,
    tabBarActiveTintColor: tokens.primary,
    tabBarInactiveTintColor: tokens.muted,
  };

  if (Platform.OS === 'ios' && NativeTabs && !tokens.live) {
    return (
      <NativeTabs
        backBehavior="history"
        screenOptions={{
          ...sharedScreenOptions,
          tabBarStyle: { backgroundColor: C.surface },
        }}
      >
        {SCREENS.map(({ name, icon }) => (
          <NativeTabs.Trigger key={name} name={name}>
            <NativeIcon src={<NativeVectorIcon family={Ionicons} name={icon} />} />
            <NativeLabel hidden />
          </NativeTabs.Trigger>
        ))}
        <NativeTabs.Trigger key="search" name="search" role="search">
          <NativeIcon src={<NativeVectorIcon family={Ionicons} name="search" />} />
          <NativeLabel hidden />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        ...sharedScreenOptions,
        sceneContainerStyle: { backgroundColor: 'transparent' },
        sceneStyle: { backgroundColor: 'transparent' },
        contentStyle: { backgroundColor: 'transparent' },
        tabBarItemStyle: { borderRadius: 999, margin: 6 },
        tabBarStyle: {
          position: 'absolute',
          bottom: 34,
          height: 64,
          backgroundColor: tokens.live ? 'transparent' : 'rgba(15,23,42,0.72)',
          paddingBottom: 8,
          paddingHorizontal: 8,
          alignSelf: 'center',
          marginHorizontal: 20,
          borderRadius: 999,
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: tokens.hairline,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          tokens.live
            ? (
              <>
                <BlurView intensity={36} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,18,32,0.62)' }]} />
              </>
            )
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.72)' }]} />
        ),
        tabBarShowLabel: false,
      }}
    >
      {SCREENS.map(({ name, title, icon, iconFocused }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarShowLabel: false,
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
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
