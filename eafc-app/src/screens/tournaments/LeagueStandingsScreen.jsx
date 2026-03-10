import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';

export default function LeagueStandingsScreen({ route }) {
  const { tournamentId } = route.params;
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    api.get(`/tournaments/${tournamentId}/standings`).then(r => setStandings(r.data.data || []));
  }, [tournamentId]);

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="px-4">
        <Text className="text-white text-xl font-bold mt-4 mb-4">League Standings</Text>
        <View className="bg-card border border-border rounded-2xl overflow-hidden">
          <View className="flex-row bg-surface px-4 py-2 border-b border-border">
            <Text className="text-muted text-xs w-6">#</Text>
            <Text className="text-muted text-xs flex-1">Club</Text>
            <Text className="text-muted text-xs w-8 text-center">P</Text>
            <Text className="text-muted text-xs w-8 text-center">W</Text>
            <Text className="text-muted text-xs w-8 text-center">D</Text>
            <Text className="text-muted text-xs w-8 text-center">L</Text>
            <Text className="text-muted text-xs w-8 text-center">GD</Text>
            <Text className="text-primary text-xs w-10 text-center font-bold">Pts</Text>
          </View>
          {standings.map((s, idx) => (
            <View key={s.team_id} className={`flex-row px-4 py-3 border-b border-border/50 ${idx % 2 === 0 ? '' : 'bg-surface/10'}`}>
              <Text className="text-muted text-sm w-6">{idx + 1}</Text>
              <Text className="text-white text-sm flex-1 font-medium" numberOfLines={1}>{s.club_name}</Text>
              <Text className="text-white text-xs w-8 text-center">{s.played}</Text>
              <Text className="text-secondary text-xs w-8 text-center">{s.wins}</Text>
              <Text className="text-muted text-xs w-8 text-center">{s.draws}</Text>
              <Text className="text-danger text-xs w-8 text-center">{s.losses}</Text>
              <Text className="text-muted text-xs w-8 text-center">{(s.goals_for || 0) - (s.goals_against || 0)}</Text>
              <Text className="text-primary font-bold text-xs w-10 text-center">{s.points}</Text>
            </View>
          ))}
          {!standings.length && <Text className="text-muted text-center py-8">No standings yet</Text>}
        </View>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
