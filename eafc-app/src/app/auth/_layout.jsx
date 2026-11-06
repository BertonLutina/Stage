import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import useColorSchemeColors from '../../hooks/useColorSchemeColors';
import useThemeStore from '@/store/themeStore';

/** Auth screens paint their own background via ui/Screen; this only fills gaps during transitions. */
export default function AuthLayout() {
  const { isDark } = useColorSchemeColors();
  const bg = useThemeStore((s) => s.tokens.bg);

  return (
    <View className={isDark ? 'dark flex-1' : 'flex-1'} style={{ flex: 1, backgroundColor: bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </View>
  );
}