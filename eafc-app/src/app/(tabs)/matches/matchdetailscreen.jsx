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
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';
import { FUT, PitchAtmosphere, SectionCard } from '@/components/dashboard/CommandCenterUI';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import {
  MATCH_STATUS_LABEL,
  afterMatchCompleted,
  bothDressingRoomsReady,
  canKickoffMatch,
  kickoffMatch,
  loadDressingCounts,
  mapKickoffError,
  minutesUntil,
  reloadMatch,
  resolveMatchSides,
} from '@/lib/gameDayOps';
import { getResultSubmissionControls } from '@/lib/gameDayResultFlow';
import GameDayWagerCard from '@/components/matches/GameDayWagerCard';
import GameDayDressingRoom from '@/components/matches/GameDayDressingRoom';
import GameDayResultSheet from '@/components/matches/GameDayResultSheet';
import GameDayStreamCard from '@/components/matches/GameDayStreamCard';

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
  const kickoffReady = canKickoffMatch(game);
  const roomsReady = bothDressingRoomsReady(sides.isClubMatch, dressingCounts);

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
        <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginLeft: 12, flex: 1 }}>GAME DAY</Text>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={CYAN} />}
        >
          <PitchAtmosphere style={{ borderWidth: 1.5, borderColor: 'rgba(0,232,255,0.35)' }}>
            <View style={{ padding: 18 }}>
              <Text style={[headingStyleSm, { color: FUT.cyan, fontSize: 10, letterSpacing: 3 }]}>
                {game.competition_context || (game.tournament_id === 'ranked' ? 'RANKED MATCH' : 'FIXTURE')}
              </Text>
              <Text style={[headingStyle, { color: '#fff', fontSize: 22, marginTop: 6 }]}>
                {sides.homeName} vs {sides.awayName}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: isLive ? 'rgba(124,255,107,0.14)' : 'rgba(0,232,255,0.12)',
                }}
                >
                  <Text style={{ color: isLive ? FUT.lime : CYAN, fontSize: 10, fontWeight: '900' }}>
                    {MATCH_STATUS_LABEL[game.status] || game.status}
                  </Text>
                </View>
                {mins != null && game.status === 'scheduled' && mins > 0 ? (
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                    in {mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}
                  </Text>
                ) : null}
              </View>
              {(isLive || isCompleted || isDisputed) ? (
                <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900', textAlign: 'center', marginTop: 16 }}>
                  {game.home_score ?? 0} – {game.away_score ?? 0}
                </Text>
              ) : null}
            </View>
          </PitchAtmosphere>

          {isDisputed ? (
            <SectionCard accent="rose">
              <Text style={{ color: FUT.rose, fontWeight: '800' }}>Disputed</Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 4 }}>
                Scores or proof did not match. An admin will resolve this.
              </Text>
            </SectionCard>
          ) : null}

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

          {sides.isMyMatch && sides.amIHomeTeam && kickoffReady ? (
            <TouchableOpacity
              onPress={onKickoff}
              disabled={kickoffLoading || !roomsReady}
              style={{
                backgroundColor: roomsReady ? CYAN : 'rgba(255,255,255,0.12)',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: kickoffLoading ? 0.6 : 1,
              }}
            >
              {kickoffLoading
                ? <ActivityIndicator color="#041018" />
                : (
                  <Text style={{ color: roomsReady ? '#041018' : 'rgba(255,255,255,0.45)', fontWeight: '900' }}>
                    {roomsReady ? 'KICK OFF' : 'Waiting for both dressing rooms'}
                  </Text>
                )}
            </TouchableOpacity>
          ) : null}

          {resultControls.showHomeSubmit || resultControls.showAwaySubmit ? (
            <TouchableOpacity
              onPress={() => setShowResult(true)}
              style={{ backgroundColor: FUT.lime, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#041018', fontWeight: '900' }}>
                {sides.amIHomeTeam ? 'SUBMIT FULL TIME' : 'SUBMIT MY RESULT'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {resultControls.showAwayWaitingForHome ? (
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center' }}>
              Waiting for home to submit the result.
            </Text>
          ) : null}
          {resultControls.showHomeWaitingForAway ? (
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center' }}>
              Result sent. Waiting for away confirmation.
            </Text>
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
