import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { resolveMyPlayerAndClub, stageClient } from '@/api/stageClient';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
} from '@/components/profile/gamer/GamerProfileUI';
import { FUT, SectionCard } from '@/components/dashboard/CommandCenterUI';
import { headingStyle } from '@/lib/fonts';
import {
  MATCH_STATUS_LABEL,
  afterMatchCompleted,
  bothDressingRoomsReady,
  kickoffMatch,
  loadDressingCounts,
  mapKickoffError,
  minutesUntil,
  reloadMatch,
  resolveMatchSides,
} from '@/lib/gameDayOps';
import { getKickoffControls, getResultSubmissionControls } from '@/lib/gameDayResultFlow';
import GameDayWagerCard from '@/components/matches/GameDayWagerCard';
import GameDayFixtureActions from '@/components/matches/GameDayFixtureActions';
import GameDayDressingRoom from '@/components/matches/GameDayDressingRoom';
import GameDayResultSheet from '@/components/matches/GameDayResultSheet';
import GameDayScoreReport from '@/components/matches/GameDayScoreReport';
import GameDayStreamCard from '@/components/matches/GameDayStreamCard';
import GameDayKickoffArena from '@/components/matches/GameDayKickoffArena';
import { resolveCrestUrl } from '@/lib/gameDayPresentation';

