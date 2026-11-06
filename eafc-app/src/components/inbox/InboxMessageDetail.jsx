import React, { useState } from 'react';
import {
  View, Text, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { Avatar, Button, Card, IconButton } from '@/components/ui';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import {
  getEffectiveInboxActionType,
  inboxTypeLabel,
  inboxMessageNeedsAction,
  inboxMessageIsActioned,
  senderInitials,
  parseInboxMetadata,
  isMatchCancelRequest,
} from '@/lib/inboxHelpers';
import { deleteInboxMessage, respondToInboxMessage } from '@/lib/inboxData';
import DateTimeZoneFields from '@/components/matches/DateTimeZoneFields';
import InboxLoanCard from '@/components/inbox/InboxLoanCard';

const LOAN_TYPES = ['loan_proposal', 'loan_early_end', 'loan_purchase', 'loan_recalled', 'loan_terminated_early'];

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
  const tokens = useThemeStore((st) => st.tokens);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  if (!message) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: tokens.muted }}>Message unavailable</Text>
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
    && !['contract_offer', 'trial_request', 'league_schedule', ...LOAN_TYPES].includes(message.message_type);
  const showLoanCard = LOAN_TYPES.includes(message.message_type);
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

  const senderName = message.is_system ? 'STAGE' : (message.sender_gamertag || 'Unknown');
  const showActions = showGenericActions || showContractActions || showScheduleActions || showTrialActions;

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <IconButton icon="arrow-back" accessibilityLabel="Back" onPress={onBack} />
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            textAlign: 'center',
            color: tokens.muted,
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 11 * 0.12,
            textTransform: 'uppercase',
          }}
        >
          {inboxTypeLabel(message.message_type)}
        </Text>
        <IconButton icon="trash-outline" accessibilityLabel="Delete message" onPress={onDelete} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 16, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {message.is_system ? (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: tokens.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="flash-outline" size={26} color={tokens.cyanHi} />
            </View>
          ) : (
            <Avatar
              initials={senderInitials(message)}
              uri={message.sender_avatar_url}
              size={56}
            />
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: '700', fontSize: 16 }}>
              {senderName}
            </Text>
            <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 13, marginTop: 2 }}>
              To you{message.sender_club_name ? ` · ${message.sender_club_name}` : ''}
            </Text>
            <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>
              {formatFullDate(message.created_date)}
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={4}
          style={{
            color: tokens.text,
            fontFamily: FONT_EA_SPORTS,
            fontSize: 30,
            lineHeight: 32,
            letterSpacing: 30 * 0.03,
            textTransform: 'uppercase',
          }}
        >
          {message.subject || '(No subject)'}
        </Text>

        {hasAction ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 16,
              borderRadius: tokens.cardRadius,
              borderWidth: 1,
              borderColor: tokens.warningBorder,
              backgroundColor: tokens.warningBg,
            }}
          >
            <Ionicons name="alert-circle-outline" size={22} color={tokens.warning} />
            <Text style={{ flex: 1, color: tokens.text, fontSize: 13 }}>A response is required</Text>
          </View>
        ) : null}

        {isActioned ? (
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: tokens.border,
              backgroundColor: tokens.card,
            }}
          >
            <Text
              style={{
                color: tokens.textSoft,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 11 * 0.08,
                textTransform: 'uppercase',
              }}
            >
              {String(status).replace(/_/g, ' ')}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.danger,
              backgroundColor: tokens.dangerBg,
            }}
          >
            <Text style={{ color: tokens.danger, fontSize: 13, fontWeight: '600' }}>{error}</Text>
          </View>
        ) : null}

        <Card>
          <Text style={{ color: tokens.textSoft, fontSize: 15, lineHeight: 23 }}>{message.body || ''}</Text>
          {showLoanCard ? (
            <InboxLoanCard
              message={message}
              onActioned={(action) => onStatusChanged?.(message.id, action)}
            />
          ) : null}
          {message.related_entity_type === 'match' ? (
            <Text style={{ color: tokens.muted, fontSize: 13, marginTop: 14, lineHeight: 18 }}>
              Linked to a scheduled match — check Schedule for details.
            </Text>
          ) : null}
          {message.message_type === 'league_schedule' && meta.proposed_date ? (
            <Text style={{ color: tokens.cyan, fontSize: 13, marginTop: 14, lineHeight: 18, fontWeight: '600' }}>
              Proposed: {formatFullDate(meta.proposed_date)}
              {meta.match_context ? `\n${meta.match_context}` : ''}
            </Text>
          ) : null}
        </Card>
      </ScrollView>

      {showActions ? (
        <View style={{ paddingTop: 12, gap: 10 }}>
          {showReschedule ? (
            <View style={{ gap: 8 }}>
              <DateTimeZoneFields
                date={newDate}
                time={newTime}
                onDateChange={setNewDate}
                onTimeChange={setNewTime}
                showTimezone={false}
              />
              <Button
                title="Send new time"
                loading={loading === 'date_change_requested'}
                disabled={!!loading || !newDate || !newTime}
                onPress={() => runAction(showScheduleActions ? 'date_change_requested' : 'date_change_requested')}
              />
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {showActions ? (
              <>
                <ActionBtn
                  label={isCancelRequest ? 'Keep match' : 'Decline'}
                  tone="bad"
                  loading={loading === 'declined'}
                  onPress={() => runAction('declined')}
                />
                <ActionBtn
                  label={isCancelRequest ? 'Confirm cancel' : (showScheduleActions ? 'Accept time' : 'Accept')}
                  tone="good"
                  loading={loading === 'accepted' || loading === 'confirmed'}
                  onPress={() => runAction(showScheduleActions ? 'confirmed' : 'accepted')}
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

/** good = primary cyan, bad = danger outline, warn = cyan outline; each takes an equal share of the row. */
function ActionBtn({ label, tone, loading, onPress }) {
  const variant = tone === 'good' ? 'primary' : tone === 'bad' ? 'danger' : 'secondary';
  return (
    <View style={{ flexGrow: 1, flexBasis: '45%' }}>
      <Button title={label} variant={variant} loading={!!loading} onPress={onPress} />
    </View>
  );
}
