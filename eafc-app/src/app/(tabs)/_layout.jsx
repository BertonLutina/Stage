import React from 'react';
import { Tabs } from 'expo-router';
import FloatingTabBar from '@/components/ui/FloatingTabBar';

// Route names are file-based (dashboard, matches, tournaments, profile, search);
// only titles live here. Icons are drawn by FloatingTabBar.
const SCREENS = [
  { name: 'dashboard', title: 'Home' },
  { name: 'matches', title: 'Game Day' },
  { name: 'tournaments', title: 'Tournaments' },
  { name: 'profile', title: 'Profile' },
  { name: 'search', title: 'Search' },
];

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneContainerStyle: { backgroundColor: 'transparent' },
        sceneStyle: { backgroundColor: 'transparent' },
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      {SCREENS.map(({ name, title }) => (
        <Tabs.Screen key={name} name={name} options={{ title }} />
      ))}
    </Tabs>
  );
}
