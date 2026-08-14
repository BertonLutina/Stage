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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useMatchesHub from '../../../hooks/useMatchesHub';
import { GameDayFixtureChip, ScheduleMatchRow } from '../../../components/matches/MatchHubCards';
import ArrangeGameModal from '../../../components/matches/ArrangeGameModal';
import GameDayKickoffArena from '../../../components/matches/GameDayKickoffArena';
import {
  GamerProfileShell,
  CYAN,
  useGamerTokens,
} from '@/components/profile/gamer/GamerProfileUI';
import { SectionCard, SectionTitle, FUT } from '@/components/dashboard/CommandCenterUI';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import { MATCH_STATUS_LABEL } from '@/lib/gameDayOps';
import { resolveCrestUrl } from '@/lib/gameDayPresentation';

export default function MatchesIndex() {
  const router = useRouter();
  const tokens = useGamerTokens();
  const params = useLocalSearchParams();
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
    myClub,
    myPlayer,
  } = useMatchesHub();
  const [refreshing, setRefreshing] = useState(false);
  const [arrangeOpen, setArrangeOpen] = useState(false);
  const [presetOpponent, setPresetOpponent] = useState(null);
  const [presetKind, setPresetKind] = useState(null);
  const [featuredId, setFeaturedId] = useState(null);

  React.useEffect(() => {
    if (!params?.arrange) return;
    const kind = params.opponentKind === 'club' ? 'club' : 'player';
    if (params.opponentId) {
      setPresetKind(kind);
      setPresetOpponent({
        id: params.opponentId,
        name: params.opponentName,
        gamertag: params.opponentName,
        email: params.opponentEmail,
        tag: params.opponentTag,
      });
    }
    setArrangeOpen(true);
  }, [params?.arrange, params?.opponentId, params?.opponentKind, params?.opponentName, params?.opponentEmail, params?.opponentTag]);

  const playable = useMemo(() => {
    const applyLeague = (rows) =>
      leagueFilter === 'all' ? rows : rows.filter((e) => e.competition === leagueFilter);
    return [...applyLeague(live), ...applyLeague(upcoming)];
  }, [live, upcoming, leagueFilter]);

  const featured = playable.find((e) => e.id === featuredId) || playable[0] || null;
  const featuredMatch = featured?.matchData;

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
          <ActivityIndicator color="#F5C542" size="large" />
        </View>
      </GamerProfileShell>
    );
  }

  return (
    <GamerProfileShell>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5C542" />
          }
        >
          <View style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(245,197,66,0.22)',
            backgroundColor: 'rgba(7,16,24,0.85)',
          }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[headingStyleSm, { color: CYAN, fontSize: 10, letterSpacing: 3.2 }]}>
                  KICKOFF
                </Text>
                <Text style={[headingStyle, { color: '#fff', fontSize: 32, marginTop: 4 }]}>
                  Game Day
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 }}>
                  {filteredGameDay.length} active · {results.length} results
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setArrangeOpen(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#F5C542',
                  paddingHorizontal: 10,
                  paddingVertical: 10,
                  maxWidth: 150,
                }}
              >
                <Ionicons name="add" size={16} color="#041018" />
                <Text style={{ color: '#041018', fontSize: 10, fontWeight: '900', letterSpacing: 0.4 }}>
                  ARRANGE VS FIXTURE
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <SectionCard accent="rose">
                <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text>
                <TouchableOpacity onPress={reload} style={{ marginTop: 8 }}>
                  <Text style={{ color: CYAN, fontSize: 12, fontWeight: '800' }}>Retry</Text>
                </TouchableOpacity>
              </SectionCard>
            </View>
          ) : null}

          {leagueGroups.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 12 }}
            >
              <LeaguePill
                label={`All (${filteredGameDay.length})`}
                active={leagueFilter === 'all'}
                onPress={() => setLeagueFilter('all')}
              />
              {leagueGroups.map((g) => (
                <LeaguePill
                  key={g.key}
                  label={`${g.key} (${g.count})`}
                  active={leagueFilter === g.key}
                  onPress={() => setLeagueFilter(g.key)}
                />
              ))}
            </ScrollView>
          ) : null}

          <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.28)' }}>
            {playable.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, gap: 8 }}>
                <Ionicons name="flash-outline" size={32} color="rgba(245,197,66,0.35)" />
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '800' }}>
                  No scheduled games
                </Text>
                <TouchableOpacity onPress={() => setArrangeOpen(true)}>
                  <Text style={{ color: '#F5C542', fontSize: 12, fontWeight: '800' }}>Arrange VS fixture</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
              >
                {playable.map((event) => (
                  <GameDayFixtureChip
                    key={event.id}
                    event={event}
                    selected={featured?.id === event.id}
                    myClub={myClub}
                    onPress={() => setFeaturedId(event.id)}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {featured && featuredMatch ? (
            <TouchableOpacity activeOpacity={0.92} onPress={() => openMatch(featured)}>
              <GameDayKickoffArena
                compact
                homeName={featured.homeName}
                awayName={featured.awayName}
                homeLogo={resolveCrestUrl(featuredMatch, 'home', myClub, myPlayer)}
                awayLogo={resolveCrestUrl(featuredMatch, 'away', myClub, myPlayer)}
                homeYou={featured.isHome}
                awayYou={!featured.isHome}
                date={featured.date}
                status={featured.status}
                statusLabel={MATCH_STATUS_LABEL[featured.status] || featured.status}
                competitionLabel={featured.competition}
                homeScore={featuredMatch.home_score}
                awayScore={featuredMatch.away_score}
                wagerStc={featuredMatch.wager_stc}
                wagerLocked={Boolean(featuredMatch.wager_home_locked && featuredMatch.wager_away_locked)}
              >
                <View style={{
                  backgroundColor: '#F5C542',
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                >
                      <Text style={[headingStyle, { color: '#041018', letterSpacing: 3, fontSize: 16 }]}>
                        ENTER KICKOFF
                      </Text>
                </View>
              </GameDayKickoffArena>
            </TouchableOpacity>
          ) : null}

          {results.length > 0 ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <SectionCard accent="gold">
                <SectionTitle eyebrow="ARCHIVE">Match results</SectionTitle>
                <View style={{
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(245,197,66,0.18)',
                  backgroundColor: 'rgba(0,0,0,0.25)',
                }}
                >
                  {results.map((event) => (
                    <ScheduleMatchRow key={event.id} event={event} onPress={() => openMatch(event)} />
                  ))}
                </View>
              </SectionCard>
            </View>
          ) : null}
        </ScrollView>
        <ArrangeGameModal
          visible={arrangeOpen}
          onClose={() => {
            setArrangeOpen(false);
            setPresetOpponent(null);
            setPresetKind(null);
          }}
          myPlayer={myPlayer}
          myClub={myClub}
          presetOpponent={presetOpponent}
          presetKind={presetKind}
          onSent={() => {
            setArrangeOpen(false);
            setPresetOpponent(null);
            setPresetKind(null);
            reload();
          }}
        />
      </SafeAreaView>
    </GamerProfileShell>
  );
}

function LeaguePill({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: active ? 'rgba(245,197,66,0.55)' : 'rgba(255,255,255,0.12)',
        backgroundColor: active ? 'rgba(245,197,66,0.14)' : 'rgba(255,255,255,0.03)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: 220,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          color: active ? '#F5C542' : 'rgba(255,255,255,0.5)',
          fontSize: 11,
          fontWeight: '800',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
