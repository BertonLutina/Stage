import React from 'react';
import { Stack } from 'expo-router';
import { ThemedFill } from '@/components/theme/ThemeBackdrop';

export default function ThemedStackLayout() {
  return (
    <ThemedFill>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </ThemedFill>
  );
}
