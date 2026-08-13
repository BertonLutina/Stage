import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import AppDirectoryScreen, { DirectoryRow } from '@/components/apps/AppDirectoryScreen';
import { filterPresidentDirectory, loadPresidentDirectory } from '@/lib/stageDirectories';

export default function FindPresidentsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRows(await loadPresidentDirectory());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => filterPresidentDirectory(rows, query), [rows, query]);

  return (
    <AppDirectoryScreen
      title="Find Presidents"
      subtitle={`${filtered.length} club presidents`}
      searchPlaceholder="Search president or club"
      query={query}
      onQuery={setQuery}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={filtered}
      keyExtractor={(item) => String(item.id)}
      emptyIcon="star-outline"
      emptyText="No presidents match"
      renderItem={({ item }) => (
        <DirectoryRow
          title={item.display_name}
          subtitle={[item.club_name, item.club_tag ? `[${item.club_tag}]` : null, item.country_code, item.platform].filter(Boolean).join(' · ')}
          imageUrl={item.avatar_url || item.club_logo_url}
          fallbackIcon="star-outline"
          badge="President"
          onPress={() => router.push({
            pathname: '/(tabs)/profile/profilescreen',
            params: { playerId: String(item.player_id) },
          })}
        />
      )}
    />
  );
}
