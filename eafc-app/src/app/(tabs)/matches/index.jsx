import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import GradientBackground from '../../../components/common/GradientBackground';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MatchesIndex() {
  return (
    <View className="flex-1">
      <GradientBackground>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView showsVerticalScrollIndicator={false}> 
            <Text className="text-white">Matches home</Text>
          </ScrollView>
        </SafeAreaView>
      </GradientBackground>
    </View>
  );
}
