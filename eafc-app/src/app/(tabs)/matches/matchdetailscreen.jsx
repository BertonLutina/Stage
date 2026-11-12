import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { resolveMyPlayerAndClub, stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { hexToRgba } from '@/lib/stageTheme';
import { Button, Card, IconButton, Screen, SectionLabel } from '@/components/ui';
import { MIN_TOUCH } from '@/components/ui/metrics';
import {
  MATCH_STATUS_LABEL,
  afterMatchCompleted,
  kickoffMatch,
  mapKickoffError,
  minutesUntil,
  pickMyClubForMatch,
  reloadMatch,
  resolveMatchSides,
  settleClubMatches,
  settleMatchDeadlines,
  uniqueIdentityClubs,
} from '@/lib/gameDayOps';
import { getKickoffControls, getResultSubmissionControls } from '@/lib/gameDayResultFlow';
import { isOfficialMatch } from '@/lib/matchFixtureLifecycle';
import GameDayWagerCard from '@/components/matches/GameDayWagerCard';
import GameDayFixtureActions from '@/components/matches/GameDayFixtureActions';
import GameDayResultSheet from '@/components/matches/GameDayResultSheet';
import GameDayScoreReport from '@/components/matches/GameDayScoreReport';
import GameDayStreamCard from '@/components/matches/GameDayStreamCard';
import GameDayKickoffArena from '@/components/matches/GameDayKickoffArena';
import GameDayKickoffActions from '@/components/matches/GameDayKickoffActions';
import GameDayTileBackgroundDialog from '@/components/matches/GameDayTileBackgroundDialog';
import GameDayInsights from '@/components/matches/GameDayInsights';
import { resolveCrestUrl } from '@/lib/gameDayPresentation';
import { canUseTileBackgrounds, getGameDayTileBackgroundConfig } from '@/lib/gameDayTileBackgrounds';
import { penaltyOutcome } from '@/lib/penaltyOutcome';
import { useGameDayMatchRealtime } from '@/hooks/useGameDayMatchRealtime';
import useT from '@/hooks/useT';

export default function MatchDetailScreen() {
  const { matchId } = useLocalSearchParams();
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((st) => st.tokens);
  const [game, setGame] = useState(null);
  const [myClub, setMyClub] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kickoffLoading, setKickoffLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [crests, setCrests] = useState({ home: null, away: null });
  const [tileDialog, setTileDialog] = useState(null);

  const load = useCallback(async () => {
    if (!matchId) return;
    setError('');
    try {
      const { player, club, presidentClub } = await resolveMyPlayerAndClub();
      const clubs = uniqueIdentityClubs(
        player?.club_id ? { id: player.club_id } : null,
        club,
        presidentClub,
      );
      await Promise.all(clubs.map((row) => settleClubMatches(row.id).catch(() => null)));
      if (!clubs.length && matchId) {
        await settleMatchDeadlines(matchId).catch(() => null);
      }
      const match = await reloadMatch(matchId);
      setMyPlayer(player || null);
      setMyClub(pickMyClubForMatch(match, clubs));
      setGame(match);
    } catch (err) {
      setError(err?.message || 'Failed to load match');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matchId]);

  useEffect(() => { load(); }, [load]);

  useGameDayMatchRealtime({
    matchId,
    reloadMatch,
    onMatch: async (fresh) => {
      if (fresh?.deleted) return;
      setGame(fresh);
    },
  });

  useEffect(() => {
    if (!game?.id) return undefined;
    let cancelled = false;
    const fallbackHome = resolveCrestUrl(game, 'home', myClub, myPlayer);
    const fallbackAway = resolveCrestUrl(game, 'away', myClub, myPlayer);
    setCrests({ home: fallbackHome, away: fallbackAway });

    async function loadCrests() {
      const isClub = Boolean(game.home_club_id || game.away_club_id) && game.mode !== 'solo';
      if (isClub) {
        const [homeClub, awayClub] = await Promise.all([
          game.home_club_id && stageClient.entities.Club?.get
            ? stageClient.entities.Club.get(game.home_club_id).catch(() => null)
            : Promise.resolve(null),
          game.away_club_id && stageClient.entities.Club?.get
            ? stageClient.entities.Club.get(game.away_club_id).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setCrests({
          home: homeClub?.logo_url || fallbackHome,
          away: awayClub?.logo_url || fallbackAway,
        });
        return;
      }
      const [homePlayer, awayPlayer] = await Promise.all([
        game.home_player_id && stageClient.entities.Player?.get
          ? stageClient.entities.Player.get(game.home_player_id).catch(() => null)
          : Promise.resolve(null),
        game.away_player_id && stageClient.entities.Player?.get
          ? stageClient.entities.Player.get(game.away_player_id).catch(() => null)
          : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setCrests({
        home: homePlayer?.avatar_url || fallbackHome,
        away: awayPlayer?.avatar_url || fallbackAway,
      });
    }

    loadCrests();
    return () => { cancelled = true; };
  }, [game?.id, game?.home_club_id, game?.away_club_id, game?.home_player_id, game?.away_player_id, game?.mode, myClub, myPlayer]);

  useEffect(() => {
    if (!game?.id) return undefined;
    if (!['in_progress', 'disputed', 'awaiting_confirmation'].includes(game.status)) return undefined;
    const timer = setInterval(async () => {
      const fresh = await reloadMatch(game.id);
      if (fresh) setGame(fresh);
    }, 8000);
    return () => clearInterval(timer);
  }, [game?.id, game?.status]);

  const sides = resolveMatchSides(game, myClub, myPlayer);
  const canCustomizeTiles = canUseTileBackgrounds(myPlayer);
  const isLive = game?.status === 'in_progress';
  const isCompleted = game?.status === 'completed';
  const isDisputed = game?.status === 'disputed';
  const resultControls = getResultSubmissionControls({
    game,
    isLive,
    showResultForm: showResult,
    amIHomeTeam: sides.amIHomeTeam,
  });
  const mins = minutesUntil(game?.scheduled_date);
  const kickoffControls = getKickoffControls({
    game,
    isMyMatch: sides.isMyMatch,
    amIHomeTeam: sides.amIHomeTeam,
    isLive,
    showResultForm: showResult,
    minutesUntilMatch: mins,
  });

  const onKickoff = async () => {
    setKickoffLoading(true);
    setError('');
    try {
      const res = await kickoffMatch(game.id);
      if (res?.data?.success || res?.success || res?.data?.status === 'in_progress') {
        setGame({ ...game, status: 'in_progress' });
      } else {
        const fresh = await reloadMatch(game.id);
        if (fresh) setGame(fresh);
      }
    } catch (err) {
      setError(mapKickoffError(err));
    } finally {
      setKickoffLoading(false);
    }
  };

  const onResultSubmitted = async (status, homeScore, awayScore) => {
    const fresh = await reloadMatch(game.id);
    const updated = fresh || {
      ...game,
      status: status === 'disputed' ? 'disputed' : status === 'completed' ? 'completed' : game.status,
      ...(status === 'completed' ? { home_score: homeScore, away_score: awayScore } : {}),
    };
    setGame(updated);
    if (updated.status === 'completed') afterMatchCompleted(updated);
  };

  if (loading) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.cyan} size="large" />
        </View>
      </Screen>
    );
  }

  if (!game) {
    return (
      <Screen scroll={false}>
        <View style={{ alignItems: 'flex-start' }}>
          <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel="Back" />
        </View>
        <Text style={{ color: tokens.muted, marginTop: 24, textAlign: 'center', fontSize: 14 }}>
          Match not found
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={tokens.cyan}
          colors={[tokens.cyan]}
        />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel="Back" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <SectionLabel>GAME DAY</SectionLabel>
          </View>
          <View style={{ width: MIN_TOUCH }} />
        </View>

        <GameDayKickoffArena
          homeName={sides.homeName}
          awayName={sides.awayName}
          homeLogo={crests.home}
          awayLogo={crests.away}
          homeYou={sides.isMyMatch && sides.amIHomeTeam}
          awayYou={sides.isMyMatch && !sides.amIHomeTeam}
          date={game.scheduled_date}
          status={game.status}
          statusLabel={MATCH_STATUS_LABEL[game.status] || game.status}
          competitionLabel={game.competition_context || (game.tournament_id === 'ranked' ? 'Ranked Match' : 'MATCH DETAILS')}
          homeScore={game.home_score}
          awayScore={game.away_score}
          wagerStc={game.wager_stc}
          wagerLocked={Boolean(game.wager_home_locked && game.wager_away_locked)}
          backgroundConfig={canCustomizeTiles ? getGameDayTileBackgroundConfig(myPlayer, 'match_details') : undefined}
          onChangeBackground={myPlayer ? () => setTileDialog({ tileKey: 'match_details', title: 'Match Details' }) : undefined}
        >
          <GameDayKickoffActions
            controls={kickoffControls}
            loading={kickoffLoading}
            onKickoff={onKickoff}
          />
        </GameDayKickoffArena>

        {error ? (
          <Card style={{ borderColor: hexToRgba(tokens.danger, 0.5) }}>
            <Text style={{ color: tokens.danger, fontSize: 13 }}>{error}</Text>
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Button
              title="Watch"
              icon="play"
              onPress={() => router.push({ pathname: '/(tabs)/matches/watchmatchscreen', params: { matchId: game.id } })}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Button
              variant="secondary"
              title="Upload video"
              icon="cloud-upload-outline"
              onPress={() => router.push({ pathname: '/(tabs)/matches/uploadvideoscreen', params: { matchId: game.id } })}
            />
          </View>
        </View>

        {sides.isMyMatch && isOfficialMatch(game) ? (
          <View style={{ gap: 10 }}>
            <Button
              variant="secondary"
              title={t('stage.matchPrep.title')}
              icon="people-outline"
              onPress={() => router.push({ pathname: '/apps/match-prep', params: { matchId: game.id } })}
            />
            <Button
              variant="secondary"
              title={t('stage.reschedule.title')}
              icon="calendar-outline"
              onPress={() => router.push({ pathname: '/apps/reschedule', params: { matchId: game.id } })}
            />
          </View>
        ) : null}

        <GameDayWagerCard
          game={game}
          isMyMatch={sides.isMyMatch}
          amIHomeTeam={sides.amIHomeTeam}
          onGameUpdate={setGame}
        />

        <GameDayFixtureActions
          game={game}
          myPlayer={myPlayer}
          myClub={myClub}
          isMyMatch={sides.isMyMatch}
          onGameUpdate={setGame}
        />

        <GameDayStreamCard
          game={game}
          isMyMatch={sides.isMyMatch}
          amIHomeTeam={sides.amIHomeTeam}
          isCompleted={isCompleted}
          onGameUpdate={setGame}
        />

        {(isLive || isCompleted || isDisputed || resultControls.homeResultSubmitted || resultControls.awayResultSubmitted || resultControls.resultState) ? (
          <GameDayScoreReport
            game={game}
            homeName={sides.homeName}
            awayName={sides.awayName}
            isMyMatch={sides.isMyMatch}
            amIHomeTeam={sides.amIHomeTeam}
            isLive={isLive}
            isCompleted={isCompleted}
            isDisputed={isDisputed}
            showResultForm={showResult}
            onSubmitPress={() => {
              if (resultControls.showConfirmResult) {
                router.push({ pathname: '/apps/confirm-result', params: { matchId: game.id } });
                return;
              }
              if (resultControls.showHomeSubmit || resultControls.showAwaySubmit) {
                router.push({ pathname: '/apps/report-result', params: { matchId: game.id } });
                return;
              }
              setShowResult(true);
            }}
          />
        ) : null}

        {penaltyOutcome(game) ? (
          <Card>
            <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '600' }}>{penaltyOutcome(game)}</Text>
          </Card>
        ) : null}

        <GameDayInsights game={game} />
      </View>

      <GameDayResultSheet
        visible={showResult}
        onClose={() => setShowResult(false)}
        game={game}
        myClub={myClub}
        myPlayer={myPlayer}
        isHomeTeam={sides.amIHomeTeam}
        onSubmitted={onResultSubmitted}
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
