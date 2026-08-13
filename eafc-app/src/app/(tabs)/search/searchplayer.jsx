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
  filterPlayerDirectory,
  loadPlayerDirectory,
  playerDisplayName,
} from '@/lib/stageDirectories';

function PlayerRow({ player, isClubOwner, onChallenge, onPress }) {
  const name = playerDisplayName(player);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-3 border-b border-white/5"
    >
      <View className="h-12 w-12 rounded-full bg-white/10 items-center justify-center overflow-hidden">
        {player.avatar_url ? (
          <Image source={{ uri: player.avatar_url }} className="h-12 w-12" />
        ) : (
          <Ionicons name="person" size={24} color="rgba(255,255,255,0.5)" />
        )}
      </View>
      <View className="ml-3 flex-1">
        <STText className="font-semibold">{name}</STText>
        <STText className="text-xs opacity-70">
          {[player.position, player.platform].filter(Boolean).join(' · ') || 'Player'}
        </STText>
      </View>
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          onChallenge?.(player);
        }}
        className="rounded-lg border border-[#5FE3E8]/50 px-3 py-1.5"
      >
        <STText className="text-xs font-semibold" style={{ color: '#5FE3E8' }}>
          {isClubOwner ? 'Invite' : 'Challenge'}
        </STText>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function SearchPlayers() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClubOwner, setIsClubOwner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ players: rows }, identity] = await Promise.all([
        loadPlayerDirectory(),
        resolveMyPlayerAndClub().catch(() => ({})),
      ]);
      if (cancelled) return;
      setPlayers(rows);
      setIsClubOwner(Boolean(identity.presidentClub?.id));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => filterPlayerDirectory(players, { query }),
    [players, query],
  );

  const handleSelectPlayer = (player) => {
    router.push({
      pathname: '/(tabs)/profile/profilescreen',
      params: { playerId: player.id },
    });
  };

  const handleChallenge = (player) => {
    router.push({
      pathname: '/(tabs)/matches',
      params: {
        arrange: '1',
        opponentKind: 'player',
        opponentId: player.id,
        opponentName: playerDisplayName(player),
        opponentEmail: player.email || '',
      },
    });
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
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlayerRow
              player={item}
              isClubOwner={isClubOwner}
              onChallenge={handleChallenge}
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
