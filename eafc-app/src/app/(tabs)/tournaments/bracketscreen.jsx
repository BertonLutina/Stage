import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import BracketView from '../../../components/tournament/BracketView';
import GradientBackground from '../../../components/common/GradientBackground';
import BackButton from '../../../components/common/BackButton';

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
      <View className="flex-row items-center gap-4 px-4 py-3 border-b border-white/10">
        <BackButton variant="light" />
        <Text className="text-white text-xl font-bold flex-1">Bracket</Text>
      </View>
      <ScrollView className="px-4">
        <BracketView rounds={rounds} />
      </ScrollView>
    </SafeAreaView>
    </GradientBackground>
    </View>
  );
}
