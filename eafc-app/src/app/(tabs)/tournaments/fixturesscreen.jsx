import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../utils/api';
import GradientBackground from '../../../components/common/GradientBackground';
import BackButton from '../../../components/common/BackButton';

export default function FixturesScreen() {
  const { tournamentId } = useLocalSearchParams();
  const router = useRouter();
  const [fixtures, setFixtures] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams();
    if (tournamentId) params.append('tournament_id', tournamentId);
    if (filter !== 'all') params.append('status', filter);
    api.get(`/matches/fixtures?${params}`).then(r => setFixtures(r.data.data || []));
  }, [tournamentId, filter]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/(tabs)/matches/matchdetailscreen',
          params: { matchId: item.id },
        })
      }
      className="bg-card border border-border rounded-2xl px-4 py-4 mb-3 mx-4">
      <Text className="text-muted text-xs mb-2">{item.tournament_name}</Text>
      <View className="flex-row items-center">
        <Text className="text-white font-semibold flex-1 text-right" numberOfLines={1}>{item.home_team_name}</Text>
        <View className="mx-3 bg-surface px-3 py-1.5 rounded-lg min-w-[56px] items-center">
          {item.status === 'completed' ? (
            <Text className="text-primary font-black text-base">{item.home_score} - {item.away_score}</Text>
          ) : (
            <Text className="text-muted text-sm font-bold">vs</Text>
          )}
        </View>
        <Text className="text-white font-semibold flex-1" numberOfLines={1}>{item.away_team_name}</Text>
      </View>
      {item.status === 'completed' && item.videos?.length > 0 && (
        <Text className="text-accent text-xs mt-2 text-center">🎬 Video available</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      <GradientBackground>
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center gap-4 px-4 py-3 border-b border-white/10">
            <BackButton variant="light" />
            <Text className="text-white text-2xl font-black flex-1">Fixtures</Text>
          </View>
          <View className="flex-row px-4 gap-2 mb-4">
            {['all', 'scheduled', 'completed'].map(f => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full border ${filter === f ? 'bg-primary border-primary' : 'bg-card border-border'}`}>
                <Text className={`text-xs font-bold capitalize ${filter === f ? 'text-dark' : 'text-white'}`}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList data={fixtures} keyExtractor={i => i.id} renderItem={renderItem} ListEmptyComponent={<Text className="text-muted text-center mt-8">No fixtures found</Text>} />
        </SafeAreaView>
      </GradientBackground>
    </View>
  );
}
