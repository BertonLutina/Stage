import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  Image,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../../utils/api';
import useAuthStore from '../../store/authStore';
import ChatMessageBubble from '../../components/chat/ChatMessageBubble';
import ChatAttachmentMenu from '../../components/chat/ChatAttachmentMenu';
import CreatePollModal from '../../components/chat/CreatePollModal';
import {
  GamerProfileShell,
  AMBER,
} from '@/components/profile/gamer/GamerProfileUI';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_URL = api.defaults.baseURL;

const QUICK_REPLIES = ["I'm in", "Can't make it", 'On my way', 'Need a sub'];

function buildChatParams(search, activeFilters) {
  const params = {};
  if (search?.trim()) params.search = search.trim();
  const filters = activeFilters.filter((f) => f !== 'all' && f !== 'unread');
  if (filters.length) params.filter = filters.join(',');
  if (activeFilters.includes('unread')) params.unread = 'true';
  return params;
}

function HeaderIcon({ name, onPress, label }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={styles.headerIconBtn}
    >
      <Ionicons name={name} size={22} color="#fff" />
    </TouchableOpacity>
  );
}

export default function TeamChatScreen() {
  const { teamId, teamName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [team, setTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilters] = useState(['all']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [createPollVisible, setCreatePollVisible] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!teamId) return;
    api.get(`/teams/${teamId}`).then((r) => setTeam(r.data?.data || null)).catch(() => setTeam(null));
  }, [teamId]);

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

  const memberLine = useMemo(() => {
    const names = (team?.players || [])
      .map((p) => p.gamer_tag || p.gamertag || p.first_name)
      .filter(Boolean);
    if (!names.length) return socketConnected ? 'Live' : 'Team channel';
    const shown = names.slice(0, 3).join(', ');
    const extra = names.length > 3 ? ` +${names.length - 3}` : '';
    return socketConnected ? `Live · ${shown}${extra}` : `${shown}${extra}`;
  }, [team, socketConnected]);

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

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets?.[0]?.uri) {
      uploadAndSend(result.assets[0].uri, 'photo');
    }
  };

  const handleAttachmentSelect = async (key) => {
    switch (key) {
      case 'camera':
        await launchCamera();
        break;
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
      case 'poll':
        setAttachmentMenuVisible(false);
        setCreatePollVisible(true);
        break;
      case 'file':
      case 'audio':
      case 'gif':
      case 'sticker':
      case 'contact':
        Alert.alert('Coming soon', 'This attachment type will be available in a future update.');
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
    socketRef.current?.emit('send_message', {
      teamId,
      user_id: user.id,
      gamer_tag: user.gamer_tag || user.email?.split('@')[0] || 'Anonymous',
      content: trimmed,
      message_type: messageType,
      media_url: isLink ? trimmed : null,
    });
    setText('');
  };

  const onMicOrSend = () => {
    if (text.trim()) {
      send();
      return;
    }
    Alert.alert('Coming soon', 'Voice notes will be available in a future update.');
  };

  const title = team?.club_name || teamName || 'Team Chat';
  const avatar = team?.logo_url || team?.avatar;

  const comingSoonCall = (kind) => () => {
    Alert.alert('Coming soon', `${kind} will be available in a future update.`);
  };

  return (
    <GamerProfileShell>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.headerIconBtn}
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerIdentity}>
            <View style={styles.headerAvatar}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.headerAvatarImg} />
              ) : (
                <Ionicons name="shield" size={16} color={AMBER} />
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>{memberLine}</Text>
            </View>
          </View>

          <HeaderIcon name="videocam" label="Video call" onPress={comingSoonCall('Video calls')} />
          <HeaderIcon name="call" label="Voice call" onPress={comingSoonCall('Voice calls')} />
          <HeaderIcon
            name="ellipsis-vertical"
            label="More"
            onPress={() => setShowSearch((v) => !v)}
          />
        </View>

        {showSearch ? (
          <View style={styles.searchSection}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.45)" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search messages"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.searchInput}
              autoFocus
            />
          </View>
        ) : null}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          style={styles.keyboardView}
        >
          {loading && messages.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="chatbubbles-outline" size={40} color="rgba(255,214,10,0.4)" />
              <Text style={styles.emptyText}>Loading chat…</Text>
            </View>
          ) : error && messages.length === 0 && !search ? (
            <View style={styles.centered}>
              <Ionicons name="lock-closed-outline" size={40} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => String(item.id)}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
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
                <View style={styles.centered}>
                  <Ionicons name="chatbubble-ellipses-outline" size={40} color="rgba(255,255,255,0.28)" />
                  <Text style={styles.emptyText}>
                    {search ? 'No matching messages' : 'No messages yet. Say hi to your team!'}
                  </Text>
                </View>
              }
            />
          )}

          {showQuickReplies ? (
            <View style={styles.quickReplyList}>
              {QUICK_REPLIES.map((reply) => (
                <TouchableOpacity
                  key={reply}
                  onPress={() => {
                    setText(reply);
                    setShowQuickReplies(false);
                    inputRef.current?.focus();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={reply}
                  style={styles.quickReplyOption}
                >
                  <Text style={styles.quickReplyOptionText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={styles.composerWrap}>
            <View style={styles.inputCard}>
              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder="Message"
                placeholderTextColor="rgba(255,255,255,0.38)"
                style={styles.textInput}
                onSubmitEditing={send}
                returnKeyType="send"
                multiline
                maxLength={1000}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  onPress={() => setShowQuickReplies((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel="Quick reply"
                  style={styles.quickReplyChip}
                >
                  <Ionicons name="add" size={16} color="rgba(255,255,255,0.75)" />
                  <Text style={styles.quickReplyChipText}>Quick reply</Text>
                </TouchableOpacity>
                <View style={styles.inputActionIcons}>
                  <TouchableOpacity
                    onPress={() => inputRef.current?.focus()}
                    accessibilityRole="button"
                    accessibilityLabel="Emoji"
                    style={styles.pillIcon}
                  >
                    <Ionicons name="happy-outline" size={22} color="rgba(255,255,255,0.62)" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAttachmentMenuVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Attach"
                    style={styles.pillIcon}
                  >
                    <Ionicons name="attach" size={22} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={launchCamera}
                    accessibilityRole="button"
                    accessibilityLabel="Camera"
                    style={styles.pillIcon}
                  >
                    <Ionicons name="camera-outline" size={22} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={onMicOrSend}
              accessibilityRole="button"
              accessibilityLabel={text.trim() ? 'Send' : 'Voice note'}
              style={styles.actionBtn}
            >
              <Ionicons name={text.trim() ? 'send' : 'mic'} size={20} color="#1A1200" />
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
    </GamerProfileShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(8,12,24,0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,214,10,0.18)',
    gap: 2,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    marginRight: 4,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#101827',
    borderWidth: 1,
    borderColor: 'rgba(255,214,10,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarImg: { width: 36, height: 36 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  headerSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 1 },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 8 },
  keyboardView: { flex: 1 },
  messageList: { paddingVertical: 10, paddingBottom: 8, flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 12, textAlign: 'center' },
  composerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  inputCard: {
    flex: 1,
    backgroundColor: '#12182A',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  textInput: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 4,
    minHeight: 28,
    maxHeight: 96,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  quickReplyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  quickReplyChipText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '600',
  },
  inputActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickReplyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  quickReplyOption: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,214,10,0.35)',
    backgroundColor: 'rgba(255,214,10,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  quickReplyOptionText: {
    color: AMBER,
    fontSize: 13,
    fontWeight: '700',
  },
});
