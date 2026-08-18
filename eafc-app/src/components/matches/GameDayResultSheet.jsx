import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { parseIdList, buildResultPayload, mapResultError, submitMatchResult, sameId } from '@/lib/gameDayOps';

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
  const [ownScore, setOwnScore] = useState('0');
  const [opponentScore, setOpponentScore] = useState('0');
  const [seatedPlayers, setSeatedPlayers] = useState([]);
  const [proofUrl, setProofUrl] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setOwnScore('0');
    setOpponentScore('0');
    setProofUrl(null);
    setProofPreview(null);
    setError('');
  }, [visible, game?.id]);

  useEffect(() => {
    if (!visible || !isClubMatch || !myClub?.id) return;
    (async () => {
      const [dressing, allPlayers] = await Promise.all([
        stageClient.entities.DressingRoom.filter({ match_id: game.id, club_id: myClub.id }).catch(() => []),
        stageClient.entities.Player.filter({ club_id: myClub.id }).catch(() => []),
      ]);
      const ids = parseIdList(dressing?.[0]?.seated_players);
      setSeatedPlayers((allPlayers || []).filter((p) => ids.some((id) => sameId(id, p.id))));
    })();
  }, [visible, game?.id, myClub?.id, isClubMatch]);

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

  const submit = async () => {
    if (!proofUrl) {
      setError('Upload a screenshot of the final score before submitting.');
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
        ownScore,
        opponentScore,
        seatedPlayers,
        proofUrl,
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
          accessibilityLabel="Close submit result"
          style={styles.scrim}
        />
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '900', letterSpacing: 0.6 }}>SUBMIT RESULT</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18 }}>
              Enter the final score and attach a screenshot of the match. Home submits first, then away. If both scores match, the match completes. If they do not, it goes to dispute and an admin picks the winner from the proofs.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ScoreBox
                label={isHomeTeam ? `${homeName} (you · home)` : `${awayName} (you · away)`}
                value={ownScore}
                onChange={setOwnScore}
              />
              <ScoreBox
                label={isHomeTeam ? `${awayName} (away)` : `${homeName} (home)`}
                value={opponentScore}
                onChange={setOpponentScore}
              />
            </View>
            {proofPreview ? (
              <Image source={{ uri: proofPreview }} style={{ width: '100%', height: 160, borderRadius: 12, backgroundColor: '#0A1222' }} />
            ) : null}
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
            {error ? <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text> : null}
            <TouchableOpacity onPress={submit} disabled={submitting || !proofUrl} style={[submitBtn, !proofUrl && { opacity: 0.4 }]}>
              {submitting
                ? <ActivityIndicator color="#041018" />
                : <Text style={{ color: '#041018', fontWeight: '900' }}>Submit full time</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ScoreBox({ label, value, onChange }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={String(value)}
        onChangeText={onChange}
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
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: '#071018',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,232,255,0.28)',
    maxHeight: '88%',
    paddingBottom: 28,
  },
});

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
