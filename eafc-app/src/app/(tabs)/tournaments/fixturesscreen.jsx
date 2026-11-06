import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../utils/api';
import useThemeStore from '@/store/themeStore';
import { Screen, Card, Chip } from '@/components/ui';
import { SCREEN_GUTTER, guideFabClearance } from '@/components/ui/metrics';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import CompetitionHeader from '../../../components/tournament/CompetitionHeader';

const FILTERS = ['all', 'scheduled', 'completed'];
const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

export default function FixturesScreen() {
  const { tournamentId } = useLocalSearchParams();
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const [fixtures, setFixtures] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams();
    if (tournamentId) params.append('tournament_id', tournamentId);
    if (filter !== 'all') params.append('status', filter);
    api.get(`/matches/fixtures?${params}`).then(r => setFixtures(r.data.data || []));
  }, [tournamentId, filter]);

  const renderItem = ({ item }) => (
    <Card
      onPress={() =>
        router.push({
          pathname: '/(tabs)/matches/matchdetailscreen',
          params: { matchId: item.id },
        })
      }
      style={{ paddingVertical: 12, paddingHorizontal: 14, marginBottom: 12 }}
    >
      {item.tournament_name ? (
        <Text
          numberOfLines={1}
          style={{
            color: tokens.muted,
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 11 * 0.08,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {item.tournament_name}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text
          numberOfLines={1}
          style={{ flex: 1, textAlign: 'right', color: tokens.text, fontSize: 13, fontWeight: '600' }}
        >
          {item.home_team_name}
        </Text>
        <View style={{ width: 64, alignItems: 'center' }}>
          {item.status === 'completed' ? (
            <Text
              numberOfLines={1}
              style={{ color: tokens.cyan, fontFamily: FONT_EA_SPORTS, fontSize: 18, letterSpacing: 0.5 }}
            >
              {item.home_score} - {item.away_score}
            </Text>
          ) : (
            <Text style={{ color: tokens.muted, fontSize: 14, fontWeight: '700' }}>vs</Text>
          )}
        </View>
        <Text
          numberOfLines={1}
          style={{ flex: 1, color: tokens.text, fontSize: 13, fontWeight: '600' }}
        >
          {item.away_team_name}
        </Text>
      </View>
      {item.status === 'completed' && item.videos?.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 8,
          }}
        >
          <Ionicons name="videocam-outline" size={16} color={tokens.aqua} />
          <Text style={{ color: tokens.aqua, fontSize: 12 }}>Video available</Text>
        </View>
      )}
    </Card>
  );

  const header = (
    <View style={{ gap: 14, paddingBottom: 14, paddingHorizontal: SCREEN_GUTTER }}>
      <CompetitionHeader title="Fixtures" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FILTERS.map(f => (
          <Chip key={f} label={capitalize(f)} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>
    </View>
  );

  return (
    <Screen scroll={false} style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
      {/* Header and filter chips live outside the list so they stay reachable while scrolling. */}
      {header}
      <FlatList
        data={fixtures}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ color: tokens.muted, textAlign: 'center', marginTop: 32, fontSize: 14 }}>
            No fixtures found
          </Text>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SCREEN_GUTTER,
          paddingBottom: guideFabClearance(insets.bottom),
        }}
      />
    </Screen>
  );
}
