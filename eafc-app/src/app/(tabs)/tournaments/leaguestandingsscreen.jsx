import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import useTournament from '@/hooks/useTournament';
import { Button, Card, Screen, SegmentedControl } from '@/components/ui';
import StandingsTable from '@/components/tournament/StandingsTable';
import CompetitionHeader from '@/components/tournament/CompetitionHeader';

const FILTERS = [
  { key: 'overall', label: 'Overall' },
  { key: 'home', label: 'Home' },
  { key: 'away', label: 'Away' },
  { key: 'form', label: 'Form' },
];

export default function LeagueStandingsScreen() {
  const { tournamentId } = useLocalSearchParams();
  const tokens = useThemeStore((state) => state.tokens);
  const { data, loading, error, refreshing, refetch } = useTournament(tournamentId);
  const [filter, setFilter] = useState('overall');
  const tournament = data?.tournament || null;
  const groups = data?.groups || [];
  const rows = data?.standings || [];
  const grouped = String(tournament?.type || '').toLowerCase() === 'group_stage';

  return (
    <Screen
      refreshControl={loading ? undefined : (
        <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} />
      )}
    >
      <View style={{ gap: 16 }}>
        <CompetitionHeader eyebrow={tournament?.name || 'Tournament'} title="Standings" />
        <SegmentedControl
          accessibilityLabel="Standings view"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />

        {loading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator color={tokens.cyan} />
          </View>
        ) : error ? (
          <Card style={{ gap: 14, alignItems: 'center' }}>
            <Text style={{ color: tokens.danger, textAlign: 'center' }}>{error}</Text>
            <Button title="Retry" variant="secondary" onPress={refetch} />
          </Card>
        ) : filter !== 'overall' ? (
          <Card style={{ gap: 8, alignItems: 'center', paddingVertical: 28 }}>
            <Text style={{ color: tokens.text, fontWeight: '700' }}>{FILTERS.find((item) => item.key === filter)?.label} split unavailable</Text>
            <Text style={{ color: tokens.muted, textAlign: 'center', lineHeight: 19 }}>
              Stage does not provide this standings split yet. Overall results remain available.
            </Text>
          </Card>
        ) : grouped ? (
          groups.length ? groups.map((group) => (
            <StandingsTable
              key={group.id}
              title={group.name}
              rows={group.teams}
              emptyLabel="No group results yet"
            />
          )) : <StandingsTable rows={[]} emptyLabel="No group results yet" />
        ) : (
          <StandingsTable title="League table" rows={rows} emptyLabel="No standings yet" />
        )}
      </View>
    </Screen>
  );
}
