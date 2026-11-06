import React from 'react';
import { View, Text, Pressable, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { Avatar, SectionLabel } from '@/components/ui';
import {
  groupInboxMessages,
  inboxMessageNeedsAction,
  inboxMessageIsActioned,
  inboxTypeLabel,
  senderInitials,
  previewSnippet,
  formatRelativeInboxTime,
} from '@/lib/inboxHelpers';

const AVATAR = 44;

/** Stage tag: 10px / 700 / uppercase, radius 6. `warn` is the amber "needs action" tag. */
function Tag({ label, tone = 'muted' }) {
  const tokens = useThemeStore((s) => s.tokens);
  const palette = {
    warn: { bg: tokens.warningBg, border: tokens.warningBorder, fg: tokens.warning },
    cyan: { bg: 'transparent', border: tokens.border, fg: tokens.cyan },
    muted: { bg: 'transparent', border: tokens.border, fg: tokens.muted },
  }[tone];
  return (
    <View
      style={{
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.bg,
        maxWidth: '100%',
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          color: palette.fg,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 10 * 0.08,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function StatusChip({ message }) {
  if (inboxMessageNeedsAction(message)) {
    return <Tag label="Needs action" tone="warn" />;
  }
  if (!inboxMessageIsActioned(message)) return null;
  const label = String(message.status || '').replace(/_/g, ' ');
  return <Tag label={label} tone="muted" />;
}

function MessageRow({ message, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  const unread = !message.is_read;
  const time = formatRelativeInboxTime(message.created_date);
  const sender = message.is_system ? 'STAGE' : (message.sender_gamertag || 'Unknown');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
        backgroundColor: pressed ? tokens.cardHi : 'transparent',
      })}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          marginTop: 6,
          backgroundColor: unread ? tokens.cyan : 'transparent',
        }}
      />
      {message.is_system ? (
        <View
          style={{
            width: AVATAR,
            height: AVATAR,
            borderRadius: 12,
            backgroundColor: tokens.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="flash-outline" size={22} color={tokens.cyanHi} />
        </View>
      ) : (
        <Avatar
          initials={senderInitials(message)}
          uri={message.sender_avatar_url}
          size={AVATAR}
        />
      )}

      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              color: unread ? tokens.text : tokens.textSoft,
              fontSize: 15,
              fontWeight: unread ? '700' : '600',
            }}
          >
            {sender}
          </Text>
          <Text style={{ color: unread ? tokens.cyan : tokens.muted, fontSize: 12 }}>{time}</Text>
        </View>
        <Text
          numberOfLines={1}
          style={{
            color: unread ? tokens.text : tokens.textSoft,
            fontSize: 14,
            fontWeight: unread ? '700' : '500',
          }}
        >
          {message.subject || '(No subject)'}
        </Text>
        <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 13 }}>
          {previewSnippet(message.body)}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          <Tag label={inboxTypeLabel(message.message_type)} tone="cyan" />
          <StatusChip message={message} />
        </View>
      </View>
    </Pressable>
  );
}

export default function InboxMessageList({ messages, onSelect, ListHeaderComponent, refreshControl }) {
  const tokens = useThemeStore((s) => s.tokens);
  const sections = groupInboxMessages(messages).map((s) => ({
    title: s.label,
    data: s.messages,
  }));

  if (!messages.length) {
    return (
      <View style={{ flex: 1, alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24, gap: 10 }}>
        <Ionicons name="mail-outline" size={40} color={tokens.muted} />
        <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }}>Your inbox is empty</Text>
        <Text style={{ color: tokens.muted, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
          Contract offers, match proposals, and club messages land here.
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      style={{ flex: 1 }}
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      stickySectionHeadersEnabled={false}
      refreshControl={refreshControl}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={{ paddingBottom: 24 }}
      renderSectionHeader={({ section }) => (
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 }}>
          <SectionLabel>{section.title}</SectionLabel>
        </View>
      )}
      renderItem={({ item }) => (
        <MessageRow message={item} onPress={() => onSelect?.(item)} />
      )}
    />
  );
}
