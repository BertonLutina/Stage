import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import PlayerCard from '../../components/team/PlayerCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function ManageTeamScreen({ route }) {
  const { teamId } = route.params;
  const [players, setPlayers] = useState([]);
  const [gamerTag, setGamerTag] = useState('');

  useEffect(() => { loadPlayers(); }, [teamId]);

  const loadPlayers = () => api.get(`/teams/${teamId}/players`).then(r => setPlayers(r.data.data));

  const remove = (userId) => {
    Alert.alert('Remove Player', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => api.delete(`/teams/${teamId}/players/${userId}`).then(loadPlayers) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="px-4">
        <Text className="text-white text-xl font-bold mt-4 mb-4">Manage Team</Text>
        <View className="flex-row gap-2 mb-6">
          <View className="flex-1"><Input value={gamerTag} onChangeText={setGamerTag} placeholder="Search by gamer tag" /></View>
        </View>
        <Text className="text-muted text-sm font-semibold mb-2">SQUAD ({players.length} / no limit shown)</Text>
        {players.map(p => (
          <View key={p.user_id} className="flex-row items-center">
            <View className="flex-1">
              <PlayerCard player={p} compact />
            </View>
            {p.role !== 'owner' && (
              <Button title="Remove" variant="danger" onPress={() => remove(p.user_id)} className="ml-2 py-2 px-3" />
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
