import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import AppDirectoryScreen, { DirectoryRow, FilterChips } from '@/components/apps/AppDirectoryScreen';
import {
  PLAYER_POSITIONS,
  PLATFORMS,
  filterTransferEntries,
  loadTransferMarket,
  playerDisplayName,
  transferBadgeLabel,
} from '@/lib/stageDirectories';

const STATUS_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'free_agent', label: 'Free' },
  { id: 'expiring', label: 'Expiring' },
];

export default function TransfersScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [position, setPosition] = useState('All');
  const [platform, setPlatform] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const market = await loadTransferMarket();
    setEntries(market.entries);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(
    () => filterTransferEntries(entries, { query, status, position, platform }),
    [entries, query, status, position, platform],
  );

  return (
    <AppDirectoryScreen
      title="Transfers"
      subtitle={`${rows.length} available`}
      searchPlaceholder="Search listed players"
      query={query}
      onQuery={setQuery}
      chips={STATUS_CHIPS}
      chipValue={status}
      onChip={setStatus}
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
      keyExtractor={(item) => String(item.player?.id || item.badgeType)}
      emptyIcon="swap-horizontal-outline"
      emptyText="No listed players"
      renderItem={({ item }) => (
        <DirectoryRow
          title={playerDisplayName(item.player)}
          subtitle={[item.player?.position, item.player?.platform].filter(Boolean).join(' · ')}
          imageUrl={item.player?.avatar_url}
          badge={transferBadgeLabel(item.badgeType, item.days_left)}
          onPress={() => router.push({
            pathname: '/(tabs)/profile/profilescreen',
            params: { playerId: String(item.player.id) },
          })}
        />
      )}
    />
  );
}
