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
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import {
  advanceTournamentRound,
  fetchTournamentMatches,
  fetchTournamentPublic,
  initializeTournamentDraw,
  officializeTournament,
  registerTournamentClub,
  registerTournamentPlayer,
  withdrawTournamentClub,
} from '@/api/tournamentActions';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';
import { FUT, PitchAtmosphere, SectionCard } from '@/components/dashboard/CommandCenterUI';
import { headingStyle, headingStyleSm } from '@/lib/fonts';

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function TournamentDetailScreen() {
  const { tournamentId } = useLocalSearchParams();
  const router = useRouter();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [myClub, setMyClub] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!tournamentId) return;
    try {
      const [{ user: u, player, club }, t, m] = await Promise.all([
        resolveMyPlayerAndClub(),
        fetchTournamentPublic(tournamentId),
        fetchTournamentMatches(tournamentId),
      ]);
      setUser(u);
      setMyPlayer(player || null);
      setMyClub(club || null);
      setTournament(t);
      setMatches(m || []);
    } catch (err) {
      setError(err?.message || 'Failed to load tournament');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  const clubs = parseList(tournament?.registered_clubs);
  const players = parseList(tournament?.registered_players);
  const clubEntered = myClub && clubs.some((c) => (c.id || c) === myClub.id);
  const playerEntered = myPlayer && players.some((p) => (p.id || p) === myPlayer.id);
  const isOwner = user && (
    tournament?.created_by === user.email
    || tournament?.creator_email === user.email
    || tournament?.owner_email === user.email
  );
  const canRegister = tournament?.status === 'registration';
  const canStart = isOwner && (tournament?.status === 'registration' || tournament?.status === 'draft');

  const run = async (key, fn) => {
    setBusy(key);
    setError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err?.message || 'Action failed');
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return (
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={CYAN} />
        </View>
      </GamerProfileShell>
    );
  }

  if (!tournament) {
    return (
      <GamerProfileShell>
        <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
          <View style={{ padding: 16 }}>
            <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
            <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 24, textAlign: 'center' }}>Tournament not found</Text>
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
          <Text style={{ color: '#fff', fontWeight: '900', marginLeft: 12, flex: 1 }} numberOfLines={1}>
            {tournament.name}
          </Text>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={CYAN} />}
        >
          <PitchAtmosphere style={{ borderWidth: 1.5, borderColor: 'rgba(0,232,255,0.35)' }}>
            <View style={{ padding: 18 }}>
              <Text style={[headingStyleSm, { color: FUT.cyan, fontSize: 10, letterSpacing: 3 }]}>
                {(tournament.type || 'CUP').toUpperCase()}
              </Text>
              <Text style={[headingStyle, { color: '#fff', fontSize: 24, marginTop: 6 }]}>{tournament.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 12 }}>
                {tournament.status} · {clubs.length} clubs · {players.length} players
              </Text>
            </View>
          </PitchAtmosphere>

          {error ? (
            <SectionCard accent="rose">
              <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text>
            </SectionCard>
          ) : null}

          {canRegister && myClub && !clubEntered ? (
            <Primary
              label="Register my club"
              busy={busy === 'regClub'}
              onPress={() => run('regClub', () => registerTournamentClub(tournament.id, myClub.id))}
            />
          ) : null}
          {canRegister && myPlayer && !playerEntered && tournament.mode !== 'club' ? (
            <Primary
              label="Register as player"
              busy={busy === 'regPlayer'}
              onPress={() => run('regPlayer', () => registerTournamentPlayer(tournament.id, myPlayer.id))}
            />
          ) : null}
          {canRegister && clubEntered ? (
            <Ghost
              label="Withdraw club"
              busy={busy === 'withdraw'}
              onPress={() => run('withdraw', () => withdrawTournamentClub(tournament.id, myClub.id))}
            />
          ) : null}
          {canStart ? (
            <Primary
              label="Start / generate draw"
              busy={busy === 'start'}
              onPress={() => run('start', () => initializeTournamentDraw(tournament.id, tournament, clubs))}
            />
          ) : null}
          {isOwner && tournament.status === 'in_progress' ? (
            <Primary
              label="Advance round"
              busy={busy === 'advance'}
              onPress={() => run('advance', () => advanceTournamentRound(tournament.id))}
            />
          ) : null}
          {isOwner && tournament.status === 'in_progress' ? (
            <Ghost
              label="Officialize tournament"
              busy={busy === 'official'}
              onPress={() => run('official', () => officializeTournament(tournament.id))}
            />
          ) : null}

          <SectionCard>
            <Text style={{ color: '#fff', fontWeight: '900', marginBottom: 10 }}>FIXTURES</Text>
            {matches.length === 0 ? (
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>No matches yet.</Text>
            ) : matches.slice(0, 20).map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => router.push({ pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId: m.id } })}
                style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                  {m.home_club_name || m.home_player_name || 'TBD'} vs {m.away_club_name || m.away_player_name || 'TBD'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                  {m.status}{m.home_score != null ? ` · ${m.home_score}–${m.away_score}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </SectionCard>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Ghost
              label="Bracket"
              onPress={() => router.push({ pathname: '/(tabs)/tournaments/bracketscreen', params: { tournamentId } })}
            />
            <Ghost
              label="Standings"
              onPress={() => router.push({ pathname: '/(tabs)/tournaments/leaguestandingsscreen', params: { tournamentId } })}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </GamerProfileShell>
  );
}

function Primary({ label, onPress, busy }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!!busy}
      style={{ backgroundColor: CYAN, borderRadius: 14, paddingVertical: 13, alignItems: 'center' }}
    >
      {busy ? <ActivityIndicator color="#041018" /> : <Text style={{ color: '#041018', fontWeight: '900' }}>{label}</Text>}
    </TouchableOpacity>
  );
}

function Ghost({ label, onPress, busy }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!!busy}
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(0,232,255,0.3)',
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
      }}
    >
      {busy ? <ActivityIndicator color={CYAN} /> : <Text style={{ color: CYAN, fontWeight: '800' }}>{label}</Text>}
    </TouchableOpacity>
  );
}
