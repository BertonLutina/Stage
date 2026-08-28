import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Text,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import useMatchesHub from '../../../hooks/useMatchesHub';
import { GameDayFixtureChip, ScheduleMatchRow } from '../../../components/matches/MatchHubCards';
import ArrangeGameModal from '../../../components/matches/ArrangeGameModal';
import GameDayKickoffArena from '../../../components/matches/GameDayKickoffArena';
import GameDayDressingRoomPanel from '../../../components/matches/GameDayDressingRoomPanel';
import GameDayTileBackgroundDialog from '../../../components/matches/GameDayTileBackgroundDialog';
import GameDayTileBackgroundLayers from '../../../components/matches/GameDayTileBackgroundLayers';
import GameDayTileMenuButton from '../../../components/matches/GameDayTileMenuButton';
import { useGameDayMatchRealtime } from '@/hooks/useGameDayMatchRealtime';
import {
  GamerProfileShell,
  CYAN,
  useGamerTokens,
} from '@/components/profile/gamer/GamerProfileUI';
import { SectionCard, SectionTitle, FUT } from '@/components/dashboard/CommandCenterUI';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import { MATCH_STATUS_LABEL, loadDressingCounts, reloadMatch, resolveMatchSides, sameId } from '@/lib/gameDayOps';
import { resolveCrestUrl } from '@/lib/gameDayPresentation';
import { canUseTileBackgrounds, getGameDayTileBackgroundConfig, hasCustomGameDayTileBackground } from '@/lib/gameDayTileBackgrounds';

