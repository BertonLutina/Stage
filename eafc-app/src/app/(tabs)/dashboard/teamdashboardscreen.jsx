import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import Card from '../../../components/common/Card';
import Avatar from '../../../components/common/Avatar';

export default function TeamDashboardScreen() {
  const { teamId } = useLocalSearchParams();
  const [team, setTeam] = useState(null);

  useEffect(() => {
    api.get(`/teams/${teamId}`).then(r => setTeam(r.data.data));
  }, [teamId]);

  if (!team) return <View className="flex-1 bg-dark items-center justify-center"><Text className="text-muted">Loading...</Text></View>;

  const total = (team.wins || 0) + (team.draws || 0) + (team.losses || 0);
  const winRate = total > 0 ? Math.round((team.wins / total) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="px-4">
        <View className="items-center mt-6 mb-6">
          <Avatar uri={team.avatar} name={team.club_name} size={72} />
          <Text className="text-white text-2xl font-black mt-3">{team.club_name}</Text>
        </View>

        <Card className="mb-4">
          <Text className="text-muted text-xs font-semibold mb-4 tracking-wider">TEAM STATS</Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1"><Text className="text-secondary text-3xl font-black">{team.wins || 0}</Text><Text className="text-muted text-xs mt-1">Wins</Text></View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1"><Text className="text-muted text-3xl font-black">{team.draws || 0}</Text><Text className="text-muted text-xs mt-1">Draws</Text></View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1"><Text className="text-danger text-3xl font-black">{team.losses || 0}</Text><Text className="text-muted text-xs mt-1">Losses</Text></View>
          </View>
          <View className="mt-4 border-t border-border pt-4 flex-row justify-between">
            <View><Text className="text-muted text-xs">Total</Text><Text className="text-white font-bold text-lg">{total}</Text></View>
            <View><Text className="text-muted text-xs">Win Rate</Text><Text className="text-primary font-bold text-lg">{winRate}%</Text></View>
            <View><Text className="text-muted text-xs">Squad</Text><Text className="text-white font-bold text-lg">{team.players?.length || 0}</Text></View>
          </View>
        </Card>

        <View className="flex-row h-3 rounded-full overflow-hidden bg-card border border-border">
          <View className="bg-secondary" style={{ flex: team.wins || 0 }} />
          <View className="bg-muted" style={{ flex: team.draws || 0 }} />
          <View className="bg-danger" style={{ flex: team.losses || 0 }} />
        </View>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
