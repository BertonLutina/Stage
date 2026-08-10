import React from 'react';
import { View, Text, TouchableOpacity, Image, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  groupInboxMessages,
  inboxMessageNeedsAction,
  inboxMessageIsActioned,
  inboxTypeLabel,
  senderInitials,
  previewSnippet,
  formatRelativeInboxTime,
} from '@/lib/inboxHelpers';
import { CYAN, AMBER } from '@/components/profile/gamer/GamerProfileUI';

const AVATAR_COLORS = ['#0EA5E9', '#22C55E', '#A855F7', '#F43F5E', '#F59E0B', '#14B8A6'];

function avatarColor(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * 17) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function StatusChip({ message }) {
  if (inboxMessageNeedsAction(message)) {
    return (
      <View style={styles.chipWarn}>
        <Text style={styles.chipWarnText}>Needs action</Text>
      </View>
    );
  }
  if (!inboxMessageIsActioned(message)) return null;
  const label = String(message.status || '').replace(/_/g, ' ');
  return (
    <View style={styles.chipMuted}>
      <Text style={styles.chipMutedText}>{label}</Text>
    </View>
  );
}

function MessageRow({ message, onPress }) {
  const unread = !message.is_read;
  const color = avatarColor(message.sender_gamertag || message.sender_email || message.id);
  const time = formatRelativeInboxTime(message.created_date);
  const sender = message.is_system ? 'STAGE' : (message.sender_gamertag || 'Unknown');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.row, unread && styles.rowUnread]}>
      <View style={{ position: 'relative' }}>
        {message.sender_avatar_url && !message.is_system ? (
          <Image source={{ uri: message.sender_avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: message.is_system ? 'rgba(0,232,255,0.18)' : color }]}>
            <Text style={styles.avatarText}>
              {message.is_system ? '⚡' : senderInitials(message)}
            </Text>
          </View>
        )}
        {unread ? <View style={styles.unreadDot} /> : null}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.topLine}>
          <Text style={[styles.sender, unread && styles.senderUnread]} numberOfLines={1}>{sender}</Text>
          <Text style={[styles.time, unread && { color: CYAN }]}>{time}</Text>
        </View>
        <Text style={[styles.subject, unread && styles.subjectUnread]} numberOfLines={1}>
          {message.subject || '(No subject)'}
        </Text>
        <Text style={styles.preview} numberOfLines={1}>
          {previewSnippet(message.body)}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          <View style={styles.chipType}>
            <Text style={styles.chipTypeText}>{inboxTypeLabel(message.message_type)}</Text>
          </View>
          <StatusChip message={message} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function InboxMessageList({ messages, onSelect, ListHeaderComponent, refreshControl }) {
  const sections = groupInboxMessages(messages).map((s) => ({
    title: s.label,
    data: s.messages,
  }));

  if (!messages.length) {
    return (
      <View style={styles.empty}>
        <Ionicons name="mail-outline" size={40} color="rgba(255,255,255,0.2)" />
        <Text style={styles.emptyTitle}>Your inbox is empty</Text>
        <Text style={styles.emptyHint}>Contract offers, match proposals, and club messages land here.</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      stickySectionHeadersEnabled={false}
      refreshControl={refreshControl}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={{ paddingBottom: 120 }}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionLabel}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <MessageRow message={item} onPress={() => onSelect?.(item)} />
      )}
    />
  );
}

const styles = {
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowUnread: {
    backgroundColor: 'rgba(0,232,255,0.05)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  unreadDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: CYAN,
    borderWidth: 2,
    borderColor: '#05070F',
  },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sender: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '700', flex: 1 },
  senderUnread: { color: '#fff', fontWeight: '900' },
  time: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '600' },
  subject: { color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 2 },
  subjectUnread: { color: '#fff', fontWeight: '800' },
  preview: { color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 3 },
  sectionLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  chipType: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,232,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,232,255,0.25)',
  },
  chipTypeText: { color: CYAN, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  chipWarn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,210,74,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,210,74,0.35)',
  },
  chipWarnText: { color: AMBER, fontSize: 10, fontWeight: '800' },
  chipMuted: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipMutedText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24, gap: 10 },
  emptyTitle: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 15 },
  emptyHint: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 18 },
};
