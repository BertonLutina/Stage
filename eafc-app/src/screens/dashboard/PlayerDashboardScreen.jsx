import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';
import Card from '../../components/common/Card';

export default function PlayerDashboardScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get(`/users/${user.id}/stats`).then(r => setStats(r.data.data));
  }, []);

  const total = stats ? stats.wins + stats.draws + stats.losses : 0;
  const winRate = total > 0 ? Math.round((stats.wins / total) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="px-4">
        <Text className="text-white text-2xl font-black mt-6 mb-6">My Dashboard</Text>

        <Card className="mb-4">
          <Text className="text-muted text-xs font-semibold mb-4 tracking-wider">CAREER STATISTICS</Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-secondary text-3xl font-black">{stats?.wins || 0}</Text>
              <Text className="text-muted text-xs mt-1">Wins</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1">
              <Text className="text-muted text-3xl font-black">{stats?.draws || 0}</Text>
              <Text className="text-muted text-xs mt-1">Draws</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1">
              <Text className="text-danger text-3xl font-black">{stats?.losses || 0}</Text>
              <Text className="text-muted text-xs mt-1">Losses</Text>
            </View>
          </View>
          <View className="mt-4 border-t border-border pt-4 flex-row justify-between">
            <View><Text className="text-muted text-xs">Total Matches</Text><Text className="text-white font-bold text-lg">{total}</Text></View>
            <View><Text className="text-muted text-xs">Win Rate</Text><Text className="text-primary font-bold text-lg">{winRate}%</Text></View>
            <View><Text className="text-muted text-xs">Tournaments</Text><Text className="text-white font-bold text-lg">{stats?.tournaments_played || 0}</Text></View>
          </View>
        </Card>

        <View className="flex-row h-3 rounded-full overflow-hidden bg-card border border-border mb-6">
          <View className="bg-secondary" style={{ flex: stats?.wins || 0 }} />
          <View className="bg-muted" style={{ flex: stats?.draws || 0 }} />
          <View className="bg-danger" style={{ flex: stats?.losses || 0 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
