import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PlayerCard from '../../components/team/PlayerCard';
import FormationView from '../../components/team/FormationView';

export default function TeamProfileScreen({ route, navigation }) {
  const { teamId } = route.params;
  const [team, setTeam] = useState(null);
  const [formation, setFormation] = useState(null);

  useEffect(() => {
    api.get(`/teams/${teamId}`).then(r => setTeam(r.data.data));
    api.get(`/teams/${teamId}/formation`).then(r => setFormation(r.data.data));
  }, [teamId]);

  if (!team) return <View className="flex-1 bg-dark items-center justify-center"><Text className="text-muted">Loading...</Text></View>;

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="items-center pt-6 pb-4 px-6">
          <Avatar uri={team.avatar} name={team.club_name} size={80} />
          <Text className="text-white text-2xl font-black mt-3">{team.club_name}</Text>
          <Text className="text-muted text-sm mt-1">{team.country} • Est. {team.creation_date?.slice(0, 4)}</Text>
          <View className="flex-row mt-4 gap-6">
            <View className="items-center"><Text className="text-primary font-bold text-lg">{team.followers_count || 0}</Text><Text className="text-muted text-xs">Followers</Text></View>
            <View className="items-center"><Text className="text-secondary font-bold text-lg">{team.wins || 0}</Text><Text className="text-muted text-xs">Wins</Text></View>
            <View className="items-center"><Text className="text-muted font-bold text-lg">{team.draws || 0}</Text><Text className="text-muted text-xs">Draws</Text></View>
            <View className="items-center"><Text className="text-danger font-bold text-lg">{team.losses || 0}</Text><Text className="text-muted text-xs">Losses</Text></View>
          </View>
          <View className="flex-row gap-3 mt-4 w-full">
            <Button title="Dressing Room" variant="outline" onPress={() => navigation.navigate('DressingRoom', { teamId })} className="flex-1" />
            <Button title="Formation" variant="ghost" onPress={() => navigation.navigate('Formation', { teamId })} className="flex-1" />
          </View>
        </View>

        {formation && (
          <View className="px-4">
            <FormationView formation={formation} players={formation.positions || []} />
          </View>
        )}

        <View className="px-4 pb-8">
          <Text className="text-white font-bold text-lg mb-3">Squad ({team.players?.length || 0})</Text>
          {(team.players || []).map(p => (
            <PlayerCard key={p.user_id} player={p} compact onPress={() => navigation.navigate('Profile', { userId: p.user_id })} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
