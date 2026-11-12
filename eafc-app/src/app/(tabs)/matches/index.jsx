import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Text,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import useMatchesHub, { GAME_DAY_SCOPES, GAME_DAY_STATUSES } from '../../../hooks/useMatchesHub';
import { GameDayFixtureChip, ScheduleMatchRow } from '../../../components/matches/MatchHubCards';
import ArrangeGameModal from '../../../components/matches/ArrangeGameModal';
import GameDayKickoffArena from '../../../components/matches/GameDayKickoffArena';
import GameDayKickoffActions from '../../../components/matches/GameDayKickoffActions';
import GameDayScoreReport from '../../../components/matches/GameDayScoreReport';
import GameDayResultSheet from '../../../components/matches/GameDayResultSheet';
import GameDayTileBackgroundDialog from '../../../components/matches/GameDayTileBackgroundDialog';
import GameDayTileBackgroundLayers from '../../../components/matches/GameDayTileBackgroundLayers';
import GameDayTileMenuButton from '../../../components/matches/GameDayTileMenuButton';
import ScheduleCalendar from '@/components/schedule/ScheduleCalendar';
import useThemeStore from '@/store/themeStore';
import { Button, Card, Chip, Screen, SectionLabel, SegmentedControl } from '@/components/ui';
import { TILE_FILL_LIVE, sectionLabelStyle, tileChrome } from '@/components/dashboard/CommandCenterUI';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { CARD_RADIUS, hexToRgba } from '@/lib/stageTheme';
import {
  MATCH_STATUS_LABEL,
  afterMatchCompleted,
  kickoffMatch,
  mapKickoffError,
  minutesUntil,
  pickMyClubForMatch,
  resolveMatchSides,
  uniqueIdentityClubs,
} from '@/lib/gameDayOps';
import { getKickoffControls, getResultSubmissionControls } from '@/lib/gameDayResultFlow';
import { resolveCrestUrl } from '@/lib/gameDayPresentation';
import { canUseTileBackgrounds, getGameDayTileBackgroundConfig, hasCustomGameDayTileBackground } from '@/lib/gameDayTileBackgrounds';

/** Game Day sections: the three views of the hub, one visible at a time. */
const VIEW_OPTIONS = [
  { key: 'fixtures', label: 'Fixtures' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'results', label: 'Results' },
];

