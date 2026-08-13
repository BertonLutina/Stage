import React, { useEffect, useMemo, useState } from 'react';
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
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import {
  clubDisplayName,
  filterClubDirectory,
  loadClubDirectory,
} from '@/lib/stageDirectories';

function ClubRow({ club, isClubOwner, onChallenge, onPress }) {
  const name = clubDisplayName(club);
  const subtitle = [club.tag ? `[${club.tag}]` : null, club.region, club.platform].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-3 border-b border-white/5"
    >
      <View className="h-12 w-12 rounded-full bg-white/10 items-center justify-center overflow-hidden">
        {club.logo_url ? (
          <Image source={{ uri: club.logo_url }} className="h-12 w-12" />
        ) : (
          <Ionicons name="shield" size={24} color="rgba(255,255,255,0.5)" />
        )}
      </View>
      <View className="ml-3 flex-1">
        <STText className="font-semibold">{name}</STText>
        <STText className="text-xs opacity-70">{subtitle || 'Club'}</STText>
      </View>
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          onChallenge?.(club);
        }}
        className="rounded-lg bg-[#5FE3E8]/20 px-3 py-1.5"
      >
        <STText className="text-xs font-semibold" style={{ color: '#5FE3E8' }}>
          {isClubOwner ? 'Challenge' : 'View'}
        </STText>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function SearchClubs() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClubOwner, setIsClubOwner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [rows, identity] = await Promise.all([
        loadClubDirectory(),
        resolveMyPlayerAndClub().catch(() => ({})),
      ]);
      if (cancelled) return;
      setClubs(rows);
      setIsClubOwner(Boolean(identity.presidentClub?.id));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => filterClubDirectory(clubs, { query }),
    [clubs, query],
  );

  const handleSelectClub = (club) => {
    router.push({
      pathname: '/apps/club/[id]',
      params: { id: club.id },
    });
  };

  const handleChallenge = (club) => {
    router.push({
      pathname: '/(tabs)/matches',
      params: {
        arrange: '1',
        opponentKind: 'club',
        opponentId: club.id,
        opponentName: clubDisplayName(club),
        opponentTag: club.tag || '',
        opponentEmail: club.owner_email || '',
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
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClubRow
              club={item}
              isClubOwner={isClubOwner}
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
