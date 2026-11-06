import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchTournamentMatches, fetchTournamentPublic } from '@/api/tournamentActions';
import useThemeStore from '@/store/themeStore';
import { Screen } from '@/components/ui';
import BracketView from '../../../components/tournament/BracketView';
import CompetitionHeader from '../../../components/tournament/CompetitionHeader';

export default function BracketScreen() {
  const { tournamentId } = useLocalSearchParams();
  const tokens = useThemeStore((s) => s.tokens);
  const [matches, setMatches] = useState([]);
  const [title, setTitle] = useState('Bracket');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!tournamentId) return;
    try {
      setError('');
      const [tournament, rows] = await Promise.all([
        fetchTournamentPublic(tournamentId).catch(() => null),
        fetchTournamentMatches(tournamentId),
      ]);
      if (tournament?.name) setTitle(tournament.name);
      setMatches(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.message || 'Failed to load bracket');
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

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
        <CompetitionHeader eyebrow={title === 'Bracket' ? null : title} title="Bracket" />
        {loading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={tokens.cyan} />
          </View>
        ) : (
          <>
            {error ? (
              <Text style={{ color: tokens.danger, textAlign: 'center', paddingVertical: 24, fontSize: 14 }}>
                {error}
              </Text>
            ) : null}
            <BracketView matches={matches} />
          </>
        )}
      </View>
    </Screen>
  );
}
