import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../../utils/api';
import STText from '../../components/common/STText';
import useAuthStore from '../../store/authStore';
import ChatMessageBubble from '../../components/chat/ChatMessageBubble';
import ChatAttachmentMenu from '../../components/chat/ChatAttachmentMenu';
import ChatFilterChips from '../../components/chat/ChatFilterChips';
import CreatePollModal from '../../components/chat/CreatePollModal';
import BackButton from '../../components/common/BackButton';
import GradientBackground from '../../components/common/GradientBackground';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_URL = api.defaults.baseURL;

function buildChatParams(search, activeFilters) {
  const params = {};
  if (search?.trim()) params.search = search.trim();
  const filters = activeFilters.filter((f) => f !== 'all' && f !== 'unread');
  if (filters.length) params.filter = filters.join(',');
  if (activeFilters.includes('unread')) params.unread = 'true';
  return params;
}

export default function TeamChatScreen() {
  const { teamId, teamName } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [createPollVisible, setCreatePollVisible] = useState(false);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const fetchChat = useCallback(() => {
    if (!teamId) return;
    setLoading(true);
    const params = buildChatParams(search, activeFilters);
    api
      .get(`/teams/${teamId}/chat`, { params })
      .then((r) => setMessages(r.data?.data ?? []))
      .catch((err) => {
        setError(err.response?.status === 403 ? 'You must be a team member to view chat' : 'Failed to load chat');
        setMessages([]);
      })
      .finally(() => setLoading(false));
  }, [teamId, search, activeFilters]);

  useEffect(() => {
    if (!teamId) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(fetchChat, 300);
    return () => clearTimeout(searchDebounceRef.current);
  }, [teamId, search, activeFilters, fetchChat]);

  useEffect(() => {
    if (!teamId) return;
    const socket = io(`${SOCKET_URL}/team-chat`);
    socketRef.current = socket;
    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_team', teamId);
    });
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('new_message', (data) => {
      setMessages((prev) => [...prev, { ...data, id: data.id || `m-${Date.now()}` }]);
    });
    socket.on('poll_updated', (data) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.id ? { ...m, ...data } : m))
      );
    });
    socket.on('chat_error', (data) => setError(data?.message));
    return () => {
      socket.emit('leave_team', teamId);
      socket.disconnect();
    };
  }, [teamId]);

  useEffect(() => {
    if (teamId && user) {
      api.post(`/teams/${teamId}/chat/read`).catch(() => {});
    }
  }, [teamId, user]);

  const toggleFilter = (key) => {
    setActiveFilters((prev) => {
      if (key === 'all') return ['all'];
      const next = prev.filter((f) => f !== 'all');
      if (next.includes(key)) {
        const filtered = next.filter((f) => f !== key);
        return filtered.length ? filtered : ['all'];
      }
      return [...next, key];
    });
  };

  const uploadAndSend = async (fileUri, messageType, metadata = {}, mimeType = 'image/jpeg', fileName = 'chat-media.jpg') => {
    if (!user) return;
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    });
    try {
      const { data } = await api.post('/uploads/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data?.data?.url;
      if (!url) throw new Error('No URL returned');
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
      socketRef.current?.emit('send_message', {
        teamId,
        user_id: user.id,
        gamer_tag: user.gamer_tag || user.email?.split('@')[0] || 'Anonymous',
        content: '',
        message_type: messageType,
        media_url: fullUrl,
        media_metadata: metadata,
      });
    } catch (err) {
      setError('Failed to upload. Try again.');
    }
  };

  const handleAttachmentSelect = async (key) => {
    switch (key) {
      case 'camera': {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera access is required.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
        if (!result.canceled && result.assets?.[0]?.uri) {
          uploadAndSend(result.assets[0].uri, 'photo');
        }
        break;
      }
      case 'gallery': {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Photo library access is required.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsMultipleSelection: false,
        });
        if (!result.canceled && result.assets?.[0]) {
          const asset = result.assets[0];
          const isVideo = asset.type === 'video' || asset.uri?.match(/\.(mp4|mov|webm)$/i);
          const isGif = asset.uri?.match(/\.gif$/i);
          const type = isVideo ? 'video' : isGif ? 'gif' : 'photo';
          const mime = asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');
          const name = asset.fileName || (type === 'video' ? 'video.mp4' : 'photo.jpg');
          uploadAndSend(asset.uri, type, {}, mime, name);
        }
        break;
      }
      case 'file':
        Alert.alert('Coming soon', 'Document picker will be available in a future update.');
        break;
      case 'audio':
        Alert.alert('Coming soon', 'Voice recording will be available in a future update.');
        break;
      case 'gif':
      case 'sticker':
        Alert.alert('Coming soon', 'GIF and sticker pickers will be available in a future update.');
        break;
      case 'poll':
        setAttachmentMenuVisible(false);
        setCreatePollVisible(true);
        break;
      case 'contact':
        Alert.alert('Coming soon', 'Share contact will be available in a future update.');
        break;
      default:
        break;
    }
  };

  const sendPoll = (data) => {
    if (!user) return;
    socketRef.current?.emit('send_message', data);
  };

  const send = () => {
    if (!text.trim() || !user) return;
    const trimmed = text.trim();
    const isLink = /^https?:\/\//.test(trimmed);
    const messageType = isLink ? 'link' : 'text';
    const data = {
      teamId,
      user_id: user.id,
      gamer_tag: user.gamer_tag || user.email?.split('@')[0] || 'Anonymous',
      content: trimmed,
      message_type: messageType,
      media_url: isLink ? trimmed : null,
    };
    socketRef.current?.emit('send_message', data);
    setText('');
  };

  if (loading && messages.length === 0) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 items-center justify-center">
            <Ionicons name="chatbubbles-outline" size={48} color="rgba(95,227,232,0.5)" />
            <STText className="text-muted mt-3">Loading chat...</STText>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (error && messages.length === 0 && !search && activeFilters.length <= 1 && activeFilters[0] === 'all') {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="chatbubbles-outline" size={56} color="rgba(255,255,255,0.25)" />
            <STText className="text-white/70 text-center mt-4 text-base">{error}</STText>
            <View className="mt-8">
              <BackButton variant="light" />
            </View>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1  android:pb-8" edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton variant="light" />
          <View style={styles.headerCenter}>
            <STText style={styles.headerTitle}>{teamName || 'Team Chat'}</STText>
            {socketConnected && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <STText style={styles.liveText}>Live</STText>
              </View>
            )}
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search messages, media…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.searchInput}
          />
        </View>

        {/* Filter chips */}
{/*         <ChatFilterChips activeFilters={activeFilters} onToggle={toggleFilter} />
 */}
        {/* Messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.keyboardView}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={styles.messageList}
            showVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ChatMessageBubble
              item={item}
              isMe={item.user_id === user?.id}
              baseUrl={BASE_URL}
              onPollVote={(messageId, optionIndex) => {
                socketRef.current?.emit('poll_vote', {
                  messageId,
                  teamId,
                  optionIndex,
                  user_id: user?.id,
                });
              }}
              currentUserId={user?.id}
            />
          )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={40} color="rgba(255,255,255,0.3)" />
                <STText style={styles.emptyText}>
                  {search || (activeFilters.length && activeFilters[0] !== 'all')
                    ? 'No matching messages'
                    : 'No messages yet. Say hi to your team!'}
                </STText>
              </View>
            }
          />
          {/* Input bar */}
          <View style={styles.inputBar}>
            <TouchableOpacity onPress={() => setAttachmentMenuVisible(true)} style={styles.attachBtn}>
              <Ionicons name="add-circle-outline" size={28} color="#5FE3E8" />
            </TouchableOpacity>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message your team..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.textInput}
              onSubmitEditing={send}
              returnKeyType="send"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              onPress={send}
              disabled={!text.trim()}
              style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            >
              <Ionicons name="send" size={20} color="#02091B" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <ChatAttachmentMenu
          visible={attachmentMenuVisible}
          onClose={() => setAttachmentMenuVisible(false)}
          onSelect={handleAttachmentSelect}
        />

        <CreatePollModal
          visible={createPollVisible}
          onClose={() => setCreatePollVisible(false)}
          onSend={sendPoll}
          teamId={teamId}
          user={user}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 17 },
  headerSpacer: { width: 40 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 6 },
  liveText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 0,
  },
  keyboardView: { flex: 1 },
  messageList: { padding: 16, paddingBottom: 12, flexGrow: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 12 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(7,22,58,0.3)',
  },
  attachBtn: { padding: 4 },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5FE3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
