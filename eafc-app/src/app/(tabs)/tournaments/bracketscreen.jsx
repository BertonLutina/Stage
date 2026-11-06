import React from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import useTournament from '@/hooks/useTournament';
import { Button, Card, Screen } from '@/components/ui';
import BracketView from '@/components/tournament/BracketView';
import CompetitionHeader from '@/components/tournament/CompetitionHeader';

export default function BracketScreen() {
  const { tournamentId } = useLocalSearchParams();
  const tokens = useThemeStore((state) => state.tokens);
  const { data, loading, error, refreshing, refetch } = useTournament(tournamentId);

  return (
    <Screen
      refreshControl={loading ? undefined : (
        <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} />
      )}
    >
      <View style={{ gap: 16 }}>
        <CompetitionHeader eyebrow={data?.tournament?.name || 'Tournament'} title="Bracket" />
        {loading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator color={tokens.cyan} />
          </View>
        ) : error ? (
          <Card style={{ gap: 14, alignItems: 'center' }}>
            <Text style={{ color: tokens.danger, textAlign: 'center' }}>{error}</Text>
            <Button title="Retry" variant="secondary" onPress={refetch} />
          </Card>
        ) : (
          <BracketView matches={data?.bracketMatches || []} />
        )}
      </View>
    </Screen>
  );
}
