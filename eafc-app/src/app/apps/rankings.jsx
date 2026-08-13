import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AppDirectoryScreen, { DirectoryRow, FilterChips } from '@/components/apps/AppDirectoryScreen';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import { clubDisplayName, filterRankings, formatSTC, loadRankings, playerDisplayName } from '@/lib/stageDirectories';

const VIEWS = [
  { id: 'clubs', label: 'Clubs' },
  { id: 'players', label: 'Players' },
];

export default function RankingsScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState({ clubs: [], players: [], meta: {} });
  const [view, setView] = useState('clubs');
  const [scope, setScope] = useState('global');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setSummary(await loadRankings());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasFull = summary?.meta?.full_access !== false;
  const clubs = summary.clubs || [];
  const players = summary.players || [];
  const regions = useMemo(
    () => [...new Set([...clubs, ...players].map((row) => row.region).filter(Boolean))].sort(),
    [clubs, players],
  );
  const countries = useMemo(
    () => [...new Set([...clubs, ...players].map((row) => row.country_code).filter(Boolean))].sort(),
    [clubs, players],
  );

  const rows = useMemo(() => {
    const source = view === 'clubs' ? clubs : players;
    return filterRankings(source, {
      scope: hasFull ? scope : 'global',
      region,
      country,
    });
  }, [view, clubs, players, scope, region, country, hasFull]);

  return (
    <AppDirectoryScreen
      title="Rankings"
      subtitle={`${summary?.meta?.official_fixtures_count || 0} official fixtures`}
      chips={VIEWS}
      chipValue={view}
      onChip={setView}
      extraFilters={hasFull ? (
        <>
          <FilterChips
            options={[{ id: 'global', label: 'Global' }, { id: 'regional', label: 'Regional' }, { id: 'country', label: 'Country' }]}
            value={scope}
            onChange={setScope}
          />
          {scope === 'regional' ? (
            <FilterChips
              options={[{ id: '', label: 'All regions' }, ...regions.map((value) => ({ id: value, label: value }))]}
              value={region}
              onChange={setRegion}
            />
          ) : null}
          {scope === 'country' ? (
            <FilterChips
              options={[{ id: '', label: 'All countries' }, ...countries.map((value) => ({ id: value, label: value }))]}
              value={country}
              onChange={setCountry}
            />
          ) : null}
        </>
      ) : (
        <Text style={{ color: 'rgba(255,214,10,0.8)', fontSize: 12 }}>
          Free accounts see the top board. STAGE Plus unlocks full scopes.
        </Text>
      )}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={rows}
      keyExtractor={(item, index) => String(item.id || index)}
      emptyIcon="stats-chart-outline"
      emptyText="No ranked rows yet"
      ListHeaderComponent={(
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          <Stat label="Clubs" value={clubs.length} />
          <Stat label="Players" value={players.length} />
        </View>
      )}
      renderItem={({ item, index }) => (
        view === 'clubs' ? (
          <DirectoryRow
            title={clubDisplayName(item)}
            subtitle={[`#${index + 1}`, item.region, item.country_code, `${item.wins || 0}W`].filter(Boolean).join(' · ')}
            imageUrl={item.logo_url}
            fallbackIcon="shield-outline"
            badge={formatSTC(item.ranking_points)}
            onPress={() => router.push({ pathname: '/apps/club/[id]', params: { id: String(item.id) } })}
          />
        ) : (
          <DirectoryRow
            title={playerDisplayName(item)}
            subtitle={[`#${index + 1}`, item.position, item.club_name].filter(Boolean).join(' · ')}
            imageUrl={item.avatar_url}
            badge={formatSTC(item.ranking_points)}
            onPress={() => router.push({
              pathname: '/(tabs)/profile/profilescreen',
              params: { playerId: String(item.id) },
            })}
          />
        )
      )}
    />
  );
}

function Stat({ label, value }) {
  return (
    <View style={{
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      backgroundColor: 'rgba(255,255,255,0.04)',
      padding: 12,
    }}
    >
      <Text style={{ color: CYAN, fontSize: 10, fontWeight: '800' }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 4 }}>{value}</Text>
    </View>
  );
}
