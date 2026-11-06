import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { Button, TextField } from '@/components/ui';
import { stageClient } from '../../api/stageClient';
import { FormError, OnboardingSelect, StepHeading, TextLink } from './OnboardingParts';
import { STEP_GAP } from './onboardingStyles';

const PLATFORMS = ['PlayStation', 'Xbox', 'PC', 'EA', 'Discord'];

export default function IdentityClaimSetup({ player, onComplete }) {
  const tokens = useThemeStore((st) => st.tokens);
  const [claim, setClaim] = useState(null);
  const [platform, setPlatform] = useState(player?.platform || 'PlayStation');
  const [platformHandle, setPlatformHandle] = useState(player?.gamertag || '');
  const [eaId, setEaId] = useState('');
  const [overallRating, setOverallRating] = useState(
    Number(player?.overall_rating) > 0 ? Number(player.overall_rating) : 70
  );
  const [discordHandle, setDiscordHandle] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const platformOptions = useMemo(
    () => PLATFORMS.map((item) => ({ id: item, label: item })),
    [],
  );

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
        <ActivityIndicator color={tokens.cyan} />
      </View>
    );
  }

  if (Number(player?.is_verified) === 1 || claim?.status === 'pending' || claim?.status === 'approved') {
    return (
      <View style={{ gap: STEP_GAP }}>
        <StepHeading
          title={Number(player?.is_verified) === 1 || claim?.status === 'approved'
            ? 'You are verified'
            : 'Claim is in'}
          subtitle={Number(player?.is_verified) === 1 || claim?.status === 'approved'
            ? 'Your player identity is linked.'
            : 'STAGE will review it. You can keep going now.'}
        />
        <Button title="Continue" onPress={() => onComplete?.(claim)} />
      </View>
    );
  }

  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading
        title="Prove it is you"
        subtitle="Link the handle you play with. Skip if you want to do this later."
      />

      <OnboardingSelect
        label="Platform"
        value={platform}
        placeholder="Select platform"
        title="Platform"
        options={platformOptions}
        onChange={(id) => setPlatform(id)}
      />

      <TextField
        label="Online ID"
        value={platformHandle}
        onChangeText={setPlatformHandle}
        placeholder="PSN / Xbox / Steam / EA"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextField
        label="EA ID"
        value={eaId}
        onChangeText={setEaId}
        placeholder="Optional"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextField
        label="Your OVR"
        value={String(overallRating)}
        onChangeText={(v) => setOverallRating(clampOvr(v))}
        keyboardType="number-pad"
      />

      <TextField
        label="Discord"
        value={discordHandle}
        onChangeText={setDiscordHandle}
        placeholder="Optional"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {showNotes ? (
        <TextField
          label="Note for reviewers"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional"
          multiline
        />
      ) : (
        <TextLink title="Add a note" onPress={() => setShowNotes(true)} />
      )}

      <FormError>{error}</FormError>

      <Button title="Submit claim" onPress={submitClaim} loading={saving} />
      <TextLink title="Skip for now" onPress={skipForNow} disabled={saving} />
    </View>
  );
}
