import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import { parseIdList, buildResultPayload, mapResultError, submitMatchResult } from '@/lib/gameDayOps';

export default function GameDayResultSheet({
  visible,
  onClose,
  game,
  myClub,
  myPlayer,
  isHomeTeam,
  onSubmitted,
}) {
  const isClubMatch = game?.mode === 'club';
  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [seatedPlayers, setSeatedPlayers] = useState([]);
  const [proofUrl, setProofUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible || !isClubMatch || !myClub?.id) return;
    (async () => {
      const [dressing, allPlayers] = await Promise.all([
        stageClient.entities.DressingRoom.filter({ match_id: game.id, club_id: myClub.id }).catch(() => []),
        stageClient.entities.Player.filter({ club_id: myClub.id }).catch(() => []),
      ]);
      const ids = parseIdList(dressing?.[0]?.seated_players);
      setSeatedPlayers((allPlayers || []).filter((p) => ids.includes(p.id)));
    })();
  }, [visible, game?.id, myClub?.id, isClubMatch]);

  const pickProof = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Photo access is required for match proof.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    setUploading(true);
    setError('');
    try {
      const uploaded = await stageClient.integrations.Core.UploadFile({
        file: { uri: asset.uri, name: asset.fileName || 'proof.jpg', type: asset.mimeType || 'image/jpeg' },
      });
      setProofUrl(uploaded?.file_url || null);
    } catch (err) {
      setError(err?.message || 'Could not upload proof');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!proofUrl) {
      setError('Upload screenshot proof before submitting.');
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
        seatedPlayers,
        proofUrl,
      });
      const res = await submitMatchResult(payload);
      onSubmitted?.(res?.data?.status || res?.status || 'waiting', Number(homeScore), Number(awayScore));
      onClose?.();
    } catch (err) {
      setError(mapResultError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
        <View style={{
          backgroundColor: '#071018',
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderWidth: 1,
          borderColor: 'rgba(0,232,255,0.28)',
          maxHeight: '88%',
          paddingBottom: 28,
        }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '900', letterSpacing: 0.6 }}>SUBMIT RESULT</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              Home submits first. Away confirms. Mismatch becomes a dispute.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ScoreBox label="Home" value={homeScore} onChange={setHomeScore} />
              <ScoreBox label="Away" value={awayScore} onChange={setAwayScore} />
            </View>
            <TouchableOpacity onPress={pickProof} style={proofBtn}>
              {uploading
                ? <ActivityIndicator color={CYAN} />
                : (
                  <>
                    <Ionicons name={proofUrl ? 'checkmark-circle' : 'image'} size={16} color={CYAN} />
                    <Text style={{ color: CYAN, fontWeight: '800' }}>
                      {proofUrl ? 'Proof uploaded' : 'Upload screenshot proof'}
                    </Text>
                  </>
                )}
            </TouchableOpacity>
            {error ? <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text> : null}
            <TouchableOpacity onPress={submit} disabled={submitting} style={submitBtn}>
              {submitting
                ? <ActivityIndicator color="#041018" />
                : <Text style={{ color: '#041018', fontWeight: '900' }}>Submit full time</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
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
