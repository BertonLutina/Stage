import React from 'react';
import { View, TouchableOpacity, Image, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import STText from '../common/STText';

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

export default function ChatMessageBubble({ item, isMe, baseUrl = '', onPollVote, currentUserId }) {
  const type = item.message_type || 'text';
  const meta = parseMetadata(item.media_metadata);
  const mediaUrl = item.media_url ? (item.media_url.startsWith('http') ? item.media_url : `${baseUrl}${item.media_url}`) : null;

  const renderContent = () => {
    switch (type) {
      case 'photo':
      case 'gif':
        if (!mediaUrl) return <STText className="text-muted">[Photo]</STText>;
        return (
          <Image source={{ uri: mediaUrl }} className="rounded-xl" style={{ width: 240, height: 180 }} resizeMode="cover" />
        );
      case 'video':
        if (!mediaUrl) return <STText className="text-muted">[Video]</STText>;
        return (
          <TouchableOpacity onPress={() => Linking.openURL(mediaUrl)}>
            <View className="rounded-xl overflow-hidden bg-black/50 w-48 h-32 items-center justify-center">
              <STText className="text-white font-semibold">▶ Play video</STText>
            </View>
          </TouchableOpacity>
        );
      case 'link':
        return (
          <TouchableOpacity onPress={() => Linking.openURL(mediaUrl || item.content)} className="rounded-xl border border-white/20 p-3 bg-white/5">
            <STText className="text-primary text-sm font-semibold">{meta.title || 'Link'}</STText>
            {meta.description && <STText className="text-muted text-xs mt-1">{meta.description}</STText>}
            <STText className="text-gray-500 text-xs mt-1">{item.content || mediaUrl}</STText>
          </TouchableOpacity>
        );
      case 'audio':
        return (
          <View className="flex-row items-center gap-2 py-2">
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <STText className="text-white font-bold">♪</STText>
            </View>
            <View>
              <STText className="text-white text-sm">{meta.duration ? `${meta.duration}s` : 'Voice note'}</STText>
              {mediaUrl && (
                <TouchableOpacity onPress={() => Linking.openURL(mediaUrl)}>
                  <STText className="text-primary text-xs">Tap to play</STText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      case 'document':
        return (
          <TouchableOpacity onPress={() => mediaUrl && Linking.openURL(mediaUrl)} className="flex-row items-center gap-2 py-2">
            <View className="w-10 h-10 rounded-lg bg-white/20 items-center justify-center">
              <STText className="text-white font-bold">📄</STText>
            </View>
            <View>
              <STText className="text-white text-sm">{meta.filename || 'Document'}</STText>
              {meta.size && <STText className="text-muted text-xs">{meta.size}</STText>}
            </View>
          </TouchableOpacity>
        );
      case 'sticker':
        if (!mediaUrl) return <STText className="text-muted">[Sticker]</STText>;
        return <Image source={{ uri: mediaUrl }} style={{ width: 80, height: 80 }} resizeMode="contain" />;
      case 'poll': {
        const options = meta.options || [];
        const multiple = !!meta.multiple;
        const totalVotes = options.reduce((s, o) => s + (o.votes || 0), 0);
        const maxVotes = Math.max(1, ...options.map((o) => o.votes || 0));

        return (
          <View style={pollStyles.container}>
            <STText style={pollStyles.question}>{item.content || meta.question || 'Poll'}</STText>
            {multiple && (
              <View style={pollStyles.hintRow}>
                <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.5)" />
                <STText style={pollStyles.hint}>Select one or more</STText>
              </View>
            )}
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
                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <STText style={pollStyles.optionText}>{opt.text || opt}</STText>
                    </View>
                    {votes > 0 && (
                      <STText style={pollStyles.voteCount}>{votes}</STText>
                    )}
                  </View>
                  <View style={pollStyles.progressBg}>
                    <View style={[pollStyles.progressFill, { width: `${pct}%` }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
            {totalVotes > 0 && (
              <STText style={pollStyles.viewVotes}>View votes</STText>
            )}
          </View>
        );
      }
      case 'contact':
        return (
          <View className="rounded-xl border border-white/20 p-3 bg-white/5">
            <STText className="text-white font-semibold">{meta.name || 'Contact'}</STText>
            {meta.phone && <STText className="text-muted text-sm">{meta.phone}</STText>}
          </View>
        );
      default:
        return <STText className={isMe ? 'text-dark' : 'text-white'}>{item.content || ''}</STText>;
    }
  };

  return (
    <View className={`mb-3 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
      <View className={`max-w-[85%] px-4 py-2 rounded-2xl ${isMe ? 'bg-primary' : 'bg-white/10 border border-white/10'}`}>
        {!isMe && (
          <STText className="text-primary text-xs font-semibold mb-0.5">{item.gamer_tag}</STText>
        )}
        {renderContent()}
        <STText className={`text-xs mt-1 ${isMe ? 'text-dark/70' : 'text-gray-400'}`}>
          {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </STText>
      </View>
    </View>
  );
}

const pollStyles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    minWidth: 220,
  },
  question: { color: '#fff', fontWeight: '600', fontSize: 15, marginBottom: 4 },
  hintRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  hint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 6 },
  optionRow: { marginBottom: 10 },
  optionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioSelected: {
    backgroundColor: 'rgba(95,227,232,0.8)',
    borderColor: '#5FE3E8',
  },
  optionText: { color: '#fff', fontSize: 14, flex: 1 },
  voteCount: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(95,227,232,0.6)',
    borderRadius: 2,
  },
  viewVotes: {
    color: '#22C55E',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
});
