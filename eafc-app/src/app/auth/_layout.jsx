import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import GradientBackground from '../../components/common/GradientBackground';
import useColorSchemeColors from '../../hooks/useColorSchemeColors';

export default function AuthLayout() {
  const { isDark } = useColorSchemeColors();

  return (
    <GradientBackground colors={['#02091B', '#07163A', '#02091B']}>
      <View className={isDark ? 'dark flex-1' : 'flex-1'} style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </View>
    </GradientBackground>
  );
}