import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import useThemeStore from '../../store/themeStore';

const SCREENS = [
  {
    name: 'dashboard',
    title: 'Home',
    icon: 'home',
    iconFocused: 'home',
    sf: { default: 'house', selected: 'house.fill' },
  },
  {
    name: 'matches',
    title: 'Game Day',
    icon: 'football-outline',
    iconFocused: 'football',
    sf: { default: 'soccerball', selected: 'soccerball.fill' },
  },
  {
    name: 'tournaments',
    title: 'Tournaments',
    icon: 'trophy-outline',
    iconFocused: 'trophy',
    sf: { default: 'trophy', selected: 'trophy.fill' },
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: 'person-outline',
    iconFocused: 'person',
    sf: { default: 'person', selected: 'person.fill' },
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

  if (Platform.OS === 'ios' && !tokens.live) {
    return (
      <NativeTabs
        backBehavior="history"
        screenOptions={{
          ...sharedScreenOptions,
          tabBarStyle: { backgroundColor: C.surface },
        }}
      >
        {SCREENS.map(({ name, sf }) => (
          <NativeTabs.Trigger key={name} name={name}>
            <NativeTabs.Trigger.Icon sf={sf} />
            <NativeTabs.Trigger.Label hidden />
          </NativeTabs.Trigger>
        ))}
        <NativeTabs.Trigger key="search" name="search" role="search">
          <NativeTabs.Trigger.Icon sf="magnifyingglass" />
          <NativeTabs.Trigger.Label hidden />
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
