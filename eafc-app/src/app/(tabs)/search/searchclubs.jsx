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

function ClubRow({ club, isClubOwner, onJoin, onChallenge, onPress }) {
  const name = club.club_name || 'Club';
  const subtitle = [club.country, `${club.players?.length || 0} members`].filter(Boolean).join(' • ');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-3 border-b border-white/5"
    >
      <View className="h-12 w-12 rounded-full bg-white/10 items-center justify-center overflow-hidden">
        {club.avatar ? (
          <Image source={{ uri: club.avatar }} className="h-12 w-12" />
        ) : (
          <Ionicons name="shield" size={24} color="rgba(255,255,255,0.5)" />
        )}
      </View>
      <View className="ml-3 flex-1">
        <STText className="font-semibold">{name}</STText>
        <STText className="text-xs opacity-70">{subtitle || 'No details'}</STText>
      </View>
      {isClubOwner ? (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onChallenge?.(club);
          }}
          className="rounded-lg bg-[#5FE3E8]/20 px-3 py-1.5"
        >
          <STText className="text-xs font-semibold" style={{ color: '#5FE3E8' }}>
            Challenge
          </STText>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onJoin?.(club);
          }}
          className="rounded-lg border border-[#5FE3E8]/50 px-3 py-1.5"
        >
          <STText className="text-xs font-semibold" style={{ color: '#5FE3E8' }}>
            Join
          </STText>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function SearchClubs() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClubOwner, setIsClubOwner] = useState(false);

  useEffect(() => {
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
    setLoading(true);
    api
      .get('/teams/with-members')
      .then((r) => {
        const all = r.data.data || [];
        const q = query.toLowerCase().trim();
        const filtered = !q
          ? all
          : all.filter(
              (c) =>
                (c.club_name || '').toLowerCase().includes(q) ||
                (c.handle || '').toLowerCase().includes(q) ||
                (c.country || '').toLowerCase().includes(q)
            );
        setClubs(filtered);
      })
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  }, [query]);

  const handleSelectClub = (club) => {
    router.push({
      pathname: '/teams/teamprofilescreen',
      params: { teamId: club.id },
    });
  };

  const handleJoin = async (club) => {
    if (!user?.id) return;
    try {
      await api.post(`/teams/${club.id}/join-request`);
      alert('Request sent! The club owner will review your request.');
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to send request';
      if (e.response?.status === 409) alert('You already have a pending request for this club.');
      else alert(msg);
    }
  };

  const handleChallenge = (club) => {
    router.push({
      pathname: '/(tabs)/matches',
      params: {
        arrange: '1',
        opponentKind: 'club',
        opponentId: club.id,
        opponentName: club.club_name || club.name,
        opponentTag: club.tag || '',
        opponentEmail: club.owner_email || club.president_email || '',
      },
    });
  };

  return (
    <View className="flex-1">
      <View className="px-4 py-3">
        <TextInput
          placeholder="Search clubs..."
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
          data={clubs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClubRow
              club={item}
              isClubOwner={isClubOwner}
              onJoin={handleJoin}
              onChallenge={handleChallenge}
              onPress={() => handleSelectClub(item)}
            />
          )}
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Ionicons name="shield-outline" size={48} color="rgba(255,255,255,0.3)" />
              <STText className="mt-2 opacity-60">No clubs found</STText>
            </View>
          }
        />
      )}
    </View>
  );
}