export default function MatchDetailScreen() {
  const { matchId } = useLocalSearchParams();
  const router = useRouter();
  const [game, setGame] = useState(null);
  const [myClub, setMyClub] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [dressingCounts, setDressingCounts] = useState({ home: 0, away: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kickoffLoading, setKickoffLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [crests, setCrests] = useState({ home: null, away: null });

  const load = useCallback(async () => {
    if (!matchId) return;
    setError('');
    try {
      const [{ player, club }, match] = await Promise.all([
        resolveMyPlayerAndClub(),
        reloadMatch(matchId),
      ]);
      setMyPlayer(player || null);
      setMyClub(club || null);
      setGame(match);
      if (match) setDressingCounts(await loadDressingCounts(match));
    } catch (err) {
      setError(err?.message || 'Failed to load match');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matchId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!matchId) return undefined;
    const unsubMatch = stageClient.entities.Match.subscribe(async (event) => {
      const id = event?.id || event?.data?.id;
      if (String(id) !== String(matchId)) return;
      if (event?.type === 'delete') return;
      const fresh = await reloadMatch(matchId).catch(() => event.data || null);
      if (!fresh) return;
      setGame(fresh);
      setDressingCounts(await loadDressingCounts(fresh));
    }, { id: matchId });
    const unsubRoom = stageClient.entities.DressingRoom.subscribe(async (event) => {
      if (String(event?.data?.match_id) !== String(matchId)) return;
      const fresh = await reloadMatch(matchId).catch(() => null);
      if (!fresh) return;
      setGame(fresh);
      setDressingCounts(await loadDressingCounts(fresh));
    }, { match_id: matchId });
    return () => {
      if (typeof unsubMatch === 'function') unsubMatch();
      if (typeof unsubRoom === 'function') unsubRoom();
    };
  }, [matchId]);

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
  const roomsReady = bothDressingRoomsReady(sides.isClubMatch, dressingCounts);
  const kickoffControls = getKickoffControls({
    game,
    isMyMatch: sides.isMyMatch,
    amIHomeTeam: sides.amIHomeTeam,
    isLive,
    showResultForm: showResult,
    minutesUntilMatch: mins,
    isClubMatch: sides.isClubMatch,
    bothClubsReady: roomsReady,
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
      setError(mapKickoffError(err, sides.homeName, sides.awayName));
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
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={CYAN} size="large" />
        </View>
      </GamerProfileShell>
    );
  }

  if (!game) {
    return (
      <GamerProfileShell>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
          <View style={{ padding: 16 }}>
            <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
            <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 24, textAlign: 'center' }}>
              Match not found
            </Text>
          </View>
        </SafeAreaView>
      </GamerProfileShell>
    );
  }

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginLeft: 12, flex: 1 }}>GAME DAY</Text>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={CYAN} />}
        >
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
            competitionLabel={game.competition_context || (game.tournament_id === 'ranked' ? 'Ranked Match' : 'Fixture')}
            homeScore={game.home_score}
            awayScore={game.away_score}
            wagerStc={game.wager_stc}
            wagerLocked={Boolean(game.wager_home_locked && game.wager_away_locked)}
          >
            {kickoffControls.showHomeKickoff ? (
              <View style={{ gap: 8 }}>
                {kickoffControls.tooEarly ? (
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, textAlign: 'center' }}>
                    Kickoff available 15 minutes before match time.
                  </Text>
                ) : null}
                {kickoffControls.dressingBlocked && !kickoffControls.tooEarly ? (
                  <Text style={{ color: '#F5C542', fontSize: 12, textAlign: 'center' }}>
                    Waiting for both dressing rooms
                  </Text>
                ) : null}
                <TouchableOpacity
                  onPress={onKickoff}
                  disabled={kickoffLoading || !kickoffControls.canPressKickoff}
                  style={{
                    backgroundColor: kickoffControls.canPressKickoff ? '#F5C542' : '#2A2410',
                    borderWidth: 1,
                    borderColor: kickoffControls.canPressKickoff ? '#F5C542' : '#8A7A40',
                    paddingVertical: 16,
                    alignItems: 'center',
                    opacity: kickoffLoading ? 0.6 : 1,
                    shadowColor: '#F5C542',
                    shadowOpacity: kickoffControls.canPressKickoff ? 0.45 : 0,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  {kickoffLoading
                    ? <ActivityIndicator color="#041018" />
                    : (
                      <Text style={[headingStyle, {
                        color: kickoffControls.canPressKickoff ? '#041018' : '#8A7A40',
                        letterSpacing: 3,
                        fontSize: 18,
                      }]}
                      >
                        KICK OFF
                      </Text>
                    )}
                </TouchableOpacity>
              </View>
            ) : null}
            {kickoffControls.showAwayWaiting ? (
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, textAlign: 'center' }}>
                Waiting for home team to kick off.
              </Text>
            ) : null}
          </GameDayKickoffArena>

          <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 12 }}>
          {error ? (
            <SectionCard accent="rose">
              <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text>
            </SectionCard>
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

          {sides.isClubMatch && sides.isMyMatch ? (
            <GameDayDressingRoom game={game} myClub={myClub} myPlayer={myPlayer} />
          ) : null}

          {(isLive || isCompleted || isDisputed || resultControls.homeResultSubmitted || resultControls.awayResultSubmitted) ? (
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
              onSubmitPress={() => setShowResult(true)}
            />
          ) : null}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(tabs)/matches/watchmatchscreen', params: { matchId: game.id } })}
              style={secondaryBtn}
            >
              <Ionicons name="play" size={14} color={CYAN} />
              <Text style={{ color: CYAN, fontWeight: '800' }}>Watch</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(tabs)/matches/uploadvideoscreen', params: { matchId: game.id } })}
              style={secondaryBtn}
            >
              <Ionicons name="cloud-upload" size={14} color={CYAN} />
              <Text style={{ color: CYAN, fontWeight: '800' }}>Upload video</Text>
            </TouchableOpacity>
          </View>
          </View>
        </ScrollView>

        <GameDayResultSheet
          visible={showResult}
          onClose={() => setShowResult(false)}
          game={game}
          myClub={myClub}
          myPlayer={myPlayer}
          isHomeTeam={sides.amIHomeTeam}
          onSubmitted={onResultSubmitted}
        />
      </SafeAreaView>
    </GamerProfileShell>
  );
}

const secondaryBtn = {
  flex: 1,
  flexDirection: 'row',
  gap: 6,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: 'rgba(0,232,255,0.3)',
  borderRadius: 12,
  paddingVertical: 12,
};
