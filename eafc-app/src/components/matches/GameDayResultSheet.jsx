import React, { useEffect, useMemo, useState } from 'react';
import {
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
import useThemeStore from '@/store/themeStore';
import { Button, IconButton } from '@/components/ui';
import { MIN_TOUCH } from '@/components/ui/metrics';
import { sectionLabelStyle } from '@/components/dashboard/CommandCenterUI';
import { buildResultPayload, isClubGameDayMatch, mapResultError, submitMatchResult } from '@/lib/gameDayOps';
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
  const tokens = useThemeStore((st) => st.tokens);
  const hint = hintStyle(tokens);
  const label = sectionLabelStyle(tokens);
  const isClubMatch = isClubGameDayMatch(game);
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
  const localPensAllowed = penaltiesAllowed(game);

  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [squad, setSquad] = useState([]);
  const [playedIds, setPlayedIds] = useState(() => new Set());
  const [playerMarks, setPlayerMarks] = useState({});
  const [penaltyChoice, setPenaltyChoice] = useState('none');
  const [penaltyContext, setPenaltyContext] = useState(null);
  const [penaltyError, setPenaltyError] = useState('');
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
  const allowPens = penaltyContext ? Boolean(penaltyContext.applicable) : localPensAllowed;
  const showPenalties = allowPens && isDraw && !scoreLocked;

  useEffect(() => {
    if (!visible || !game?.id) return undefined;
    let active = true;
    setPenaltyContext(null);
    setPenaltyError('');
    const timer = setTimeout(() => {
      stageClient.http.get(`/game-day/${encodeURIComponent(game.id)}/penalties`, {
        home_score: Number(homeScore),
        away_score: Number(awayScore),
      })
        .then((context) => {
          if (!active) return;
          setPenaltyContext(context);
          if (!context?.applicable) setPenaltyChoice('none');
        })
        .catch((e) => {
          if (!active) return;
          if (e?.status === 404) {
            setPenaltyError('');
            return;
          }
          setPenaltyError(e?.message || 'Penalty eligibility could not be verified.');
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [visible, game?.id, homeScore, awayScore]);

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
          style={[styles.scrim, { backgroundColor: tokens.overlay }]}
        />
        <View
          style={[styles.sheet, { backgroundColor: tokens.bgDeep, borderColor: tokens.border }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
            <Text numberOfLines={1} style={{ flex: 1, color: tokens.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>{title}</Text>
            <IconButton icon="close" onPress={onClose} accessibilityLabel="Close" />
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
              <Text style={[hint, { color: tokens.warning }]}>
                Correction proposed: {correctionFixture.home}–{correctionFixture.away}. Accept it, counter once, or dispute with proof.
              </Text>
            ) : null}
            {correcting ? (
              <Text style={hint}>Enter the score you believe is correct. No screenshot is required at this step.</Text>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ScoreBox tokens={tokens} label={`${homeName} (home)`} value={homeScore} onChange={setHomeScore} readOnly={scoreLocked} />
              <ScoreBox tokens={tokens} label={`${awayName} (away)`} value={awayScore} onChange={setAwayScore} readOnly={scoreLocked} />
            </View>

            {penaltyError ? (
              <Text style={{ color: tokens.danger, fontSize: 13 }}>{penaltyError}</Text>
            ) : null}
            {showPenalties ? (
              <View style={{ gap: 8 }}>
                <Text style={label}>PENALTIES</Text>
                {[
                  ['none', 'No penalties'],
                  ['home', 'Home won on penalties'],
                  ['away', 'Away won on penalties'],
                ].map(([value, caption]) => (
                  <TouchableOpacity key={value} onPress={() => setPenaltyChoice(value)} style={rowBtn}>
                    <Ionicons name={penaltyChoice === value ? 'radio-button-on' : 'radio-button-off'} size={22} color={tokens.cyan} />
                    <Text style={{ color: tokens.text, fontSize: 14 }}>{caption}</Text>
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
                    <View key={p.id} style={playerRow(tokens)}>
                      <TouchableOpacity onPress={() => togglePlayed(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minHeight: 44 }}>
                        <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? tokens.cyan : tokens.muted} />
                        <Text numberOfLines={1} style={{ color: on ? tokens.text : tokens.muted, fontWeight: '600', flex: 1 }}>{p.gamertag}</Text>
                      </TouchableOpacity>
                      {on ? (
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <MiniNum tokens={tokens} label="G" value={marks.goals} onChange={(v) => setMark(p.id, 'goals', v)} />
                          <MiniNum tokens={tokens} label="A" value={marks.assists} onChange={(v) => setMark(p.id, 'assists', v)} />
                          <MiniNum tokens={tokens} label="R" value={marks.rating} onChange={(v) => setMark(p.id, 'rating', v)} />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}

            {proofPreview ? (
              <Image source={{ uri: proofPreview }} style={{ width: '100%', height: 160, borderRadius: 12, backgroundColor: tokens.card }} />
            ) : null}
            <Text style={label}>
              PROOF {needsEvidence || reviewMode ? '(required to dispute / submit)' : '(optional for Arrange Game)'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button
                  variant="secondary"
                  title={proofUrl ? 'Proof ready' : 'Gallery'}
                  icon={proofUrl ? 'checkmark-circle-outline' : 'image-outline'}
                  loading={uploading}
                  onPress={() => pickProof(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  variant="secondary"
                  title="Camera"
                  icon="camera-outline"
                  onPress={() => pickProof(true)}
                />
              </View>
            </View>

            {reviewMode || correcting ? (
              <TextInput
                value={explanation}
                onChangeText={setExplanation}
                placeholder="Optional note"
                placeholderTextColor={tokens.muted}
                selectionColor={tokens.cyan}
                style={noteInput(tokens)}
              />
            ) : null}

            {error ? <Text style={{ color: tokens.danger, fontSize: 13 }}>{error}</Text> : null}

            {reviewMode && !countering ? (
              <View style={{ gap: 8 }}>
                <Button
                  title="Accept correction"
                  onPress={() => runAction('accept_correction')}
                  loading={submitting}
                  disabled={submitting}
                />
                {controls.canCounter ? (
                  <Button
                    variant="secondary"
                    title="Counter once"
                    onPress={() => setCountering(true)}
                    disabled={submitting}
                  />
                ) : null}
                <Button
                  variant="danger"
                  title="Dispute result"
                  onPress={() => runAction('dispute_result')}
                  disabled={submitting}
                />
              </View>
            ) : null}

            {confirmMode && !correcting ? (
              <View style={{ gap: 8 }}>
                <Button
                  title="Confirm result"
                  onPress={() => runAction('confirm_result')}
                  loading={submitting}
                  disabled={submitting}
                />
                <Button
                  variant="secondary"
                  title="Result is incorrect"
                  onPress={() => setCorrecting(true)}
                  disabled={submitting}
                />
              </View>
            ) : null}

            {(!reviewMode && !confirmMode) || correcting || countering ? (
              <Button
                title={countering ? 'Send counter' : correcting ? 'Propose correction' : 'Submit full time'}
                onPress={() => runAction(countering ? 'counter_result' : correcting ? 'propose_correction' : 'submit_result')}
                loading={submitting}
                disabled={submitting || uploading || (needsEvidence && !proofUrl && !correcting)}
              />
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ScoreBox({ tokens, label, value, onChange, readOnly }) {
  return (
    <View style={{ flex: 1 }}>
      <Text numberOfLines={1} style={{ color: tokens.textSoft, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={String(value)}
        onChangeText={onChange}
        editable={!readOnly}
        keyboardType="number-pad"
        selectionColor={tokens.cyan}
        style={{
          backgroundColor: tokens.bgDeep,
          borderWidth: 1,
          borderColor: tokens.border,
          borderRadius: 12,
          color: tokens.text,
          fontSize: 28,
          fontWeight: '700',
          textAlign: 'center',
          paddingVertical: 12,
          opacity: readOnly ? 0.7 : 1,
        }}
      />
    </View>
  );
}

/** Per-player G/A/R input: 44pt touch target. */
function MiniNum({ tokens, label, value, onChange }) {
  return (
    <View style={{ width: 48 }}>
      <Text style={{ color: tokens.muted, fontSize: 11, textAlign: 'center' }}>{label}</Text>
      <TextInput
        value={String(value ?? 0)}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        selectionColor={tokens.cyan}
        style={{
          backgroundColor: tokens.bgDeep,
          borderWidth: 1,
          borderColor: tokens.border,
          borderRadius: 8,
          color: tokens.text,
          fontSize: 14,
          fontWeight: '600',
          textAlign: 'center',
          minHeight: MIN_TOUCH,
          paddingVertical: 8,
        }}
      />
    </View>
  );
}

const styles = {
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    maxHeight: '88%',
    paddingBottom: 28,
  },
};

const hintStyle = (tokens) => ({ color: tokens.muted, fontSize: 13, lineHeight: 19 });
const rowBtn = { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 };
const playerRow = (tokens) => ({
  backgroundColor: tokens.card,
  borderWidth: 1,
  borderColor: tokens.border,
  borderRadius: 12,
  padding: 10,
  gap: 8,
});
const noteInput = (tokens) => ({
  backgroundColor: tokens.bgDeep,
  borderWidth: 1,
  borderColor: tokens.border,
  borderRadius: 12,
  color: tokens.text,
  height: 50,
  paddingHorizontal: 16,
});
