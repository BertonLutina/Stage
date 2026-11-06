import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchTournamentMatches, fetchTournamentPublic } from '@/api/tournamentActions';
import { calculateLeagueStandings, calculateGroupStandings } from '@/lib/tournamentEngine';
import useThemeStore from '@/store/themeStore';
import { Screen } from '@/components/ui';
import StandingsTable from '@/components/tournament/StandingsTable';
import CompetitionHeader from '@/components/tournament/CompetitionHeader';

export default function LeagueStandingsScreen() {
  const { tournamentId } = useLocalSearchParams();
  const tokens = useThemeStore((s) => s.tokens);
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!tournamentId) return;
    try {
      setError('');
      const [t, rows] = await Promise.all([
        fetchTournamentPublic(tournamentId).catch(() => null),
        fetchTournamentMatches(tournamentId),
      ]);
      setTournament(t);
      setMatches(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.message || 'Failed to load standings');
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  const isGroupStage = String(tournament?.type || '') === 'group_stage';
  const participantType = tournament?.participant_type === 'player' ? 'player' : 'club';
  const standingsOpts = useMemo(() => ({ participant_type: participantType }), [participantType]);
  const leagueRows = useMemo(
    () => calculateLeagueStandings(matches, standingsOpts),
    [matches, standingsOpts],
  );
  const groupTables = useMemo(() => {
    if (!isGroupStage) return [];
    const numGroups = Math.max(1, Number(tournament?.num_groups) || 2);
    return calculateGroupStandings(matches, numGroups, participantType).map((teams, index) => ({
      name: `Group ${String.fromCharCode(65 + index)}`,
      teams,
    }));
  }, [isGroupStage, matches, tournament?.num_groups, participantType]);

  return (
    <Screen
      refreshControl={loading ? undefined : (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={tokens.cyan}
        />
      )}
    >
      <View style={{ gap: 14 }}>
        <CompetitionHeader eyebrow={tournament?.name || 'Tournament'} title="Standings" />

        {loading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={tokens.cyan} />
          </View>
        ) : (
          <>
            {error ? <Text style={{ color: tokens.danger, fontSize: 12 }}>{error}</Text> : null}

            {isGroupStage ? (
              groupTables.length ? groupTables.map((group) => (
                <StandingsTable
                  key={group.name}
                  title={group.name}
                  rows={group.teams}
                  emptyLabel="No group results yet"
                />
              )) : (
                <StandingsTable rows={[]} emptyLabel="No group results yet" />
              )
            ) : (
              <StandingsTable
                title={tournament?.type === 'league' ? 'League table' : 'Table'}
                rows={leagueRows}
              />
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
