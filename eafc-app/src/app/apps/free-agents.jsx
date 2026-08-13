import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import AppDirectoryScreen, { DirectoryRow, FilterChips } from '@/components/apps/AppDirectoryScreen';
import {
  PLAYER_POSITIONS,
  PLATFORMS,
  filterPlayerDirectory,
  loadFreeAgents,
  playerDisplayName,
} from '@/lib/stageDirectories';

export default function FreeAgentsScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('All');
  const [position, setPosition] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setPlayers(await loadFreeAgents());
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
      title="Free Agents"
      subtitle={`${rows.length} unsigned players`}
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
      emptyIcon="person-add-outline"
      emptyText="No free agents"
      renderItem={({ item }) => (
        <DirectoryRow
          title={playerDisplayName(item)}
          subtitle={[item.position, item.platform, item.country_code].filter(Boolean).join(' · ')}
          imageUrl={item.avatar_url}
          badge="Free"
          onPress={() => router.push({
            pathname: '/(tabs)/profile/profilescreen',
            params: { playerId: String(item.id) },
          })}
        />
      )}
    />
  );
}
