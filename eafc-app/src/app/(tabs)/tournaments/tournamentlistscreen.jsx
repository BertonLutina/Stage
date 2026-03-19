import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/common/Button';
import useTournamentsList from '../../../hooks/useTournamentsList';
import { useRouter } from 'expo-router';
import GradientBackground from '../../../components/common/GradientBackground';

const FORMAT_LABEL = {
  group_knockout: 'Group + Knockout',
  single_elim: 'Single Elimination',
  double_elim: 'Double Elimination',
  league_playoffs: 'League + Playoffs',
  classic_league: 'Classic League',
};

export default function TournamentListScreen({ }) {
  const { tournaments } = useTournamentsList();
  const router = useRouter();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/(tabs)/tournaments/tournamentdetailscreen',
          params: { tournamentId: item.id },
        })
      }
      className="bg-white/10 border border-white/15 rounded-2xl p-4 mb-3 mx-4">
      <View className="flex-row justify-between items-start">
        <Text className="text-white font-bold text-base flex-1">{item.name}</Text>
        <View className={`px-2 py-0.5 rounded-full ${item.status === 'active' ? 'bg-secondary/20' : item.status === 'completed' ? 'bg-muted/20' : 'bg-primary/20'}`}>
          <Text className={`text-xs font-bold capitalize ${item.status === 'active' ? 'text-secondary' : item.status === 'completed' ? 'text-muted' : 'text-primary'}`}>{item.status}</Text>
        </View>
      </View>
      <Text className="text-gray-400 text-sm mt-1">{FORMAT_LABEL[item.format] || item.format}</Text>
      <Text className="text-accent text-xs mt-1">Max {item.max_teams} teams</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      <GradientBackground>
        <SafeAreaView className="flex-1">
          <View className="flex-row justify-between items-center px-4 py-4">
            <Text className="text-white text-2xl font-black">Tournaments</Text>
            <Button
              title="+ New"
              onPress={() =>
                router.push('/(tabs)/tournaments/createtournamentscreen')
              }
              className="py-2 px-4"
            />
          </View>
          <FlatList data={tournaments} keyExtractor={i => i.id} renderItem={renderItem} ListEmptyComponent={<Text className="text-muted text-center mt-12">No tournaments yet</Text>} />
        </SafeAreaView>
      </GradientBackground>
    </View>
  );
}
