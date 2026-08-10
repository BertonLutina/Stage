import React from 'react';
import { Stack } from 'expo-router';
import { GAMER_BG } from '@/components/profile/gamer/GamerProfileUI';

export default function InboxLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: GAMER_BG },
        animation: 'slide_from_right',
      }}
    />
  );
}
