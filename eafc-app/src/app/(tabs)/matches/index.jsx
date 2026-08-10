import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useMatchesHub from '../../../hooks/useMatchesHub';
import { GameDayMatchCard, ScheduleMatchRow } from '../../../components/matches/MatchHubCards';
import {
  GamerProfileShell,
  GamerTabNav,
  CYAN,
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';
import {
  PitchAtmosphere,
  SectionCard,
  SectionTitle,
  FUT,
} from '@/components/dashboard/CommandCenterUI';
import { headingStyle, headingStyleSm } from '@/lib/fonts';

const TABS = [
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Results' },
];

export default function MatchesIndex() {
  const router = useRouter();
  const {
    loading,
    error,
    reload,
    live,
    upcoming,
    results,
    filteredGameDay,
    leagueGroups,
    leagueFilter,
    setLeagueFilter,
  } = useMatchesHub();
  const [tab, setTab] = useState('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const tabs = useMemo(
    () => TABS.map((t) => ({
      ...t,
      badge: t.id === 'live' && live.length > 0
        ? String(live.length)
        : t.id === 'upcoming'
          ? String(upcoming.length)
          : String(results.length),
    })),
    [live.length, upcoming.length, results.length],
  );

  const list = useMemo(() => {
    const applyLeague = (rows) =>
      leagueFilter === 'all' ? rows : rows.filter((e) => e.competition === leagueFilter);
    if (tab === 'live') return applyLeague(live);
    if (tab === 'results') return results;
    return applyLeague(upcoming);
  }, [tab, live, upcoming, results, leagueFilter]);

  const openMatch = (event) => {
    router.push({
      pathname: '/(tabs)/matches/matchdetailscreen',
      params: { matchId: event.id },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={CYAN} size="large" />
        </View>
      </GamerProfileShell>
    );
  }

  const sectionEyebrow = tab === 'live' ? 'GAME DAY' : tab === 'upcoming' ? 'SCHEDULE' : 'ARCHIVE';
  const sectionTitle = tab === 'live'
    ? 'Live fixtures'
    : tab === 'upcoming'
      ? 'Upcoming fixtures'
      : 'Match results';

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 14 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />
          }
        >
          <PitchAtmosphere
            style={{
              borderWidth: 1.5,
              borderColor: 'rgba(0,232,255,0.35)',
              marginTop: 4,
              shadowColor: FUT.cyan,
              shadowOpacity: 0.35,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 12,
            }}
          >
            <View style={{ padding: 18 }}>
              <Text style={[headingStyleSm, { color: FUT.cyan, fontSize: 10, letterSpacing: 3.2 }]}>
                MATCH CENTER
              </Text>
              <Text
                style={[
                  headingStyle,
                  {
                    color: '#fff',
                    marginTop: 6,
                    fontSize: 26,
                    textShadowColor: 'rgba(0,232,255,0.35)',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 12,
                  },
                ]}
              >
                Matches
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8, lineHeight: 18 }}>
                Game Day ops and your full schedule in one place.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: 'rgba(0,232,255,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(0,232,255,0.35)',
                }}
                >
                  <Text style={{ color: FUT.cyan, fontSize: 11, fontWeight: '900' }}>
                    {filteredGameDay.length} ACTIVE
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,210,74,0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,210,74,0.3)',
                }}
                >
                  <Text style={{ color: FUT.gold, fontSize: 11, fontWeight: '900' }}>
                    {results.length} RESULTS
                  </Text>
                </View>
              </View>
            </View>
          </PitchAtmosphere>

          {error ? (
            <SectionCard accent="rose">
              <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text>
              <TouchableOpacity onPress={reload} style={{ marginTop: 8 }}>
                <Text style={{ color: CYAN, fontSize: 12, fontWeight: '800' }}>Retry</Text>
              </TouchableOpacity>
            </SectionCard>
          ) : null}

          <GamerTabNav tabs={tabs} active={tab} onChange={setTab} />

          {tab !== 'results' && leagueGroups.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <TouchableOpacity
                onPress={() => setLeagueFilter('all')}
                style={{
                  borderWidth: 1,
                  borderColor: leagueFilter === 'all' ? 'rgba(0,240,255,0.45)' : 'rgba(255,255,255,0.12)',
                  backgroundColor: leagueFilter === 'all' ? 'rgba(0,240,255,0.14)' : 'rgba(255,255,255,0.03)',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                }}
              >
                <Text style={{
                  color: leagueFilter === 'all' ? CYAN : 'rgba(255,255,255,0.5)',
                  fontSize: 11,
                  fontWeight: '800',
                }}
                >
                  All ({filteredGameDay.length})
                </Text>
              </TouchableOpacity>
              {leagueGroups.map((g) => {
                const active = leagueFilter === g.key;
                return (
                  <TouchableOpacity
                    key={g.key}
                    onPress={() => setLeagueFilter(g.key)}
                    style={{
                      borderWidth: 1,
                      borderColor: active ? 'rgba(0,240,255,0.45)' : 'rgba(255,255,255,0.12)',
                      backgroundColor: active ? 'rgba(0,240,255,0.14)' : 'rgba(255,255,255,0.03)',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      maxWidth: 220,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        color: active ? CYAN : 'rgba(255,255,255,0.5)',
                        fontSize: 11,
                        fontWeight: '800',
                      }}
                    >
                      {g.key} ({g.count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          <SectionCard>
            <SectionTitle eyebrow={sectionEyebrow}>{sectionTitle}</SectionTitle>

            {list.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 36, gap: 10 }}>
                <Ionicons name="calendar-outline" size={36} color="rgba(255,255,255,0.2)" />
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '800' }}>
                  {tab === 'live'
                    ? 'No live matches'
                    : tab === 'upcoming'
                      ? 'No upcoming fixtures'
                      : 'No results yet'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center' }}>
                  Pull to refresh when new fixtures drop.
                </Text>
              </View>
            ) : tab === 'results' ? (
              <View style={{
                borderRadius: 14,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(0,232,255,0.18)',
                backgroundColor: 'rgba(0,0,0,0.25)',
              }}
              >
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: 'rgba(0,232,255,0.08)',
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.08)',
                }}
                >
                  <Text style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 10,
                    fontWeight: '800',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}
                  >
                    Match
                  </Text>
                  <Text style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 10,
                    fontWeight: '800',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}
                  >
                    Result
                  </Text>
                </View>
                {list.map((event) => (
                  <ScheduleMatchRow key={event.id} event={event} onPress={() => openMatch(event)} />
                ))}
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {list.map((event) => (
                  <GameDayMatchCard key={event.id} event={event} onPress={() => openMatch(event)} />
                ))}
              </View>
            )}
          </SectionCard>
        </ScrollView>
      </SafeAreaView>
    </GamerProfileShell>
  );
}
