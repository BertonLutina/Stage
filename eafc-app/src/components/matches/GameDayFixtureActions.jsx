import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { Button, Card, SectionLabel, TextField } from '@/components/ui';
import {
  actorFromProfile,
  canConfirmMatchCancel,
  canRequestMatchCancel,
  canRequestMatchReschedule,
  isCancelPendingForActor,
  isPlayerManagedMatch,
} from '@/lib/matchFixtureLifecycle';

export default function GameDayFixtureActions({ game, user, myPlayer, myClub, isMyMatch, onGameUpdate }) {
  const tokens = useThemeStore((st) => st.tokens);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  if (!isMyMatch || !isPlayerManagedMatch(game)) return null;

  const actor = actorFromProfile({ user, player: myPlayer, club: myClub });
  const canRequest = canRequestMatchCancel(game, actor);
  const canConfirm = canConfirmMatchCancel(game, actor);
  const waiting = isCancelPendingForActor(game, actor);
  const canReschedule = canRequestMatchReschedule(game, actor);

  if (!canRequest && !canConfirm && !waiting && !canReschedule) return null;

  const invoke = async (action, extra = {}) => {
    setLoading(action);
    setError('');
    try {
      await stageClient.functions.invoke('matchFixtureActions', {
        action,
        match_id: game.id,
        ...extra,
      });
      if (action === 'request_cancel') {
        onGameUpdate?.({ ...game, cancel_status: 'pending', cancel_requested_by: actor.email });
      } else if (action === 'confirm_cancel') {
        onGameUpdate?.({ ...game, status: 'cancelled', cancel_status: null, cancel_requested_by: null });
      } else if (action === 'decline_cancel') {
        onGameUpdate?.({ ...game, cancel_status: null, cancel_requested_by: null });
      }
      setShowReschedule(false);
    } catch (err) {
      setError(err?.message || 'Action failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card style={{ gap: 12 }}>
      <SectionLabel>FIXTURE</SectionLabel>
      {waiting ? (
        <Text style={{ color: tokens.warning, fontSize: 13 }}>
          Waiting for your opponent to confirm the cancel.
        </Text>
      ) : null}
      {canConfirm ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Action label="Confirm cancel" loading={loading === 'confirm_cancel'} onPress={() => invoke('confirm_cancel')} tone="bad" />
          <Action label="Keep match" loading={loading === 'decline_cancel'} onPress={() => invoke('decline_cancel')} tone="good" />
        </View>
      ) : null}
      {canReschedule && showReschedule ? (
        <View style={{ gap: 10 }}>
          <TextField
            accessibilityLabel="New date"
            value={newDate}
            onChangeText={setNewDate}
            placeholder="YYYY-MM-DD"
          />
          <TextField
            accessibilityLabel="New time"
            value={newTime}
            onChangeText={setNewTime}
            placeholder="HH:MM"
          />
          <Action
            label={loading === 'request_reschedule' ? 'Sending…' : 'Send proposal'}
            loading={loading === 'request_reschedule'}
            onPress={() => invoke('request_reschedule', { new_date: newDate, new_time: newTime })}
            tone="good"
            inRow={false}
          />
        </View>
      ) : null}
      {(canReschedule && !showReschedule) || canRequest ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {canReschedule && !showReschedule ? (
            <Action label="Change time" loading={false} onPress={() => setShowReschedule(true)} tone="warn" />
          ) : null}
          {canRequest ? (
            <Action label={loading === 'request_cancel' ? 'Sending…' : 'Cancel game'} loading={loading === 'request_cancel'} onPress={() => invoke('request_cancel')} tone="bad" />
          ) : null}
        </View>
      ) : null}
      {error ? <Text style={{ color: tokens.danger, fontSize: 12 }}>{error}</Text> : null}
    </Card>
  );
}

/** good = main action (filled), warn = neutral (outlined), bad = destructive (red outline). */
function Action({ label, loading, onPress, tone, inRow = true }) {
  const variant = tone === 'bad' ? 'danger' : tone === 'warn' ? 'secondary' : 'primary';
  return (
    <View style={inRow ? { flex: 1, minWidth: 0 } : undefined}>
      <Button title={label} variant={variant} loading={loading} onPress={onPress} />
    </View>
  );
}
