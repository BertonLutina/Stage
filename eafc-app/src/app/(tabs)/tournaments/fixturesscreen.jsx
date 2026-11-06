import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import useTournament from '@/hooks/useTournament';
import { Button, Card, Chip, Screen } from '@/components/ui';
import { SCREEN_GUTTER, guideFabClearance } from '@/components/ui/metrics';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import CompetitionHeader from '@/components/tournament/CompetitionHeader';

const FILTERS = ['all', 'scheduled', 'completed'];
const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const terminal = (status) => ['completed', 'forfeit'].includes(String(status || '').toLowerCase());
const teamName = (item, side) => item?.[`${side}_club_name`] || item?.[`${side}_player_name`] || item?.[`${side}_team_name`] || 'TBD';

function FixtureCard({ item, onPress }) {
  const tokens = useThemeStore((state) => state.tokens);
  const complete = terminal(item.status);
  const date = item.scheduled_at ? new Date(item.scheduled_at) : null;
  const time = date && !Number.isNaN(date.getTime())
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'vs';

  return (
    <Card onPress={onPress} highlight={!complete} style={{ paddingVertical: 14, paddingHorizontal: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text numberOfLines={1} style={{ flex: 1, textAlign: 'right', color: tokens.text, fontSize: 14, fontWeight: '600' }}>
          {teamName(item, 'home')}
        </Text>
        <Text style={{ width: 70, color: complete ? tokens.text : tokens.cyan, fontFamily: complete ? FONT_EA_SPORTS : undefined, fontSize: complete ? 18 : 14, fontWeight: '700', textAlign: 'center' }}>
          {complete ? `${item.home_score ?? 0} - ${item.away_score ?? 0}` : time}
        </Text>
        <Text numberOfLines={1} style={{ flex: 1, color: tokens.text, fontSize: 14, fontWeight: '600' }}>
          {teamName(item, 'away')}
        </Text>
      </View>
      {complete && item.videos?.length > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          <Ionicons name="videocam-outline" size={16} color={tokens.aqua} />
          <Text style={{ color: tokens.aqua, fontSize: 12 }}>Video available</Text>
        </View>
      ) : null}
    </Card>
  );
}
export default function FixturesScreen() {
  const { tournamentId } = useLocalSearchParams();
  const router = useRouter();
  const tokens = useThemeStore((state) => state.tokens);
  const insets = useSafeAreaInsets();
  const { data, loading, error, refreshing, refetch } = useTournament(tournamentId);
  const [filter, setFilter] = useState('all');
  const fixtures = useMemo(() => {
    const rows = data?.fixtures || [];
    if (filter === 'completed') return rows.filter((item) => terminal(item.status));
    if (filter === 'scheduled') return rows.filter((item) => !terminal(item.status));
    return rows;
  }, [data?.fixtures, filter]);

  const header = (
    <View style={{ gap: 14, paddingBottom: 14, paddingHorizontal: SCREEN_GUTTER }}>
      <CompetitionHeader eyebrow={data?.tournament?.name || 'Tournament'} title="Fixtures" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FILTERS.map((item) => (
          <Chip key={item} label={capitalize(item)} active={filter === item} onPress={() => setFilter(item)} />
        ))}
      </View>
      {error ? (
        <Card style={{ gap: 12, alignItems: 'center' }}>
          <Text style={{ color: tokens.danger, textAlign: 'center' }}>{error}</Text>
          <Button title="Retry" variant="secondary" onPress={refetch} />
        </Card>
      ) : null}
    </View>
  );

  return (
    <Screen scroll={false} style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
      {header}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.cyan} />
        </View>
      ) : (
        <FlatList
          data={fixtures}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <FixtureCard
              item={item}
              onPress={() => router.push({
                pathname: '/(tabs)/matches/matchdetailscreen',
                params: { matchId: item.id },
              })}
            />
          )}
          ListEmptyComponent={
            <Text style={{ color: tokens.muted, textAlign: 'center', marginTop: 32, fontSize: 14 }}>
              No fixtures found
            </Text>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SCREEN_GUTTER, paddingBottom: guideFabClearance(insets.bottom) }}
        />
      )}
    </Screen>
  );
}
