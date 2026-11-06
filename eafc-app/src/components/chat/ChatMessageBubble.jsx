import React, { useMemo } from 'react';
import { View, TouchableOpacity, Image, Linking, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { hexToRgba } from '@/lib/stageTheme';

function parseMetadata(meta) {
  if (!meta) return {};
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta);
    } catch {
      return {};
    }
  }
  return meta;
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatMessageBubble({ item, isMe, baseUrl = '', onPollVote, currentUserId, showSender = true }) {
  const tokens = useThemeStore((s) => s.tokens);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const pollStyles = useMemo(() => makePollStyles(tokens), [tokens]);
  const type = item.message_type || 'text';
  const meta = parseMetadata(item.media_metadata);
  const mediaUrl = item.media_url ? (item.media_url.startsWith('http') ? item.media_url : `${baseUrl}${item.media_url}`) : null;
  const time = formatTime(item.created_at || item.created_date);

  const renderContent = () => {
    switch (type) {
      case 'photo':
      case 'gif':
        if (!mediaUrl) return <Text style={styles.muted}>[Photo]</Text>;
        return (
          <Image source={{ uri: mediaUrl }} style={styles.photo} resizeMode="cover" />
        );
      case 'video':
        if (!mediaUrl) return <Text style={styles.muted}>[Video]</Text>;
        return (
          <TouchableOpacity onPress={() => Linking.openURL(mediaUrl)} style={styles.video}>
            <Ionicons name="play" size={28} color={tokens.text} />
            <Text style={styles.videoLabel}>Play video</Text>
          </TouchableOpacity>
        );
      case 'link':
        return (
          <TouchableOpacity onPress={() => Linking.openURL(mediaUrl || item.content)} style={styles.linkCard}>
            <Text style={styles.linkTitle}>{meta.title || 'Link'}</Text>
            {meta.description ? <Text style={styles.muted}>{meta.description}</Text> : null}
            <Text style={styles.linkUrl} numberOfLines={1}>{item.content || mediaUrl}</Text>
          </TouchableOpacity>
        );
      case 'audio':
        return (
          <View style={styles.audioRow}>
            <View style={styles.audioIcon}>
              <Ionicons name="mic" size={16} color={tokens.cyan} />
            </View>
            <View>
              <Text style={styles.body}>{meta.duration ? `${meta.duration}s` : 'Voice note'}</Text>
              {mediaUrl ? (
                <TouchableOpacity onPress={() => Linking.openURL(mediaUrl)}>
                  <Text style={styles.accentLink}>Tap to play</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        );
      case 'document':
        return (
          <TouchableOpacity onPress={() => mediaUrl && Linking.openURL(mediaUrl)} style={styles.audioRow}>
            <View style={styles.docIcon}>
              <Ionicons name="document-text" size={18} color={tokens.cyan} />
            </View>
            <View>
              <Text style={styles.body}>{meta.filename || 'Document'}</Text>
              {meta.size ? <Text style={styles.muted}>{meta.size}</Text> : null}
            </View>
          </TouchableOpacity>
        );
      case 'sticker':
        if (!mediaUrl) return <Text style={styles.muted}>[Sticker]</Text>;
        return <Image source={{ uri: mediaUrl }} style={{ width: 80, height: 80 }} resizeMode="contain" />;
      case 'poll': {
        const options = meta.options || [];
        const multiple = !!meta.multiple;
        const totalVotes = options.reduce((s, o) => s + (o.votes || 0), 0);
        const maxVotes = Math.max(1, ...options.map((o) => o.votes || 0));

        return (
          <View style={pollStyles.container}>
            <Text style={pollStyles.question}>{item.content || meta.question || 'Poll'}</Text>
            {multiple ? (
              <View style={pollStyles.hintRow}>
                <Ionicons name="checkmark-done" size={14} color={tokens.muted} />
                <Text style={pollStyles.hint}>Select one or more</Text>
              </View>
            ) : null}
            {options.map((opt, i) => {
              const votes = opt.votes || 0;
              const voters = opt.voters || [];
              const isSelected = currentUserId && voters.includes(currentUserId);
              const pct = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
              return (
                <TouchableOpacity
                  key={opt.id || i}
                  style={pollStyles.optionRow}
                  onPress={() => onPollVote && currentUserId && onPollVote(item.id, i)}
                  disabled={!onPollVote}
                >
                  <View style={pollStyles.optionTop}>
                    <View style={pollStyles.optionLeft}>
                      <View style={[pollStyles.radio, isSelected && pollStyles.radioSelected]}>
                        {isSelected ? <Ionicons name="checkmark" size={14} color={tokens.onCyan} /> : null}
                      </View>
                      <Text style={pollStyles.optionText}>{opt.text || opt}</Text>
                    </View>
                    {votes > 0 ? <Text style={pollStyles.voteCount}>{votes}</Text> : null}
                  </View>
                  <View style={pollStyles.progressBg}>
                    <View style={[pollStyles.progressFill, { width: `${pct}%` }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
            {totalVotes > 0 ? <Text style={pollStyles.viewVotes}>View votes</Text> : null}
          </View>
        );
      }
      case 'contact':
        return (
          <View style={styles.linkCard}>
            <Text style={styles.body}>{meta.name || 'Contact'}</Text>
            {meta.phone ? <Text style={styles.muted}>{meta.phone}</Text> : null}
          </View>
        );
      default:
        return <Text style={styles.body}>{item.content || ''}</Text>;
    }
  };

  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowThem]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        {!isMe && showSender ? (
          <Text style={styles.sender} numberOfLines={1}>{item.gamer_tag || 'Member'}</Text>
        ) : null}
        {renderContent()}
        <View style={styles.metaRow}>
          <Text style={styles.time}>{time}</Text>
          {isMe ? (
            <Ionicons name="checkmark-done" size={14} color={tokens.cyan} style={{ marginLeft: 4 }} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (tokens) => StyleSheet.create({
  row: { marginBottom: 6, flexDirection: 'row', paddingHorizontal: 8 },
  rowMe: { justifyContent: 'flex-end' },
  rowThem: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: hexToRgba(tokens.cyan, 0.16),
    borderWidth: 1,
    borderColor: hexToRgba(tokens.cyan, 0.32),
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: tokens.card,
    borderWidth: 1,
    borderColor: tokens.border,
    borderBottomLeftRadius: 4,
  },
  sender: {
    color: tokens.cyan,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  body: { color: tokens.text, fontSize: 15, lineHeight: 20 },
  muted: { color: tokens.muted, fontSize: 12, marginTop: 2 },
  photo: { width: 220, height: 164, borderRadius: 12, marginTop: 2 },
  video: {
    width: 200,
    height: 120,
    borderRadius: 12,
    backgroundColor: hexToRgba(tokens.bgDeep, 0.85),
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: { color: tokens.text, fontWeight: '700', marginTop: 6 },
  linkCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.border,
    backgroundColor: tokens.bgDeep,
    padding: 10,
    minWidth: 180,
  },
  linkTitle: { color: tokens.cyan, fontWeight: '700', fontSize: 13 },
  linkUrl: { color: tokens.muted, fontSize: 11, marginTop: 4 },
  accentLink: { color: tokens.cyan, fontSize: 12, marginTop: 2, fontWeight: '700' },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  audioIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: hexToRgba(tokens.cyan, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: hexToRgba(tokens.cyan, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  time: { color: tokens.muted, fontSize: 11 },
});

const makePollStyles = (tokens) => StyleSheet.create({
  container: { minWidth: 220, paddingVertical: 4 },
  question: { color: tokens.text, fontWeight: '700', fontSize: 15, marginBottom: 4 },
  hintRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  hint: { color: tokens.muted, fontSize: 12, marginLeft: 6 },
  optionRow: { marginBottom: 10 },
  optionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: tokens.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioSelected: {
    backgroundColor: tokens.cyan,
    borderColor: tokens.cyan,
  },
  optionText: { color: tokens.text, fontSize: 14, flex: 1 },
  voteCount: { color: tokens.muted, fontSize: 12 },
  progressBg: {
    height: 4,
    backgroundColor: tokens.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.cyan,
    borderRadius: 2,
    opacity: 0.7,
  },
  viewVotes: {
    color: tokens.cyan,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '700',
  },
});
