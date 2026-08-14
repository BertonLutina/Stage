import React from 'react';
import { Stack } from 'expo-router';
import { ThemedFill } from '@/components/theme/ThemeBackdrop';

export default function InboxLayout() {
  return (
    <ThemedFill>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      />
    </ThemedFill>
  );
}
