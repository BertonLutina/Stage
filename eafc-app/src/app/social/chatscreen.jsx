import React, { useEffect, useState, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import api, { SOCKET_URL } from '../../utils/api';
import useAuthStore from '../../store/authStore';
import ChatMessageBubble from '../../components/chat/ChatMessageBubble';
import ChatAttachmentMenu from '../../components/chat/ChatAttachmentMenu';
import {
  GamerProfileShell,
  AMBER,
} from '@/components/profile/gamer/GamerProfileUI';

const BASE_URL = api.defaults.baseURL;
const QUICK_REPLIES = ["Let's play", "I'm in", 'Give me 5', 'GG'];

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

export default function ChatScreen() {
  const { userId: otherUserId, name: paramName, avatar: paramAvatar } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [peer, setPeer] = useState({
    name: paramName || 'Player',
    avatar: paramAvatar || '',
  });
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!otherUserId) return undefined;
    let cancelled = false;
    setLoading(true);
    api.get(`/social/messages/${otherUserId}`)
      .then((r) => {
        if (!cancelled) setMessages(r.data?.data || []);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load chat');
          setMessages([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const socket = io(`${SOCKET_URL}/dm`);
    socketRef.current = socket;
    const roomId = [user?.id, otherUserId].sort().join('_');
    socket.emit('join_room', roomId);
    socket.on('new_message', (msg) => setMessages((prev) => [...prev, msg]));
    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [otherUserId, user?.id]);

  useEffect(() => {
    if (paramName) {
      setPeer((prev) => ({ ...prev, name: paramName, avatar: paramAvatar || prev.avatar }));
    }
  }, [paramName, paramAvatar]);

  const uploadAndSend = async (fileUri, messageType = 'photo', mimeType = 'image/jpeg', fileName = 'photo.jpg') => {
    if (!user) return;
    const formData = new FormData();
    formData.append('file', { uri: fileUri, type: mimeType, name: fileName });
    try {
      const { data } = await api.post('/uploads/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data?.data?.url;
      if (!url) throw new Error('No URL returned');
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
      const payload = {
        receiver_id: otherUserId,
        content: '',
        message_type: messageType,
        media_url: fullUrl,
      };
      const res = await api.post('/social/messages', payload);
      const saved = res.data.data;
      socketRef.current?.emit('send_message', { ...saved, sender_id: user.id, receiver_id: otherUserId });
      setMessages((prev) => [...prev, { ...saved, sender_id: user.id, receiver_id: otherUserId }]);
    } catch {
      Alert.alert('Upload failed', 'Could not send image.');
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
          const mime = asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');
          const name = asset.fileName || (isVideo ? 'video.mp4' : 'photo.jpg');
          uploadAndSend(asset.uri, isVideo ? 'video' : 'photo', mime, name);
        }
        break;
      }
      default:
        Alert.alert('Coming soon', 'This attachment type will be available in a future update.');
        break;
    }
  };

  const send = async () => {
    if (!text.trim() || !user) return;
    const payload = { receiver_id: otherUserId, content: text.trim() };
    try {
      const res = await api.post('/social/messages', payload);
      const saved = res.data.data;
      socketRef.current?.emit('send_message', { ...saved, sender_id: user.id, receiver_id: otherUserId });
      setMessages((prev) => [...prev, { ...saved, sender_id: user.id, receiver_id: otherUserId }]);
    } catch {
      socketRef.current?.emit('send_message', { sender_id: user.id, receiver_id: otherUserId, content: text.trim() });
      setMessages((prev) => [...prev, { sender_id: user.id, receiver_id: otherUserId, content: text.trim() }]);
    }
    setText('');
  };

  const onMicOrSend = () => {
    if (text.trim()) {
      send();
      return;
    }
    Alert.alert('Coming soon', 'Voice notes will be available in a future update.');
  };

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
              {peer.avatar ? (
                <Image source={{ uri: String(peer.avatar) }} style={styles.headerAvatarImg} />
              ) : (
                <Ionicons name="person" size={16} color={AMBER} />
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{peer.name}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>Direct message</Text>
            </View>
          </View>

          <HeaderIcon name="videocam" label="Video call" onPress={comingSoonCall('Video calls')} />
          <HeaderIcon name="call" label="Voice call" onPress={comingSoonCall('Voice calls')} />
        </View>

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
          ) : error && messages.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="lock-closed-outline" size={40} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => String(item.id || `dm-${index}`)}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <ChatMessageBubble
                  item={item}
                  isMe={item.sender_id === user?.id || item.user_id === user?.id}
                  baseUrl={BASE_URL}
                  currentUserId={user?.id}
                  showSender={false}
                />
              )}
              ListEmptyComponent={(
                <View style={styles.centered}>
                  <Ionicons name="chatbubble-ellipses-outline" size={40} color="rgba(255,255,255,0.28)" />
                  <Text style={styles.emptyText}>No messages yet. Say hi!</Text>
                </View>
              )}
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