const SILVER = '#EEF3FB';

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
    setMyPlayer,
  } = useMatchesHub();
  const [refreshing, setRefreshing] = useState(false);
  const [arrangeOpen, setArrangeOpen] = useState(false);
  const [presetOpponent, setPresetOpponent] = useState(null);
  const [presetKind, setPresetKind] = useState(null);
  const [featuredId, setFeaturedId] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [tileDialog, setTileDialog] = useState(null);
  const [dressingCounts, setDressingCounts] = useState({ home: 0, away: 0 });

  useEffect(() => {
    let cancelled = false;
    stageClient.entities.GameDayConfig
      ?.filter({ key: 'main' }, '-updated_date', 1)
      .then((rows) => {
        if (!cancelled) setBannerUrl(rows?.[0]?.banner_url || null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
  const featuredSides = resolveMatchSides(featuredMatch, myClub, myPlayer);
  const showDressingRoom = Boolean(
    featuredMatch
    && featuredSides.isClubMatch
    && featuredSides.isMyMatch
    && myClub
    && featured.status !== 'disputed',
  );
  const canCustomizeTiles = canUseTileBackgrounds(myPlayer);
  const matchScreensBg = canCustomizeTiles ? getGameDayTileBackgroundConfig(myPlayer, 'match_screens') : null;
  const matchDetailsBg = canCustomizeTiles ? getGameDayTileBackgroundConfig(myPlayer, 'match_details') : null;
  const dressingRoomBg = canCustomizeTiles ? getGameDayTileBackgroundConfig(myPlayer, 'dressing_room') : null;
  const hasMatchScreensBg = hasCustomGameDayTileBackground(matchScreensBg);

  useEffect(() => {
    let cancelled = false;
    if (!showDressingRoom || !featuredMatch?.id) {
      setDressingCounts({ home: 0, away: 0 });
      return undefined;
    }
    loadDressingCounts(featuredMatch).then((counts) => {
      if (!cancelled) setDressingCounts(counts);
    });
    return () => { cancelled = true; };
  }, [showDressingRoom, featuredMatch?.id]);

  useGameDayMatchRealtime({
    matchId: showDressingRoom ? featuredMatch?.id : null,
    reloadMatch,
    onMatch: async (fresh) => {
      if (fresh?.deleted || !fresh?.id) return;
      setDressingCounts(await loadDressingCounts(fresh));
    },
    onDressing: async () => {
      if (!featuredMatch) return;
      setDressingCounts(await loadDressingCounts(featuredMatch));
    },
  });

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
          <ActivityIndicator color={SILVER} size="large" />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SILVER} />
          }
        >
          <View style={{ minHeight: 168, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: 'rgba(216,222,232,0.3)' }}>
            {bannerUrl ? (
              <Image source={{ uri: bannerUrl }} style={absFill} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={['#171C25', '#10141D', '#252B36']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={absFill}
              />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={absFill}
            />
            <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16, justifyContent: 'flex-end', minHeight: 168 }}>
              <Text style={[headingStyleSm, { color: CYAN, fontSize: 10, letterSpacing: 3.2 }]}>
                KICKOFF
              </Text>
              <Text style={[headingStyle, { color: '#fff', fontSize: 28, marginTop: 4 }]}>
                Game Day
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <ActionTab
                  icon="add"
                  label="Arrange Game"
                  tone="silver"
                  onPress={() => setArrangeOpen(true)}
                />
                <ActionTab
                  icon="radio"
                  label="Live Stream"
                  disabled={!featured}
                  onPress={() => featured && openMatch(featured)}
                />
                <ActionTab
                  icon="chatbubble-ellipses-outline"
                  label="Chat"
                  tone="silver"
                  disabled={!featured}
                  onPress={() => featured && router.push({
                    pathname: '/(tabs)/matches/watchmatchscreen',
                    params: { matchId: featured.id },
                  })}
                />
              </View>
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

          <View style={{
            marginHorizontal: 12,
            marginTop: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(238,243,251,0.22)',
            backgroundColor: hasMatchScreensBg ? 'rgba(0,0,0,0.4)' : 'rgba(17,24,39,0.88)',
            paddingVertical: 12,
          }}
          >
            <GameDayTileBackgroundLayers config={matchScreensBg} variant="panel" />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 12, marginBottom: 10 }}>
              <View>
                <Text style={[headingStyleSm, { color: SILVER, fontSize: 11, letterSpacing: 2 }]}>
                  MATCH SCREENS
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 4, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                  {playable.length}/{filteredGameDay.length} visible
                </Text>
              </View>
              {myPlayer ? (
                <GameDayTileMenuButton
                  onPress={() => setTileDialog({ tileKey: 'match_screens', title: 'Match Screens' })}
                  accessibilityLabel="Change Match Screens background"
                />
              ) : null}
            </View>

            {leagueGroups.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingBottom: 10 }}
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

            {playable.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, gap: 8 }}>
                <Ionicons name="flash-outline" size={32} color="rgba(238,243,251,0.28)" />
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '800' }}>
                  No scheduled games
                </Text>
                <TouchableOpacity onPress={() => setArrangeOpen(true)}>
                  <Text style={{ color: SILVER, fontSize: 12, fontWeight: '800' }}>Arrange Game</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
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
            <View style={{ marginHorizontal: 12, marginTop: 16, gap: 12 }}>
              <GameDayKickoffArena
                homeName={featured.homeName}
                awayName={featured.awayName}
                homeLogo={resolveCrestUrl(featuredMatch, 'home', myClub, myPlayer)}
                awayLogo={resolveCrestUrl(featuredMatch, 'away', myClub, myPlayer)}
                homeYou={featured.isHome}
                awayYou={!featured.isHome}
                date={featured.date}
                status={featured.status}
                statusLabel={MATCH_STATUS_LABEL[featured.status] || featured.status}
                competitionLabel={featured.competition || 'MATCH DETAILS'}
                homeScore={featuredMatch.home_score}
                awayScore={featuredMatch.away_score}
                wagerStc={featuredMatch.wager_stc}
                wagerLocked={Boolean(featuredMatch.wager_home_locked && featuredMatch.wager_away_locked)}
                backgroundConfig={matchDetailsBg}
                onChangeBackground={myPlayer ? () => setTileDialog({ tileKey: 'match_details', title: 'Match Details' }) : undefined}
                onPress={() => openMatch(featured)}
              />
              {showDressingRoom ? (
                <GameDayDressingRoomPanel
                  game={featuredMatch}
                  myClub={myClub}
                  myPlayer={myPlayer}
                  dressingCounts={dressingCounts}
                  backgroundConfig={dressingRoomBg}
                  onChangeBackground={myPlayer ? () => setTileDialog({ tileKey: 'dressing_room', title: 'Dressing Room' }) : undefined}
                  onSeatChange={({ clubId, seatedPlayers }) => {
                    const count = Array.isArray(seatedPlayers) ? seatedPlayers.length : 0;
                    setDressingCounts((prev) => {
                      if (sameId(clubId, featuredMatch.home_club_id)) return { ...prev, home: count };
                      if (sameId(clubId, featuredMatch.away_club_id)) return { ...prev, away: count };
                      return prev;
                    });
                  }}
                />
              ) : null}
            </View>
          ) : (
            <View style={{
              marginHorizontal: 12,
              marginTop: 16,
              minHeight: 200,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              backgroundColor: '#111827',
              padding: 24,
            }}
            >
              <Ionicons name="flash-outline" size={36} color="rgba(238,243,251,0.28)" />
              <Text style={[headingStyleSm, { color: 'rgba(255,255,255,0.5)', marginTop: 12, letterSpacing: 2 }]}>
                SELECT A GAME TO VIEW DETAILS
              </Text>
            </View>
          )}

          {results.length > 0 ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <SectionCard>
                <SectionTitle eyebrow="ARCHIVE">Match results</SectionTitle>
                <View style={{
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(238,243,251,0.14)',
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
        <GameDayTileBackgroundDialog
          visible={Boolean(tileDialog)}
          onClose={() => setTileDialog(null)}
          player={myPlayer}
          tileKey={tileDialog?.tileKey}
          tileTitle={tileDialog?.title}
          canCustomize={canCustomizeTiles}
          onPlayerChanged={(updated) => setMyPlayer((prev) => ({ ...(prev || {}), ...updated }))}
        />
      </SafeAreaView>
    </GamerProfileShell>
  );
}

function ActionTab({ icon, label, onPress, disabled, tone = 'cyan' }) {
  const silver = tone === 'silver';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={{
        minWidth: 112,
        height: 36,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: silver ? 'rgba(238,243,251,0.4)' : 'rgba(142,238,255,0.35)',
        backgroundColor: 'rgba(0,0,0,0.35)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Ionicons name={icon} size={14} color={silver ? SILVER : CYAN} />
      <Text style={{
        color: '#fff',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
      }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function LeaguePill({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: active ? 'rgba(248,251,255,0.55)' : 'rgba(255,255,255,0.12)',
        backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.35)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: 220,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          color: active ? SILVER : 'rgba(255,255,255,0.5)',
          fontSize: 11,
          fontWeight: '800',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const absFill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
