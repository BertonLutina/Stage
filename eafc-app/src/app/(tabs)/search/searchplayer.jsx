import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { Card, Screen } from '@/components/ui';
import DirectoryResultRow from '@/components/directory/DirectoryResultRow';
import DirectorySearchField from '@/components/directory/DirectorySearchField';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import { playerAvatarInitials } from '@/lib/playerAvatar';
import {
  filterPlayerDirectory,
  loadPlayerDirectory,
  playerDisplayName,
} from '@/lib/stageDirectories';
import { countryCodeToFlagEmoji, getPlayerNationality } from '@/lib/countryDisplay';

function playerMetaLine(player) {
  const nation = getPlayerNationality(player);
  const flag = countryCodeToFlagEmoji(nation.code, player.country);
  const place = [flag, nation.label !== 'Unknown' ? nation.label : null]
    .filter(Boolean).join(' ')
    || 'Player';
  return [place, player.platform].filter(Boolean).join(' · ');
}

function PlayerRow({ player, isClubOwner, onChallenge, onPress }) {
  const name = playerDisplayName(player);
  const badges = [player.position, player.secondary_position].filter(Boolean);

  return (
    <DirectoryResultRow
      imageUrl={player.avatar_url}
      bannerUrl={player.banner_url}
      bannerZoom={player.banner_zoom}
      initials={playerAvatarInitials(player)}
      name={name}
      badges={badges}
      meta={playerMetaLine(player)}
      actionLabel={isClubOwner ? 'INVITE' : 'CHALLENGE'}
      onPress={onPress}
      onAction={() => onChallenge?.(player)}
    />
  );
}

export default function SearchPlayers() {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
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
    <Screen scroll={false}>
      <View style={{ flex: 1, gap: 14 }}>
        <DirectorySearchField
          placeholder="Search players..."
          value={query}
          onChangeText={setQuery}
        />
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <ActivityIndicator color={tokens.cyan} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <PlayerRow
                player={item}
                isClubOwner={isClubOwner}
                onChallenge={handleChallenge}
                onPress={() => handleSelectPlayer(item)}
              />
            )}
            ListEmptyComponent={
              <Card style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
                <Ionicons name="people-outline" size={36} color={tokens.muted} />
                <Text style={{ color: tokens.muted, fontSize: 14, fontWeight: '600' }}>No players found</Text>
              </Card>
            }
          />
        )}
      </View>
    </Screen>
  );
}
