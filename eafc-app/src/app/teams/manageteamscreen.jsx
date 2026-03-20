import React, { useEffect, useState } from 'react';
import { View, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import PlayerCard from '../../components/team/PlayerCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import STText from '../../components/common/STText';
import Avatar from '../../components/common/Avatar';

export default function ManageTeamScreen() {
  const { teamId } = useLocalSearchParams();
  const [players, setPlayers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [gamerTag, setGamerTag] = useState('');
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    loadPlayers();
    loadRequests();
  }, [teamId]);

  const loadPlayers = () => api.get(`/teams/${teamId}/players`).then(r => setPlayers(r.data.data));
  const loadRequests = () => {
    setLoadingRequests(true);
    api.get(`/teams/${teamId}/join-requests`).then(r => setRequests(r.data.data || [])).catch(() => setRequests([])).finally(() => setLoadingRequests(false));
  };

  const remove = (userId) => {
    Alert.alert('Remove Player', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => api.delete(`/teams/${teamId}/players/${userId}`).then(loadPlayers) },
    ]);
  };

  const acceptRequest = (requestId) => {
    api.post(`/teams/${teamId}/join-requests/${requestId}/accept`).then(() => { loadPlayers(); loadRequests(); }).catch((e) => Alert.alert('Error', e.response?.data?.message || 'Failed to accept'));
  };

  const declineRequest = (requestId) => {
    api.post(`/teams/${teamId}/join-requests/${requestId}/decline`).then(loadRequests).catch((e) => Alert.alert('Error', e.response?.data?.message || 'Failed to decline'));
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="px-4">
        <STText className="text-white text-xl font-bold mt-4 mb-4">Manage Team</STText>

        {/* Join requests */}
        <STText className="text-muted text-sm font-semibold mb-2">JOIN REQUESTS ({requests.length})</STText>
        {loadingRequests ? (
          <ActivityIndicator color="#5FE3E8" size="small" className="py-4" />
        ) : requests.length === 0 ? (
          <View className="py-4 rounded-xl bg-white/5 border border-white/10 mb-6">
            <STText className="text-muted text-sm text-center">No pending requests</STText>
          </View>
        ) : (
          <View className="mb-6 gap-2">
            {requests.map((r) => (
              <View key={r.id} className="flex-row items-center rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                <Avatar uri={r.avatar} name={r.gamer_tag} size={40} />
                <View className="ml-3 flex-1">
                  <STText className="text-white font-semibold">{r.gamer_tag || `${r.first_name || ''} ${r.last_name || ''}`.trim()}</STText>
                  <STText className="text-muted text-xs">Requested to join</STText>
                </View>
                <TouchableOpacity onPress={() => declineRequest(r.id)} className="p-2 mr-1">
                  <Ionicons name="close-circle" size={28} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => acceptRequest(r.id)} className="p-2">
                  <Ionicons name="checkmark-circle" size={28} color="#5FE3E8" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <STText className="text-muted text-sm font-semibold mb-2">SQUAD ({players.length})</STText>
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1"><Input value={gamerTag} onChangeText={setGamerTag} placeholder="Search by gamer tag" /></View>
        </View>
        {players.map(p => (
          <View key={p.user_id} className="flex-row items-center mb-2">
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
