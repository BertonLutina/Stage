import React from 'react';
import { Stack } from 'expo-router';

export default function SocialLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

