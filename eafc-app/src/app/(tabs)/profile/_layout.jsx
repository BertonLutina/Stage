import React from 'react';
import { Stack } from 'expo-router';
import GradientBackground from '../../../components/common/GradientBackground';
import { View } from 'react-native';

export default function ProfileLayout() {
  return (
    <GradientBackground>
      <View className={'flex-1'}>
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

