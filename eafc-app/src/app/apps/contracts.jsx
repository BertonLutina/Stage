import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import AppDirectoryScreen, { DirectoryRow } from '@/components/apps/AppDirectoryScreen';
import { getContractTargetPlayerId, getContractTypeLabel, statusLabel, weeklyWage } from '@/lib/playerContractFields';
import { loadClubContracts, playerDisplayName } from '@/lib/stageDirectories';

export default function ContractsScreen() {
  const router = useRouter();
  const [bundle, setBundle] = useState({ club: null, contracts: [], players: [] });
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setBundle(await loadClubContracts());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const playersById = useMemo(() => {
    const map = {};
    bundle.players.forEach((player) => { if (player?.id) map[player.id] = player; });
    return map;
  }, [bundle.players]);

  const rows = useMemo(() => {
    return bundle.contracts.filter((contract) => {
      const status = String(contract.status || '').toLowerCase();
      if (tab === 'active') return status === 'active';
      if (tab === 'offers') return ['pending', 'offered', 'sent'].includes(status);
      return true;
    });
  }, [bundle.contracts, tab]);

  return (
    <AppDirectoryScreen
      title="Contracts"
      subtitle={bundle.club?.name || 'Your club office'}
      chips={[{ id: 'active', label: 'Active' }, { id: 'offers', label: 'Offers' }, { id: 'all', label: 'All' }]}
      chipValue={tab}
      onChip={setTab}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={rows}
      keyExtractor={(item) => String(item.id)}
      emptyIcon="document-text-outline"
      emptyText={bundle.club ? 'No contracts in this filter' : 'No club to manage'}
      renderItem={({ item }) => {
        const playerId = getContractTargetPlayerId(item);
        const player = playersById[playerId];
        return (
          <DirectoryRow
            title={player ? playerDisplayName(player) : (item.player_gamertag || 'Player')}
            subtitle={[getContractTypeLabel(item), statusLabel(item.status), weeklyWage(item) ? `${weeklyWage(item)} STC` : null].filter(Boolean).join(' · ')}
            imageUrl={player?.avatar_url}
            fallbackIcon="document-text-outline"
            badge={statusLabel(item.status)}
            onPress={() => {
              if (!playerId) return;
              router.push({
                pathname: '/(tabs)/profile/profilescreen',
                params: { playerId: String(playerId) },
              });
            }}
          />
        );
      }}
    />
  );
}
