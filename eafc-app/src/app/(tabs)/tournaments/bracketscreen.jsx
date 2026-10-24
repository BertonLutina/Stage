import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { fetchTournamentMatches, fetchTournamentPublic } from '@/api/tournamentActions';
import BracketView from '../../../components/tournament/BracketView';
import GradientBackground from '../../../components/common/GradientBackground';
import BackButton from '../../../components/common/BackButton';

export default function BracketScreen() {
  const { tournamentId } = useLocalSearchParams();
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
    <View className="flex-1">
      <GradientBackground>
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center gap-4 px-4 py-3 border-b border-white/10">
            <BackButton variant="light" />
            <Text className="text-white text-xl font-bold flex-1" numberOfLines={1}>{title}</Text>
          </View>
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#00F0FF" />
            </View>
          ) : (
            <ScrollView
              className="px-4"
              refreshControl={(
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => { setRefreshing(true); load(); }}
                  tintColor="#00F0FF"
                />
              )}
            >
              {error ? (
                <Text className="text-rose-400 text-center py-6 text-sm">{error}</Text>
              ) : null}
              <BracketView matches={matches} />
            </ScrollView>
          )}
        </SafeAreaView>
      </GradientBackground>
    </View>
  );
}
