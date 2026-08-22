import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { stageClient } from '@/api/stageClient';
import { FUT } from '@/components/dashboard/CommandCenterUI';
import {
  actorFromProfile,
  canConfirmMatchCancel,
  canRequestMatchCancel,
  canRequestMatchReschedule,
  isCancelPendingForActor,
  isPlayerManagedMatch,
} from '@/lib/matchFixtureLifecycle';

export default function GameDayFixtureActions({ game, user, myPlayer, myClub, isMyMatch, onGameUpdate }) {
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
    <View style={card}>
      <Text style={title}>FIXTURE</Text>
      {waiting ? (
        <Text style={{ color: FUT.gold, fontSize: 12, marginTop: 8 }}>
          Waiting for your opponent to confirm the cancel.
        </Text>
      ) : null}
      {canConfirm ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Action label="Confirm cancel" loading={loading === 'confirm_cancel'} onPress={() => invoke('confirm_cancel')} tone="bad" />
          <Action label="Keep match" loading={loading === 'decline_cancel'} onPress={() => invoke('decline_cancel')} tone="good" />
        </View>
      ) : null}
      {canReschedule && showReschedule ? (
        <View style={{ gap: 8, marginTop: 10 }}>
          <TextInput value={newDate} onChangeText={setNewDate} placeholder="YYYY-MM-DD" placeholderTextColor="rgba(255,255,255,0.35)" style={input} />
          <TextInput value={newTime} onChangeText={setNewTime} placeholder="HH:MM" placeholderTextColor="rgba(255,255,255,0.35)" style={input} />
          <Action
            label={loading === 'request_reschedule' ? 'Sending…' : 'Send proposal'}
            loading={loading === 'request_reschedule'}
            onPress={() => invoke('request_reschedule', { new_date: newDate, new_time: newTime })}
            tone="warn"
          />
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        {canReschedule && !showReschedule ? (
          <Action label="Change time" loading={false} onPress={() => setShowReschedule(true)} tone="warn" />
        ) : null}
        {canRequest ? (
          <Action label={loading === 'request_cancel' ? 'Sending…' : 'Cancel game'} loading={loading === 'request_cancel'} onPress={() => invoke('request_cancel')} tone="bad" />
        ) : null}
      </View>
      {error ? <Text style={{ color: FUT.rose, fontSize: 11, marginTop: 8 }}>{error}</Text> : null}
    </View>
  );
}

function Action({ label, loading, onPress, tone }) {
  const bg = tone === 'good' ? 'rgba(124,255,107,0.16)' : tone === 'bad' ? 'rgba(255,77,109,0.14)' : 'rgba(255,210,74,0.14)';
  const border = tone === 'good' ? 'rgba(124,255,107,0.4)' : tone === 'bad' ? 'rgba(255,77,109,0.35)' : 'rgba(255,210,74,0.4)';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={{ flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: bg, borderWidth: 1, borderColor: border }}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{label}</Text>}
    </TouchableOpacity>
  );
}

const card = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: 2,
  padding: 14,
};

const title = { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 };
const input = {
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
  borderRadius: 10,
  color: '#fff',
  paddingHorizontal: 10,
  paddingVertical: 8,
};
