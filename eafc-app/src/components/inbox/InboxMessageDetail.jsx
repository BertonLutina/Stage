import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getEffectiveInboxActionType,
  inboxMessageNeedsAction,
  inboxMessageIsActioned,
  senderInitials,
  parseInboxMetadata,
  isMatchCancelRequest,
} from '@/lib/inboxHelpers';
import { deleteInboxMessage, respondToInboxMessage } from '@/lib/inboxData';
import DateTimeZoneFields from '@/components/matches/DateTimeZoneFields';
import { CYAN, AMBER } from '@/components/profile/gamer/GamerProfileUI';
import { FUT } from '@/components/dashboard/CommandCenterUI';

function formatFullDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function InboxMessageDetail({
  message,
  onDeleted,
  onStatusChanged,
  onBack,
}) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  if (!message) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.45)' }}>Message unavailable</Text>
      </View>
    );
  }

  const status = message.status || 'pending';
  const effectiveActionType = getEffectiveInboxActionType(message);
  const hasAction = inboxMessageNeedsAction(message);
  const isActioned = inboxMessageIsActioned(message);
  const meta = parseInboxMetadata(message);
  const isCancelRequest = isMatchCancelRequest(message);
  const showGenericActions = hasAction
    && !['contract_offer', 'trial_request', 'league_schedule'].includes(message.message_type);
  const showContractActions = hasAction && message.message_type === 'contract_offer';
  const showScheduleActions = hasAction && message.message_type === 'league_schedule';
  const showTrialActions = hasAction && message.message_type === 'trial_request';

  const runAction = async (action) => {
    if (action === 'date_change_requested' && !showReschedule) {
      setShowReschedule(true);
      return;
    }
    setLoading(action);
    setError('');
    try {
      await respondToInboxMessage(message, action, { newDate, newTime });
      onStatusChanged?.(message.id, action);
    } catch (err) {
      setError(err?.message || 'Action failed');
    } finally {
      setLoading(null);
      setShowReschedule(false);
    }
  };

  const onDelete = () => {
    const doDelete = async () => {
      try {
        await deleteInboxMessage(message.id);
        onDeleted?.(message.id);
      } catch (err) {
        setError(err?.message || 'Delete failed');
      }
    };
    if (hasAction) {
      Alert.alert(
        'Delete without responding?',
        'This message still needs a response. Delete anyway?',
        [
          { text: 'Keep', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ],
      );
      return;
    }
    Alert.alert('Delete message?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onDelete} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.65)" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.subject}>{message.subject || '(No subject)'}</Text>

        <View style={styles.senderBlock}>
          {message.sender_avatar_url && !message.is_system ? (
            <Image source={{ uri: message.sender_avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: message.is_system ? 'rgba(0,232,255,0.2)' : '#0EA5E9' }]}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>
                {message.is_system ? '⚡' : senderInitials(message)}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.senderName}>
              {message.is_system ? 'STAGE' : (message.sender_gamertag || 'Unknown')}
            </Text>
            <Text style={styles.toLine}>
              To you{message.sender_club_name ? ` · ${message.sender_club_name}` : ''}
            </Text>
          </View>
          <Text style={styles.date}>{formatFullDate(message.created_date)}</Text>
        </View>

        {hasAction ? (
          <View style={styles.warnBanner}>
            <Ionicons name="warning" size={16} color={AMBER} />
            <Text style={styles.warnText}>A response is required</Text>
          </View>
        ) : null}

        {isActioned ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusText}>{String(status).replace(/_/g, ' ')}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.bodyCard}>
          <Text style={styles.body}>{message.body || ''}</Text>
          {message.related_entity_type === 'match' ? (
            <Text style={styles.linked}>Linked to a scheduled match — check Schedule for details.</Text>
          ) : null}
          {message.message_type === 'league_schedule' && meta.proposed_date ? (
            <Text style={styles.metaLine}>
              Proposed: {formatFullDate(meta.proposed_date)}
              {meta.match_context ? `\n${meta.match_context}` : ''}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {(showGenericActions || showContractActions || showScheduleActions || showTrialActions) ? (
        <View style={styles.actionBar}>
          {showReschedule ? (
            <View style={{ gap: 8, marginBottom: 10 }}>
              <DateTimeZoneFields
                date={newDate}
                time={newTime}
                onDateChange={setNewDate}
                onTimeChange={setNewTime}
                showTimezone={false}
              />
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => runAction(showScheduleActions ? 'date_change_requested' : 'date_change_requested')}
                disabled={!!loading || !newDate || !newTime}
              >
                {loading === 'date_change_requested' ? (
                  <ActivityIndicator color="#031018" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Send new time</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(showGenericActions || showContractActions || showScheduleActions || showTrialActions) ? (
              <>
                <ActionBtn
                  label={isCancelRequest ? 'Confirm cancel' : (showScheduleActions ? 'Accept time' : 'Accept')}
                  tone="good"
                  loading={loading === 'accepted' || loading === 'confirmed'}
                  onPress={() => runAction(showScheduleActions ? 'confirmed' : 'accepted')}
                />
                <ActionBtn
                  label={isCancelRequest ? 'Keep match' : 'Decline'}
                  tone="bad"
                  loading={loading === 'declined'}
                  onPress={() => runAction('declined')}
                />
              </>
            ) : null}
            {(showGenericActions && effectiveActionType === 'accept_decline_date')
              || (showScheduleActions && effectiveActionType === 'schedule_accept_propose') ? (
              <ActionBtn
                label="Propose time"
                tone="warn"
                loading={false}
                onPress={() => setShowReschedule(true)}
              />
            ) : null}
            {showGenericActions && effectiveActionType === 'confirm' ? (
              <ActionBtn
                label="Confirm"
                tone="good"
                loading={loading === 'confirmed'}
                onPress={() => runAction('confirmed')}
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ActionBtn({ label, tone, loading, onPress }) {
  const bg = tone === 'good'
    ? 'rgba(124,255,107,0.18)'
    : tone === 'bad'
      ? 'rgba(255,77,109,0.16)'
      : 'rgba(255,210,74,0.14)';
  const border = tone === 'good'
    ? 'rgba(124,255,107,0.45)'
    : tone === 'bad'
      ? 'rgba(255,77,109,0.4)'
      : 'rgba(255,210,74,0.4)';
  const color = tone === 'good' ? FUT.lime : tone === 'bad' ? FUT.rose : AMBER;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!!loading}
      style={[styles.btn, { backgroundColor: bg, borderColor: border }]}
    >
      {loading ? <ActivityIndicator color={color} /> : (
        <Text style={{ color, fontWeight: '900', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = {
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  subject: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    lineHeight: 28,
  },
  senderBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  senderName: { color: '#fff', fontWeight: '800', fontSize: 14 },
  toLine: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  date: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  warnBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,210,74,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,210,74,0.3)',
  },
  warnText: { color: AMBER, fontWeight: '800', fontSize: 12 },
  statusBanner: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statusText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,77,109,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.35)',
  },
  errorText: { color: FUT.rose, fontSize: 12, fontWeight: '700' },
  bodyCard: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,232,255,0.18)',
    backgroundColor: 'rgba(10,18,34,0.9)',
  },
  body: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22 },
  linked: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 14, lineHeight: 18 },
  metaLine: { color: CYAN, fontSize: 12, marginTop: 14, lineHeight: 18, fontWeight: '600' },
  actionBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,210,74,0.25)',
    backgroundColor: 'rgba(8,10,18,0.98)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  btn: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: CYAN,
    borderColor: CYAN,
  },
  btnPrimaryText: { color: '#031018', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
};
