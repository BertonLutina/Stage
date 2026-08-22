import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import AppDirectoryScreen, { DirectoryRow, FilterChips } from '@/components/apps/AppDirectoryScreen';
import {
  CLUB_REGIONS,
  PLATFORMS,
  clubDisplayName,
  filterClubDirectory,
  loadClubDirectory,
} from '@/lib/stageDirectories';

export default function FindClubsScreen() {
  const router = useRouter();
  const [clubs, setClubs] = useState([]);
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('All');
  const [region, setRegion] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setClubs(await loadClubDirectory());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(
    () => filterClubDirectory(clubs, { query, platform, region }),
    [clubs, query, platform, region],
  );

  return (
    <AppDirectoryScreen
      title="Clubs"
      subtitle={`${rows.length} clubs`}
      searchPlaceholder="Search name or tag"
      query={query}
      onQuery={setQuery}
      extraFilters={(
        <>
          <FilterChips options={PLATFORMS} value={platform} onChange={setPlatform} />
          <FilterChips options={CLUB_REGIONS} value={region} onChange={setRegion} />
        </>
      )}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={rows}
      keyExtractor={(item) => String(item.id)}
      emptyIcon="shield-outline"
      emptyText="No clubs match"
      renderItem={({ item }) => (
        <DirectoryRow
          title={clubDisplayName(item)}
          subtitle={[item.tag ? `[${item.tag}]` : null, item.region, item.platform, item.country_code].filter(Boolean).join(' · ')}
          imageUrl={item.logo_url}
          fallbackIcon="shield-outline"
          actionLabel="VS"
          onAction={() => router.push({
            pathname: '/(tabs)/matches',
            params: {
              arrange: '1',
              opponentKind: 'club',
              opponentId: item.id,
              opponentName: clubDisplayName(item),
              opponentTag: item.tag || '',
              opponentEmail: item.owner_email || '',
            },
          })}
          onPress={() => router.push({ pathname: '/apps/club/[id]', params: { id: String(item.id) } })}
        />
      )}
    />
  );
}
