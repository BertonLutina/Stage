import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AppDirectoryScreen, { DirectoryRow } from '@/components/apps/AppDirectoryScreen';
import { loadFollowBack } from '@/lib/stageDirectories';

export default function FollowBackScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('players');
  const [follows, setFollows] = useState({ clubs: [], players: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setFollows(await loadFollowBack());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = tab === 'clubs' ? follows.clubs : follows.players;

  return (
    <AppDirectoryScreen
      title="Follow Back"
      subtitle={`${follows.players.length} players · ${follows.clubs.length} clubs`}
      chips={[{ id: 'players', label: 'Players' }, { id: 'clubs', label: 'Clubs' }]}
      chipValue={tab}
      onChip={setTab}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={rows}
      keyExtractor={(item) => String(item.id)}
      emptyIcon="heart-outline"
      emptyText={tab === 'clubs' ? "You're not following any clubs yet." : "You're not following any players yet."}
      renderItem={({ item }) => (
        <DirectoryRow
          title={item.name}
          subtitle={item.type}
          imageUrl={item.avatar}
          fallbackIcon={item.type === 'club' ? 'shield-outline' : 'person-outline'}
          onPress={() => {
            if (item.type === 'club') {
              router.push({ pathname: '/apps/club/[id]', params: { id: String(item.targetId) } });
              return;
            }
            router.push({
              pathname: '/(tabs)/profile/profilescreen',
              params: { playerId: String(item.targetId) },
            });
          }}
        />
      )}
    />
  );
}
