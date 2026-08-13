import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import AppDirectoryScreen, { DirectoryRow, FilterChips } from '@/components/apps/AppDirectoryScreen';
import {
  PLAYER_POSITIONS,
  PLATFORMS,
  clubDisplayName,
  filterPlayerDirectory,
  loadPlayerDirectory,
  playerDisplayName,
} from '@/lib/stageDirectories';

export default function FindPlayersScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [clubs, setClubs] = useState({});
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('All');
  const [position, setPosition] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await loadPlayerDirectory();
    setPlayers(data.players);
    setClubs(data.clubs);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(
    () => filterPlayerDirectory(players, { query, platform, position }),
    [players, query, platform, position],
  );

  return (
    <AppDirectoryScreen
      title="Find Players"
      subtitle={`${rows.length} public profiles`}
      searchPlaceholder="Search gamertag"
      query={query}
      onQuery={setQuery}
      extraFilters={(
        <>
          <FilterChips options={PLATFORMS} value={platform} onChange={setPlatform} />
          <FilterChips options={PLAYER_POSITIONS} value={position} onChange={setPosition} />
        </>
      )}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={rows}
      keyExtractor={(item) => String(item.id)}
      emptyText="No public players match"
      renderItem={({ item }) => {
        const club = item.club_id ? clubs[item.club_id] : null;
        return (
          <DirectoryRow
            title={playerDisplayName(item)}
            subtitle={[item.position, item.platform, club ? clubDisplayName(club) : 'Free agent'].filter(Boolean).join(' · ')}
            imageUrl={item.avatar_url}
            badge={item.overall_rating ? String(item.overall_rating) : null}
            actionLabel="VS"
            onAction={() => router.push({
              pathname: '/(tabs)/matches',
              params: {
                arrange: '1',
                opponentKind: 'player',
                opponentId: item.id,
                opponentName: playerDisplayName(item),
                opponentEmail: item.email || '',
              },
            })}
            onPress={() => router.push({
              pathname: '/(tabs)/profile/profilescreen',
              params: { playerId: String(item.id) },
            })}
          />
        );
      }}
    />
  );
}
