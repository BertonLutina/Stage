import React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { GAMER_BG } from '@/components/profile/gamer/GamerProfileUI';

export default function ProfileLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: GAMER_BG }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: GAMER_BG },
        }}
      />
    </View>
  );
}

