import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import useColorSchemeColors from '../../hooks/useColorSchemeColors';

/** Auth screens paint their own backgrounds (login uses Banner.jpg). */
export default function AuthLayout() {
  const { isDark } = useColorSchemeColors();

  return (
    <View className={isDark ? 'dark flex-1' : 'flex-1'} style={{ flex: 1, backgroundColor: '#02091B' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </View>
  );
}