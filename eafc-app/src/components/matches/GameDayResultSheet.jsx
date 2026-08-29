import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import { FUT } from '@/components/dashboard/CommandCenterUI';
import { buildResultPayload, mapResultError, submitMatchResult } from '@/lib/gameDayOps';
import {
  evidenceRequired,
  fixtureScoreFromSubmission,
  getResultSubmissionControls,
  parseMatchSubmission,
  penaltiesAllowed,
} from '@/lib/gameDayResultFlow';

export default function GameDayResultSheet({
  visible,
  onClose,
  game,
  myClub,
  myPlayer,
  isHomeTeam,
  onSubmitted,
}) {
  const isClubMatch = game?.mode === 'club' || Boolean(game?.home_club_id);
  const homeName = game?.home_club_name || game?.home_player_name || 'Home';
  const awayName = game?.away_club_name || game?.away_player_name || 'Away';
  const controls = getResultSubmissionControls({
    game,
    isLive: true,
    showResultForm: false,
    amIHomeTeam: isHomeTeam,
  });
  const confirmMode = Boolean(controls.showConfirmResult);
  const reviewMode = Boolean(controls.showHomeReview);
  const submittedScore = parseMatchSubmission(
    controls.submitSide === 'away' ? game?.away_submission : game?.home_submission,
  );
  const submittedFixture = fixtureScoreFromSubmission(submittedScore, controls.submitSide);
  const correction = parseMatchSubmission(game?.away_submission);
  const correctionFixture = fixtureScoreFromSubmission(correction, 'away');
  const allowPens = penaltiesAllowed(game);

  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [squad, setSquad] = useState([]);
  const [playedIds, setPlayedIds] = useState(() => new Set());
  const [playerMarks, setPlayerMarks] = useState({});
  const [penaltyChoice, setPenaltyChoice] = useState('none');
  const [correcting, setCorrecting] = useState(false);
  const [countering, setCountering] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [proofUrl, setProofUrl] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const scoreLocked = confirmMode && !correcting && !countering;
  const needsEvidence = evidenceRequired(game) && !confirmMode && !correcting;
  const isDraw = Number(homeScore) === Number(awayScore);
  const showPenalties = allowPens && isDraw && !scoreLocked;

  useEffect(() => {
    if (!visible) return;
    const seed = (confirmMode || reviewMode)
      ? (reviewMode ? correctionFixture : submittedFixture)
      : null;
    const home = Number.isFinite(seed?.home) ? seed.home : 0;
    const away = Number.isFinite(seed?.away) ? seed.away : 0;
    setHomeScore(String(home));
    setAwayScore(String(away));
    setProofUrl(null);
    setProofPreview(null);
    setError('');
    setCorrecting(false);
    setCountering(false);
    setExplanation('');
    setPenaltyChoice('none');
  }, [visible, game?.id, confirmMode, reviewMode, submittedFixture.home, submittedFixture.away, correctionFixture.home, correctionFixture.away]);

  useEffect(() => {
    if (!visible || !isClubMatch || !myClub?.id) return undefined;
    let cancelled = false;
    (async () => {
      const allPlayers = await stageClient.entities.Player.filter({ club_id: myClub.id }).catch(() => []);
      if (cancelled) return;
      const roster = allPlayers || [];
      setSquad(roster);
      const marks = {};
      roster.forEach((p) => { marks[p.id] = { goals: 0, assists: 0, rating: 6 }; });
      setPlayerMarks(marks);
      let suggested = [];
      if (game?.source_fixture_id) {
        const lineups = await stageClient.entities.ClubFixtureLineup
          .filter({ fixture_id: game.source_fixture_id, club_id: myClub.id })
          .catch(() => []);
        const raw = lineups?.[0]?.starting_players;
        try {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          suggested = Array.isArray(parsed)
            ? parsed.map((entry) => entry?.id || entry?.player_id || entry).filter(Boolean)
            : [];
        } catch {
          suggested = [];
        }
      }
      setPlayedIds(new Set(suggested.map(String)));
    })();
    return () => { cancelled = true; };
  }, [visible, game?.id, game?.source_fixture_id, myClub?.id, isClubMatch]);

  const title = useMemo(() => {
    if (reviewMode && !countering) return 'REVIEW CORRECTION';
    if (confirmMode && !correcting) return 'CONFIRM RESULT';
    if (correcting) return 'PROPOSE CORRECTION';
    if (countering) return 'COUNTER RESULT';
    return 'SUBMIT RESULT';
  }, [reviewMode, confirmMode, correcting, countering]);

  const uploadAsset = async (asset) => {
    if (!asset?.uri) return;
    setUploading(true);
    setError('');
    setProofPreview(asset.uri);
    try {
      const uploaded = await stageClient.integrations.Core.UploadFile({
        file: { uri: asset.uri, name: asset.fileName || 'proof.jpg', type: asset.mimeType || 'image/jpeg' },
      });
      setProofUrl(uploaded?.file_url || null);
    } catch (err) {
      setProofUrl(null);
      setError(err?.message || 'Could not upload proof');
    } finally {
      setUploading(false);
    }
  };

  const pickProof = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      setError(fromCamera ? 'Camera access is required.' : 'Photo access is required for match proof.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
    if (result.canceled || !result.assets?.[0]) return;
    await uploadAsset(result.assets[0]);
  };

  const togglePlayed = (id) => {
    setPlayedIds((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const setMark = (id, field, value) => {
    setPlayerMarks((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { goals: 0, assists: 0, rating: 6 }), [field]: value },
    }));
  };

  const runAction = async (action) => {
    const needsProofNow = action === 'dispute_result'
      || (['submit_result', 'counter_result'].includes(action) && evidenceRequired(game));
    if (needsProofNow && !proofUrl) {
      setError(action === 'dispute_result'
        ? 'Upload screenshot proof to open a dispute.'
        : 'Upload a screenshot of the final score before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = buildResultPayload({
        game,
        isHomeTeam,
        myClub,
        myPlayer,
        homeScore,
        awayScore,
        seatedPlayers: squad,
        participatingIds: [...playedIds],
        playerMarks,
        proofUrl,
        action,
        decided_on_penalties: penaltyChoice !== 'none',
        penalty_winner_side: penaltyChoice === 'none' ? null : penaltyChoice,
        explanation,
      });
      const res = await submitMatchResult(payload);
      onSubmitted?.(res?.data?.status || res?.status || 'waiting', Number(payload.home_score), Number(payload.away_score));
      onClose?.();
    } catch (err) {
      setError(mapResultError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.root}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close result sheet"
          style={styles.scrim}
        />
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '900', letterSpacing: 0.6 }}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}
          >
            {confirmMode && submittedScore && !correcting ? (
              <Text style={hint}>
                {controls.submitSide === 'away' ? awayName : homeName} submitted {submittedFixture.home}–{submittedFixture.away}. Is this result correct? Enter your own players below. You never submit the other club’s stats.
              </Text>
            ) : null}
            {reviewMode && correction && !countering ? (
              <Text style={[hint, { color: FUT.gold }]}>
                Correction proposed: {correctionFixture.home}–{correctionFixture.away}. Accept it, counter once, or dispute with proof.
              </Text>
            ) : null}
            {correcting ? (
              <Text style={hint}>Enter the score you believe is correct. No screenshot is required at this step.</Text>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ScoreBox label={`${homeName} (home)`} value={homeScore} onChange={setHomeScore} readOnly={scoreLocked} />
              <ScoreBox label={`${awayName} (away)`} value={awayScore} onChange={setAwayScore} readOnly={scoreLocked} />
            </View>

            {showPenalties ? (
              <View style={{ gap: 8 }}>
                <Text style={label}>PENALTIES</Text>
                {[
                  ['none', 'No penalties'],
                  ['home', 'Home won on penalties'],
                  ['away', 'Away won on penalties'],
                ].map(([value, caption]) => (
                  <TouchableOpacity key={value} onPress={() => setPenaltyChoice(value)} style={rowBtn}>
                    <Ionicons name={penaltyChoice === value ? 'radio-button-on' : 'radio-button-off'} size={16} color={CYAN} />
                    <Text style={{ color: '#fff', fontSize: 13 }}>{caption}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {isClubMatch ? (
              <View style={{ gap: 8 }}>
                <Text style={label}>PLAYERS WHO PLAYED</Text>
                <Text style={hint}>Tick who actually played for your club. Pre-match lineups are only a suggestion.</Text>
                {squad.map((p) => {
                  const on = playedIds.has(String(p.id));
                  const marks = playerMarks[p.id] || {};
                  return (
                    <View key={p.id} style={playerRow}>
                      <TouchableOpacity onPress={() => togglePlayed(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18} color={on ? CYAN : 'rgba(255,255,255,0.35)'} />
                        <Text style={{ color: on ? '#fff' : 'rgba(255,255,255,0.45)', fontWeight: '700', flex: 1 }}>{p.gamertag}</Text>
                      </TouchableOpacity>
                      {on ? (
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <MiniNum label="G" value={marks.goals} onChange={(v) => setMark(p.id, 'goals', v)} />
                          <MiniNum label="A" value={marks.assists} onChange={(v) => setMark(p.id, 'assists', v)} />
                          <MiniNum label="R" value={marks.rating} onChange={(v) => setMark(p.id, 'rating', v)} />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}

            {proofPreview ? (
              <Image source={{ uri: proofPreview }} style={{ width: '100%', height: 160, borderRadius: 12, backgroundColor: '#0A1222' }} />
            ) : null}
            <Text style={label}>
              PROOF {needsEvidence || reviewMode ? '(required to dispute / submit)' : '(optional for Arrange Game)'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => pickProof(false)} style={[proofBtn, { flex: 1 }]}>
                {uploading
                  ? <ActivityIndicator color={CYAN} />
                  : (
                    <>
                      <Ionicons name={proofUrl ? 'checkmark-circle' : 'image'} size={16} color={CYAN} />
                      <Text style={{ color: CYAN, fontWeight: '800', fontSize: 12 }}>
                        {proofUrl ? 'Proof ready' : 'Gallery'}
                      </Text>
                    </>
                  )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => pickProof(true)} style={[proofBtn, { flex: 1 }]}>
                <Ionicons name="camera" size={16} color={CYAN} />
                <Text style={{ color: CYAN, fontWeight: '800', fontSize: 12 }}>Camera</Text>
              </TouchableOpacity>
            </View>

            {reviewMode || correcting ? (
              <TextInput
                value={explanation}
                onChangeText={setExplanation}
                placeholder="Optional note"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={noteInput}
              />
            ) : null}

            {error ? <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text> : null}

            {reviewMode && !countering ? (
              <View style={{ gap: 8 }}>
                <TouchableOpacity onPress={() => runAction('accept_correction')} disabled={submitting} style={submitBtn}>
                  {submitting ? <ActivityIndicator color="#041018" /> : <Text style={submitLabel}>Accept correction</Text>}
                </TouchableOpacity>
                {controls.canCounter ? (
                  <TouchableOpacity onPress={() => setCountering(true)} disabled={submitting} style={outlineBtn}>
                    <Text style={outlineLabel}>Counter once</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={() => runAction('dispute_result')} disabled={submitting} style={outlineBtn}>
                  <Text style={outlineLabel}>Dispute result</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {confirmMode && !correcting ? (
              <View style={{ gap: 8 }}>
                <TouchableOpacity onPress={() => runAction('confirm_result')} disabled={submitting} style={submitBtn}>
                  {submitting ? <ActivityIndicator color="#041018" /> : <Text style={submitLabel}>Confirm result</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCorrecting(true)} disabled={submitting} style={outlineBtn}>
                  <Text style={outlineLabel}>Result is incorrect</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {(!reviewMode && !confirmMode) || correcting || countering ? (
              <TouchableOpacity
                onPress={() => runAction(countering ? 'counter_result' : correcting ? 'propose_correction' : 'submit_result')}
                disabled={submitting || uploading || (needsEvidence && !proofUrl && !correcting)}
                style={[submitBtn, needsEvidence && !proofUrl && !correcting && { opacity: 0.4 }]}
              >
                {submitting
                  ? <ActivityIndicator color="#041018" />
                  : <Text style={submitLabel}>{countering ? 'Send counter' : correcting ? 'Propose correction' : 'Submit full time'}</Text>}
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ScoreBox({ label, value, onChange, readOnly }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={String(value)}
        onChangeText={onChange}
        editable={!readOnly}
        keyboardType="number-pad"
        style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          borderRadius: 12,
          color: '#fff',
          fontSize: 28,
          fontWeight: '900',
          textAlign: 'center',
          paddingVertical: 12,
          opacity: readOnly ? 0.7 : 1,
        }}
      />
    </View>
  );
}

function MiniNum({ label, value, onChange }) {
  return (
    <View style={{ width: 42 }}>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, textAlign: 'center' }}>{label}</Text>
      <TextInput
        value={String(value ?? 0)}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          borderRadius: 8,
          color: '#fff',
          fontSize: 13,
          fontWeight: '800',
          textAlign: 'center',
          paddingVertical: 4,
        }}
      />
    </View>
  );
}

const styles = {
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    backgroundColor: '#071018',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,232,255,0.28)',
    maxHeight: '88%',
    paddingBottom: 28,
  },
};

const hint = { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18 };
const label = { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 };
const rowBtn = { flexDirection: 'row', alignItems: 'center', gap: 8 };
const playerRow = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderRadius: 10,
  padding: 10,
  gap: 8,
};
const proofBtn = {
  borderWidth: 1,
  borderColor: 'rgba(0,232,255,0.35)',
  borderRadius: 12,
  paddingVertical: 12,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
};
const submitBtn = {
  backgroundColor: CYAN,
  borderRadius: 12,
  paddingVertical: 14,
  alignItems: 'center',
};
const submitLabel = { color: '#041018', fontWeight: '900' };
const outlineBtn = {
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.2)',
  borderRadius: 12,
  paddingVertical: 14,
  alignItems: 'center',
};
const outlineLabel = { color: '#fff', fontWeight: '800' };
const noteInput = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#fff',
  paddingHorizontal: 12,
  paddingVertical: 10,
};