export default function MatchesIndex() {
  const router = useRouter();
  const tokens = useThemeStore((st) => st.tokens);
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
    scopeFilter,
    setScopeFilter,
    statusFilter,
    setStatusFilter,
    backendNotice,
    myClub,
    presidentClub,
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
  const [showResult, setShowResult] = useState(false);
  const [kickoffLoading, setKickoffLoading] = useState(false);
  const [kickoffError, setKickoffError] = useState('');
  const [view, setView] = useState('fixtures');

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
    if (statusFilter === 'completed') return applyLeague(results);
    return [...applyLeague(live), ...applyLeague(upcoming)];
  }, [live, upcoming, results, leagueFilter, statusFilter]);

  const featured = playable.find((e) => e.id === featuredId) || playable[0] || null;
  const featuredMatch = featured?.matchData;
  const hubClubs = uniqueIdentityClubs(myClub, presidentClub);
  const featuredClub = pickMyClubForMatch(featuredMatch, hubClubs);
  const featuredSides = resolveMatchSides(featuredMatch, featuredClub, myPlayer);
  const canCustomizeTiles = canUseTileBackgrounds(myPlayer);
  const matchScreensBg = canCustomizeTiles ? getGameDayTileBackgroundConfig(myPlayer, 'match_screens') : null;
  const matchDetailsBg = canCustomizeTiles ? getGameDayTileBackgroundConfig(myPlayer, 'match_details') : null;
  const hasMatchScreensBg = hasCustomGameDayTileBackground(matchScreensBg);
  const featuredLive = featuredMatch?.status === 'in_progress';
  const featuredCompleted = featuredMatch?.status === 'completed';
  const featuredDisputed = featuredMatch?.status === 'disputed';
  const featuredResultControls = getResultSubmissionControls({
    game: featuredMatch,
    isLive: featuredLive,
    showResultForm: showResult,
    amIHomeTeam: featuredSides.amIHomeTeam,
  });
  const featuredKickoffControls = getKickoffControls({
    game: featuredMatch,
    isMyMatch: featuredSides.isMyMatch,
    amIHomeTeam: featuredSides.amIHomeTeam,
    isLive: featuredLive,
    showResultForm: showResult,
    minutesUntilMatch: minutesUntil(featuredMatch?.scheduled_date),
  });
  const showFeaturedScore = Boolean(
    featuredSides.isMyMatch
    && featuredMatch
    && (featuredLive || featuredCompleted || featuredDisputed
      || featuredResultControls.homeResultSubmitted
      || featuredResultControls.awayResultSubmitted
      || featuredResultControls.resultState),
  );

  useEffect(() => {
    setShowResult(false);
    setKickoffError('');
  }, [featured?.id]);

  const openMatch = (event) => {
    router.push({
      pathname: '/(tabs)/matches/matchdetailscreen',
      params: { matchId: event.id },
    });
  };

  const onFeaturedKickoff = async () => {
    if (!featuredMatch?.id) return;
    setKickoffLoading(true);
    setKickoffError('');
    try {
      await kickoffMatch(featuredMatch.id);
      await reload();
    } catch (err) {
      setKickoffError(mapKickoffError(err));
    } finally {
      setKickoffLoading(false);
    }
  };

  const onFeaturedResultSubmitted = async (status, homeScore, awayScore) => {
    if (status === 'completed' && featuredMatch) {
      afterMatchCompleted({ ...featuredMatch, home_score: homeScore, away_score: awayScore });
    }
    setShowResult(false);
    await reload();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.cyan} size="large" />
        </View>
      </Screen>
    );
  }

  const panelFill = hasMatchScreensBg
    ? (tokens.live ? TILE_FILL_LIVE : hexToRgba(tokens.bgDeep, 0.55))
    : undefined;
  const show = (key) => ({ display: view === key ? 'flex' : 'none' });

  return (
    <Screen
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tokens.cyan}
          colors={[tokens.cyan]}
        />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ gap: 14 }}>
        <View
          style={bannerUrl ? {
            minHeight: 112,
            overflow: 'hidden',
            justifyContent: 'center',
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor: tokens.border,
            padding: 16,
          } : null}
        >
          {bannerUrl ? (
            <>
              <Image source={{ uri: bannerUrl }} style={absFill} resizeMode="cover" />
              <LinearGradient
                colors={[hexToRgba(tokens.bgDeep, 0.45), hexToRgba(tokens.bgDeep, 0.8)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={absFill}
              />
            </>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{
                flex: 1,
                minWidth: 0,
                color: tokens.text,
                fontFamily: FONT_EA_SPORTS,
                fontSize: 34,
                letterSpacing: 34 * 0.03,
                textTransform: 'uppercase',
              }}
            >
              Game Day
            </Text>
            <Pressable
              onPress={() => setArrangeOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Arrange Game"
              style={({ pressed }) => ({
                height: 44,
                borderRadius: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: pressed ? tokens.cyanHi : tokens.cyan,
              })}
            >
              <Ionicons name="add" size={18} color={tokens.onCyan} />
              <Text numberOfLines={1} style={{ color: tokens.onCyan, fontSize: 14, fontWeight: '700' }}>
                Arrange Game
              </Text>
            </Pressable>
          </View>
        </View>

        <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} />

        {error ? (
          <Card style={{ borderColor: tokens.danger, gap: 8 }}>
            <Text style={{ color: tokens.danger, fontSize: 13 }}>{error}</Text>
            <TouchableOpacity
              onPress={reload}
              accessibilityRole="button"
              style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
            >
              <Text style={{ color: tokens.cyan, fontSize: 14, fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {backendNotice ? (
          <Card>
            <Text style={{ color: tokens.muted, fontSize: 13 }}>{backendNotice}</Text>
          </Card>
        ) : null}

        <View style={[{ gap: 14 }, show('fixtures')]}>
          <View style={tileChrome(tokens, panelFill ? { backgroundColor: panelFill, paddingVertical: 16 } : { paddingVertical: 16 })}>
            <GameDayTileBackgroundLayers config={matchScreensBg} variant="panel" />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 10 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={sectionLabelStyle(tokens)}>
                  MATCH SCREENS
                </Text>
                <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>
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

            <ChipRow>
              {GAME_DAY_SCOPES.map((scope) => (
                <FilterChip
                  key={scope.id}
                  label={scope.label}
                  active={scopeFilter === scope.id}
                  onPress={() => setScopeFilter(scope.id)}
                />
              ))}
            </ChipRow>
            <ChipRow>
              {GAME_DAY_STATUSES.map((status) => (
                <FilterChip
                  key={status.id}
                  label={status.label}
                  active={statusFilter === status.id}
                  onPress={() => setStatusFilter(status.id)}
                />
              ))}
            </ChipRow>
            {leagueGroups.length > 1 ? (
              <ChipRow>
                <FilterChip
                  label={`All (${filteredGameDay.length})`}
                  active={leagueFilter === 'all'}
                  onPress={() => setLeagueFilter('all')}
                />
                {leagueGroups.map((g) => (
                  <FilterChip
                    key={g.key}
                    label={`${g.key} (${g.count})`}
                    active={leagueFilter === g.key}
                    onPress={() => setLeagueFilter(g.key)}
                  />
                ))}
              </ChipRow>
            ) : null}

            {playable.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24, gap: 8 }}>
                <Ionicons name="flash-outline" size={32} color={tokens.muted} />
                <Text style={{ color: tokens.textSoft, fontSize: 15, fontWeight: '600' }}>
                  No scheduled games
                </Text>
                <TouchableOpacity
                  onPress={() => setArrangeOpen(true)}
                  accessibilityRole="button"
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={{ color: tokens.cyan, fontSize: 14, fontWeight: '700' }}>Arrange Game</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ChipRow>
                {playable.map((event) => (
                  <GameDayFixtureChip
                    key={event.id}
                    event={event}
                    selected={featured?.id === event.id}
                    myClub={pickMyClubForMatch(event.matchData, hubClubs)}
                    onPress={() => setFeaturedId(event.id)}
                  />
                ))}
              </ChipRow>
            )}
          </View>

          {featured && featuredMatch ? (
            <View style={{ gap: 12 }}>
              <GameDayKickoffArena
                homeName={featured.homeName}
                awayName={featured.awayName}
                homeLogo={resolveCrestUrl(featuredMatch, 'home', featuredClub, myPlayer)}
                awayLogo={resolveCrestUrl(featuredMatch, 'away', featuredClub, myPlayer)}
                homeYou={featuredSides.isMyMatch && featuredSides.amIHomeTeam}
                awayYou={featuredSides.isMyMatch && !featuredSides.amIHomeTeam}
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
              >
                <GameDayKickoffActions
                  controls={featuredKickoffControls}
                  loading={kickoffLoading}
                  onKickoff={onFeaturedKickoff}
                />
              </GameDayKickoffArena>
              {kickoffError ? (
                <Card style={{ borderColor: tokens.danger }}>
                  <Text style={{ color: tokens.danger, fontSize: 13 }}>{kickoffError}</Text>
                </Card>
              ) : null}
              {showFeaturedScore ? (
                <GameDayScoreReport
                  game={featuredMatch}
                  homeName={featuredSides.homeName}
                  awayName={featuredSides.awayName}
                  isMyMatch={featuredSides.isMyMatch}
                  amIHomeTeam={featuredSides.amIHomeTeam}
                  isLive={featuredLive}
                  isCompleted={featuredCompleted}
                  isDisputed={featuredDisputed}
                  showResultForm={showResult}
                  onSubmitPress={() => setShowResult(true)}
                />
              ) : null}
            </View>
          ) : (
            <Card style={{ minHeight: 200, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Ionicons name="flash-outline" size={36} color={tokens.muted} />
              <Text style={[sectionLabelStyle(tokens), { textAlign: 'center' }]}>
                SELECT A GAME TO VIEW DETAILS
              </Text>
            </Card>
          )}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                icon="radio-outline"
                title="Live Stream"
                disabled={!featured}
                onPress={() => featured && openMatch(featured)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                icon="chatbubble-ellipses-outline"
                title="Chat"
                disabled={!featured}
                onPress={() => featured && router.push({
                  pathname: '/(tabs)/matches/watchmatchscreen',
                  params: { matchId: featured.id },
                })}
              />
            </View>
          </View>
        </View>

        <View style={[{ gap: 14 }, show('calendar')]}>
          <SectionLabel>Schedule</SectionLabel>
          <ScheduleCalendar
            useApi
            onOpenMatch={(event) => openMatch(event)}
          />
        </View>

        <View style={[{ gap: 10 }, show('results')]}>
          <SectionLabel>Match results</SectionLabel>
          {results.length > 0 ? (
            results.map((event) => (
              <ScheduleMatchRow key={event.id} event={event} onPress={() => openMatch(event)} />
            ))
          ) : (
            <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
              <Ionicons name="trophy-outline" size={32} color={tokens.muted} />
              <Text style={{ color: tokens.textSoft, fontSize: 15, fontWeight: '600' }}>No results yet</Text>
            </Card>
          )}
        </View>
      </View>

      <ArrangeGameModal
        visible={arrangeOpen}
        onClose={() => {
          setArrangeOpen(false);
          setPresetOpponent(null);
          setPresetKind(null);
        }}
        myPlayer={myPlayer}
        myClub={presidentClub || myClub}
        presetOpponent={presetOpponent}
        presetKind={presetKind}
        onSent={() => {
          setArrangeOpen(false);
          setPresetOpponent(null);
          setPresetKind(null);
          reload();
        }}
      />
      <GameDayResultSheet
        visible={showResult && Boolean(featuredMatch)}
        onClose={() => setShowResult(false)}
        game={featuredMatch}
        myClub={featuredClub}
        myPlayer={myPlayer}
        isHomeTeam={featuredSides.amIHomeTeam}
        onSubmitted={onFeaturedResultSubmitted}
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
    </Screen>
  );
}

/** Horizontal chip strip inside the Match Screens panel. */
function ChipRow({ children }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}
    >
      {children}
    </ScrollView>
  );
}

/** Filter chip: Stage chip capped at 220 so long league names truncate. */
function FilterChip({ label, active, onPress }) {
  return (
    <View style={{ maxWidth: 220 }}>
      <Chip label={label} active={active} onPress={onPress} />
    </View>
  );
}

const absFill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
