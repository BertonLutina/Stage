import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';
import { FUT, SectionCard } from '@/components/dashboard/CommandCenterUI';
import { formatSideClaim } from '@/lib/gameDayResultFlow';
import {
  absoluteProofUrl,
  isStageAdmin,
  loadCompletedMatchesWithProofs,
  loadDisputedMatches,
  parseSubmission,
  resolveDisputedMatch,
} from '@/lib/adminDisputes';

export default function AdminDisputesScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [picked, setPicked] = useState(null);
  const [winner, setWinner] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { user: u } = await resolveMyPlayerAndClub();
    setUser(u);
    if (isStageAdmin(u)) {
      const [disputed, done] = await Promise.all([
        loadDisputedMatches(),
        loadCompletedMatchesWithProofs(),
      ]);
      setRows(disputed);
      setCompleted(done);
    } else {
      setRows([]);
      setCompleted([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const chooseSide = (match, side) => {
    const sub = parseSubmission(side === 'home' ? match.home_submission : match.away_submission);
    setPicked(match);
    setWinner(side);
    setHomeScore(sub?.home_score != null ? String(sub.home_score) : '');
    setAwayScore(sub?.away_score != null ? String(sub.away_score) : '');
  };

  const resolve = async () => {
    if (!picked) return;
    setBusy(true);
    setError('');
    try {
      await resolveDisputedMatch({
        matchId: picked.id,
        winnerSide: winner,
        homeScore,
        awayScore,
      });
      setPicked(null);
      setWinner('');
      setHomeScore('');
      setAwayScore('');
      await load();
    } catch (err) {
      setError(err?.message || 'Resolve failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <Text style={{ color: '#fff', fontWeight: '900', marginLeft: 12 }}>RESULTS & PROOFS</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={CYAN} style={{ marginTop: 40 }} />
        ) : !isStageAdmin(user) ? (
          <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 }}>Admin only</Text>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 10 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={CYAN} />}
          >
            {error ? <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text> : null}
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>DISPUTED</Text>
            {rows.length === 0 ? (
              <SectionCard>
                <Text style={{ color: 'rgba(255,255,255,0.5)' }}>No disputed matches.</Text>
              </SectionCard>
            ) : rows.map((m) => {
              const homeSub = parseSubmission(m.home_submission);
              const awaySub = parseSubmission(m.away_submission);
              const homeName = m.home_club_name || m.home_player_name || 'Home';
              const awayName = m.away_club_name || m.away_player_name || 'Away';
              const open = picked?.id === m.id;
              return (
                <SectionCard key={m.id} accent="rose">
                  <Text style={{ color: '#fff', fontWeight: '800' }}>{homeName} vs {awayName}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
                    Home claims {formatSideClaim(homeSub, 'home')} · Away claims {formatSideClaim(awaySub, 'away')}
                  </Text>
                  <ProofRow homeSub={homeSub} awaySub={awaySub} onOpen={setPreview} />
                  {!open ? (
                    <TouchableOpacity onPress={() => chooseSide(m, 'home')} style={{ marginTop: 10 }}>
                      <Text style={{ color: CYAN, fontWeight: '800' }}>Resolve</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ gap: 8, marginTop: 12 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <SideBtn label={formatSideClaim(homeSub, 'home')} active={winner === 'home'} onPress={() => chooseSide(m, 'home')} />
                        <SideBtn label={formatSideClaim(awaySub, 'away')} active={winner === 'away'} onPress={() => chooseSide(m, 'away')} />
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Official score Home – Away (edit if needed)</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TextInput value={homeScore} onChangeText={setHomeScore} keyboardType="number-pad" style={scoreInput} />
                        <TextInput value={awayScore} onChangeText={setAwayScore} keyboardType="number-pad" style={scoreInput} />
                      </View>
                      <TouchableOpacity onPress={resolve} disabled={busy} style={{ backgroundColor: CYAN, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                        {busy ? <ActivityIndicator color="#041018" /> : <Text style={{ color: '#041018', fontWeight: '900' }}>Confirm official result</Text>}
                      </TouchableOpacity>
                    </View>
                  )}
                </SectionCard>
              );
            })}
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginTop: 8 }}>COMPLETED · OPEN PROOFS</Text>
            {completed.length === 0 ? (
              <SectionCard>
                <Text style={{ color: 'rgba(255,255,255,0.5)' }}>No completed matches yet.</Text>
              </SectionCard>
            ) : completed.map((m) => {
              const homeSub = parseSubmission(m.home_submission);
              const awaySub = parseSubmission(m.away_submission);
              const homeName = m.home_club_name || m.home_player_name || 'Home';
              const awayName = m.away_club_name || m.away_player_name || 'Away';
              return (
                <SectionCard key={m.id}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>{homeName} vs {awayName}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
                    Official {m.home_score ?? '?'}–{m.away_score ?? '?'} · Home {formatSideClaim(homeSub, 'home')} · Away {formatSideClaim(awaySub, 'away')}
                  </Text>
                  <ProofRow homeSub={homeSub} awaySub={awaySub} onOpen={setPreview} />
                </SectionCard>
              );
            })}
          </ScrollView>
          <ProofPreview preview={preview} onClose={() => setPreview(null)} />
        )}
      </SafeAreaView>
    </GamerProfileShell>
  );
}

function ProofRow({ homeSub, awaySub, onOpen }) {
  const homeUrl = absoluteProofUrl(homeSub?.proof_url);
  const awayUrl = absoluteProofUrl(awaySub?.proof_url);
  if (!homeUrl && !awayUrl) {
    return <Text style={{ color: FUT.rose, fontSize: 11, marginTop: 8 }}>No screenshot proof uploaded.</Text>;
  }
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
      <ProofBtn label="Open home proof" url={homeUrl} onOpen={onOpen} />
      <ProofBtn label="Open away proof" url={awayUrl} onOpen={onOpen} />
    </View>
  );
}

function ProofBtn({ label, url, onOpen }) {
  return (
    <TouchableOpacity
      disabled={!url}
      onPress={() => url && onOpen({ url, label })}
      style={{
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: url ? 'rgba(0,232,255,0.35)' : 'rgba(255,255,255,0.08)',
        backgroundColor: url ? 'rgba(0,232,255,0.08)' : 'rgba(255,255,255,0.03)',
        opacity: url ? 1 : 0.45,
      }}
    >
      <Text style={{ color: url ? CYAN : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '800' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function ProofPreview({ preview, onClose }) {
  if (!preview?.url) return null;
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', padding: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '800', marginBottom: 12 }}>{preview.label}</Text>
        <Image source={{ uri: preview.url }} style={{ width: '100%', height: '70%', resizeMode: 'contain' }} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <TouchableOpacity
            onPress={() => Linking.openURL(preview.url)}
            style={{ flex: 1, backgroundColor: CYAN, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#041018', fontWeight: '900' }}>Open original</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function SideBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: active ? 'rgba(0,232,255,0.16)' : 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: active ? 'rgba(0,232,255,0.4)' : 'rgba(255,255,255,0.1)',
      }}
    >
      <Text style={{ color: active ? CYAN : '#fff', fontSize: 11, fontWeight: '800' }}>{label}</Text>
    </TouchableOpacity>
  );
}

const scoreInput = {
  flex: 1,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 22,
  fontWeight: '900',
  textAlign: 'center',
  paddingVertical: 10,
};
