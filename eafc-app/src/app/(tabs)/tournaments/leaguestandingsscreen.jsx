import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { fetchTournamentMatches, fetchTournamentPublic } from '@/api/tournamentActions';
import { calculateLeagueStandings, calculateGroupStandings } from '@/lib/tournamentEngine';
import StandingsTable from '@/components/tournament/StandingsTable';
import GradientBackground from '../../../components/common/GradientBackground';
import BackButton from '../../../components/common/BackButton';

export default function LeagueStandingsScreen() {
  const { tournamentId } = useLocalSearchParams();
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
    <View style={styles.root}>
      <GradientBackground>
        <SafeAreaView style={styles.flex}>
          <View style={styles.topBar}>
            <BackButton variant="light" />
            <View style={styles.topText}>
              <Text style={styles.eyebrow}>STANDINGS</Text>
              <Text style={styles.title} numberOfLines={1}>
                {tournament?.name || 'Tournament'}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#00F0FF" />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scroll}
              refreshControl={(
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => { setRefreshing(true); load(); }}
                  tintColor="#00F0FF"
                />
              )}
            >
              {error ? <Text style={styles.error}>{error}</Text> : null}

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
            </ScrollView>
          )}
        </SafeAreaView>
      </GradientBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  topText: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: 'rgba(0,240,255,0.7)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },
  error: {
    color: '#FF6B8A',
    fontSize: 12,
    marginBottom: 4,
  },
});
