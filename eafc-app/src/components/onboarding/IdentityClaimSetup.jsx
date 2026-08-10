import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import STText from '../common/STText';
import { stageClient } from '../../api/stageClient';
import { onboardingStyles as s } from './onboardingStyles';

const PLATFORMS = ['PlayStation', 'Xbox', 'PC', 'EA', 'Discord'];

export default function IdentityClaimSetup({ player, onComplete }) {
  const [claim, setClaim] = useState(null);
  const [platform, setPlatform] = useState(player?.platform || 'PlayStation');
  const [platformHandle, setPlatformHandle] = useState(player?.gamertag || '');
  const [eaId, setEaId] = useState('');
  const [overallRating, setOverallRating] = useState(
    Number(player?.overall_rating) > 0 ? Number(player.overall_rating) : 70
  );
  const [discordHandle, setDiscordHandle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const clampOvr = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 70;
    return Math.min(99, Math.max(1, Math.round(n)));
  };

  const persistPlayerDetails = async () => {
    if (!player?.id) return;
    await stageClient.entities.Player.update(player.id, {
      platform,
      overall_rating: clampOvr(overallRating),
    }).catch(() => {});
  };

  useEffect(() => {
    let disposed = false;
    (async () => {
      if (!player?.id) {
        setLoading(false);
        return;
      }
      const rows = await stageClient.identityClaims
        .list({ player_id: player.id }, '-created_date', 10)
        .catch(() => []);
      if (!disposed) {
        setClaim(rows[0] || null);
        setLoading(false);
      }
    })();
    return () => {
      disposed = true;
    };
  }, [player?.id]);

  const submitClaim = async () => {
    if (!player?.id || !platformHandle.trim()) {
      setError('Platform handle is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await persistPlayerDetails();
      const created = await stageClient.identityClaims.submit({
        player_id: player.id,
        platform,
        platform_handle: platformHandle.trim(),
        ea_id: eaId.trim() || null,
        discord_handle: discordHandle.trim() || null,
        proof_url: null,
        notes: notes.trim() || null,
      });
      setClaim(created);
      onComplete?.(created);
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Failed to submit claim');
    } finally {
      setSaving(false);
    }
  };

  const skipForNow = async () => {
    setSaving(true);
    setError(null);
    try {
      await persistPlayerDetails();
      onComplete?.(null);
    } catch (err) {
      setError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ paddingVertical: 40, alignItems: 'center' }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (Number(player?.is_verified) === 1 || claim?.status === 'pending' || claim?.status === 'approved') {
    return (
      <View>
        <STText style={s.title}>
          {Number(player?.is_verified) === 1 || claim?.status === 'approved'
            ? 'Identity verified'
            : 'Claim submitted'}
        </STText>
        <STText style={s.subtitle}>
          {Number(player?.is_verified) === 1 || claim?.status === 'approved'
            ? 'Your player identity is linked.'
            : 'Your claim is pending review. You can continue.'}
        </STText>
        <TouchableOpacity onPress={() => onComplete?.(claim)} style={s.primaryBtn}>
          <STText style={s.primaryBtnText}>Continue</STText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <STText style={s.title}>Claim your identity</STText>
      <STText style={s.subtitle}>
        Link your platform handle so STAGE can verify you. You can skip and do this later.
      </STText>

      <STText style={s.label}>Platform *</STText>
      <View style={s.chipRow}>
        {PLATFORMS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPlatform(p)}
            style={[s.chip, platform === p && s.chipActive]}
          >
            <STText style={[s.chipText, platform === p && s.chipTextActive]}>{p}</STText>
          </TouchableOpacity>
        ))}
      </View>

      <STText style={s.label}>Platform handle *</STText>
      <TextInput
        value={platformHandle}
        onChangeText={setPlatformHandle}
        placeholder="Online ID / gamertag"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={s.input}
        autoCapitalize="none"
      />

      <STText style={s.label}>EA ID</STText>
      <TextInput
        value={eaId}
        onChangeText={setEaId}
        placeholder="Optional"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={s.input}
        autoCapitalize="none"
      />

      <STText style={s.label}>OVR *</STText>
      <TextInput
        value={String(overallRating)}
        onChangeText={(v) => setOverallRating(clampOvr(v))}
        keyboardType="number-pad"
        style={s.input}
      />

      <STText style={s.label}>Discord</STText>
      <TextInput
        value={discordHandle}
        onChangeText={setDiscordHandle}
        placeholder="Optional"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={s.input}
        autoCapitalize="none"
      />

      <STText style={s.label}>Notes</STText>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={[s.input, { minHeight: 72, textAlignVertical: 'top' }]}
        multiline
      />

      {error ? <STText style={s.error}>{error}</STText> : null}

      <TouchableOpacity onPress={submitClaim} disabled={saving} style={[s.primaryBtn, saving && { opacity: 0.55 }]}>
        {saving ? <ActivityIndicator color="#0d2461" /> : <STText style={s.primaryBtnText}>Submit claim</STText>}
      </TouchableOpacity>
      <TouchableOpacity onPress={skipForNow} disabled={saving} style={s.ghostBtn}>
        <STText style={s.ghostBtnText}>Skip for now</STText>
      </TouchableOpacity>
    </View>
  );
}
