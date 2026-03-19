import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import STText from '../../../components/common/STText';
import useAuthStore from '../../../store/authStore';
import api from '../../../utils/api';

// TODO: Replace with GET /users/search or similar when backend supports player search
const MOCK_PLAYERS = [
  { id: '1', first_name: 'Alex', last_name: 'Rivera', gamer_tag: 'alex_fc', avatar: null },
  { id: '2', first_name: 'Jordan', last_name: 'Lee', gamer_tag: 'jlee99', avatar: null },
  { id: '3', first_name: 'Sam', last_name: 'Chen', gamer_tag: 'sam_kick', avatar: null },
  { id: '4', first_name: 'Morgan', last_name: 'Taylor', gamer_tag: 'morg_striker', avatar: null },
  { id: '5', first_name: 'Riley', last_name: 'Davis', gamer_tag: 'riley_d', avatar: null },
];

function PlayerRow({ player, isClubOwner, onChallenge, onInvite, onPress }) {
  const name = `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Player';
  const tag = player.gamer_tag ? `@${player.gamer_tag}` : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-3 border-b border-white/5"
    >
      <View className="h-12 w-12 rounded-full bg-white/10 items-center justify-center overflow-hidden">
        {player.avatar ? (
          <Image source={{ uri: player.avatar }} className="h-12 w-12" />
        ) : (
          <Ionicons name="person" size={24} color="rgba(255,255,255,0.5)" />
        )}
      </View>
      <View className="ml-3 flex-1">
        <STText className="font-semibold">{name}</STText>
        <STText className="text-xs opacity-70">{tag || 'No gamertag'}</STText>
      </View>
      {isClubOwner ? (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onInvite?.(player);
          }}
          className="rounded-lg bg-[#5FE3E8]/20 px-3 py-1.5"
        >
          <STText className="text-xs font-semibold" style={{ color: '#5FE3E8' }}>
            Invite
          </STText>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onChallenge?.(player);
          }}
          className="rounded-lg border border-[#5FE3E8]/50 px-3 py-1.5"
        >
          <STText className="text-xs font-semibold" style={{ color: '#5FE3E8' }}>
            Challenge
          </STText>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function SearchPlayers() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClubOwner, setIsClubOwner] = useState(false);

  useEffect(() => {
    // Detect role: club owner = user owns at least one team
    const checkRole = async () => {
      if (!user?.id) {
        setIsClubOwner(false);
        return;
      }
      try {
        const { data } = await api.get(`/users/${user.id}`);
        const teams = data.data?.teams ?? [];
        const owned = teams.some((t) => t.role === 'owner');
        setIsClubOwner(owned);
      } catch {
        setIsClubOwner(false);
      }
    };
    checkRole();
  }, [user?.id]);

  useEffect(() => {
    // TODO: Replace with api.get(`/users/search?q=${query}`) when backend ready
    setLoading(true);
    const timer = setTimeout(() => {
      const q = query.toLowerCase().trim();
      const filtered = MOCK_PLAYERS.filter(
        (p) =>
          !q ||
          (p.gamer_tag || '').toLowerCase().includes(q) ||
          (p.first_name || '').toLowerCase().includes(q) ||
          (p.last_name || '').toLowerCase().includes(q)
      );
      setPlayers(filtered);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectPlayer = (player) => {
    router.push({
      pathname: '/(tabs)/profile/profilescreen',
      params: { userId: player.id },
    });
  };

  const handleChallenge = (player) => {
    // TODO: Implement challenge flow when backend ready
    console.log('Challenge player:', player.id);
  };

  const handleInvite = (player) => {
    // TODO: Implement invite-to-club flow when backend ready
    console.log('Invite player to club:', player.id);
  };

  return (
    <View className="flex-1">
      <View className="px-4 py-3">
        <TextInput
          placeholder="Search players..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={query}
          onChangeText={setQuery}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-base"
          style={{ color: '#fff' }}
        />
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator color="#5FE3E8" />
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlayerRow
              player={item}
              isClubOwner={isClubOwner}
              onChallenge={handleChallenge}
              onInvite={handleInvite}
              onPress={() => handleSelectPlayer(item)}
            />
          )}
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.3)" />
              <STText className="mt-2 opacity-60">No players found</STText>
            </View>
          }
        />
      )}
    </View>
  );
}
