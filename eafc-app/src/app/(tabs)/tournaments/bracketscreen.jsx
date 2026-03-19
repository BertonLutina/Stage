import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import BracketView from '../../../components/tournament/BracketView';
import GradientBackground from '../../../components/common/GradientBackground';

export default function BracketScreen() {
  const { tournamentId } = useLocalSearchParams();
  const [rounds, setRounds] = useState([]);

  useEffect(() => {
    api.get(`/tournaments/${tournamentId}/brackets`).then(r => setRounds(r.data.data || []));
  }, [tournamentId]);

  return (
    <View className="flex-1">
      <GradientBackground>
    <SafeAreaView className="flex-1">
      <ScrollView className="px-4">
        <Text className="text-white text-xl font-bold mt-4 mb-4">Bracket</Text>
        <BracketView rounds={rounds} />
      </ScrollView>
    </SafeAreaView>
    </GradientBackground>
    </View>
  );
}
