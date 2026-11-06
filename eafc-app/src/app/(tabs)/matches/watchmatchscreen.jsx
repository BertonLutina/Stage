import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../utils/api';
import { stageClient } from '../../../api/stageClient';
import VideoPlayer from '../../../components/common/VideoPlayer';
import useAuthStore from '../../../store/authStore';
import useThemeStore from '@/store/themeStore';
import { goBackInPlace } from '@/lib/navigationBack';
import { Button, Card, IconButton, Screen, SectionLabel, TextField } from '@/components/ui';
import { MIN_TOUCH, SCREEN_GUTTER } from '@/components/ui/metrics';
import ChatMessageBubble from '../../../components/chat/ChatMessageBubble';
import ChatAttachmentMenu from '../../../components/chat/ChatAttachmentMenu';
import ChatFilterChips from '../../../components/chat/ChatFilterChips';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.round(SCREEN_WIDTH * (9 / 16));
const CHAT_HEIGHT = 220;
const BASE_URL = api.defaults.baseURL;

function isOwnChatMessage(item, user) {
  const email = String(user?.email || '').trim().toLowerCase();
  const sender = String(item?.sender_email || '').trim().toLowerCase();
  if (email && sender && email === sender) return true;
  return item?.user_id === user?.id || item?.user_id === user?.email;
}

function upsertChatMessage(prev, payload) {
  if (!payload) return prev;
  const id = payload.id;
  if (!id) return [...prev, payload];
  const idx = prev.findIndex((m) => m.id === id);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = { ...next[idx], ...payload };
    return next;
  }
  return [...prev, payload];
}

/** "Kaze • youtube"; a missing uploader or source is dropped instead of reading "undefined". */
function recordingTitle(video) {
  return [video?.uploader || 'Unknown uploader', video?.video_source].filter(Boolean).join(' • ');
}

function recordingName(video) {
  return [video?.uploader || 'Unknown uploader', video?.video_source].filter(Boolean).join(' ');
}

function buildChatParams(search, activeFilters) {
  const params = {};
  if (search?.trim()) params.search = search.trim();
  const filters = activeFilters.filter((f) => f !== 'all' && f !== 'unread');
  if (filters.length) params.filter = filters.join(',');
  if (activeFilters.includes('unread')) params.unread = 'true';
  return params;
}

export default function WatchMatchScreen() {
  const { matchId, videoIndex: videoIndexParam } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tokens = useThemeStore((st) => st.tokens);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(parseInt(videoIndexParam || '0', 10));
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [socketConnected, setSocketConnected] = useState(false);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const flatListRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const fetchChat = useCallback(() => {
    if (!matchId) return;
    const params = buildChatParams(search, activeFilters);
    api
      .get(`/matches/${matchId}/chat`, { params })
      .then((r) => setComments(r.data?.data ?? []))
      .catch(() => setComments([]));
  }, [matchId, search, activeFilters]);

  useEffect(() => {
    if (!matchId) {
      setMatch(null);
      setLoadError('');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    stageClient.entities.Match.get(matchId)
      .then((row) => {
        if (cancelled) return;
        setMatch(row || null);
        if (!row) setLoadError('Match not found');
      })
      .catch((err) => {
        if (cancelled) return;
        setMatch(null);
        setLoadError(err?.message || 'Could not load this match');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(fetchChat, 300);
    return () => clearTimeout(searchDebounceRef.current);
  }, [matchId, search, activeFilters, fetchChat]);

  useEffect(() => {
    if (matchId && user) api.post(`/matches/${matchId}/chat/read`).catch(() => {});
  }, [matchId, user]);

  useEffect(() => {
    if (!matchId) return undefined;
    setSocketConnected(true);
    const unsub = stageClient.entities.ChatMessage.subscribe((event) => {
      const payload = event?.data;
      if (!payload || payload.match_id !== matchId) return;
      if (event.type === 'delete') {
        setComments((prev) => prev.filter((m) => m.id !== event.id && m.id !== payload.id));
        return;
      }
      setComments((prev) => upsertChatMessage(prev, payload));
    }, { match_id: matchId });
    return () => {
      setSocketConnected(false);
      if (typeof unsub === 'function') unsub();
    };
  }, [matchId]);

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
    formData.append('file', { uri: fileUri, type: mimeType, name: fileName });
    try {
      const { data } = await api.post('/uploads/chat', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = data?.data?.url;
      if (!url) throw new Error('No URL returned');
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
      const res = await api.post(`/matches/${matchId}/chat`, { content: fullUrl });
      const saved = res.data?.data;
      if (saved) setComments((prev) => upsertChatMessage(prev, saved));
    } catch (_) {}
  };

  const handleAttachmentSelect = async (key) => {
    switch (key) {
      case 'camera': {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required.'); return; }
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
        if (!result.canceled && result.assets?.[0]?.uri) uploadAndSend(result.assets[0].uri, 'photo');
        break;
      }
      case 'gallery': {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed', 'Photo library access is required.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: false });
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
      default:
        Alert.alert('Coming soon', 'This feature will be available in a future update.');
    }
  };

  const sendComment = async () => {
    if (!commentText.trim() || !user) return;
    const trimmed = commentText.trim();
    setCommentText('');
    try {
      const res = await api.post(`/matches/${matchId}/chat`, { content: trimmed });
      const saved = res.data?.data;
      if (saved) setComments((prev) => upsertChatMessage(prev, saved));
    } catch {
      setComments((prev) => [...prev, {
        id: `local-${Date.now()}`,
        content: trimmed,
        sender_email: user.email,
        gamer_tag: user.gamer_tag || user.email?.split('@')[0] || 'Anonymous',
        user_id: user.email || user.id,
      }]);
    }
  };

  if (loading) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={tokens.cyan} size="large" />
          <Text style={{ color: tokens.muted, fontSize: 14 }}>Loading...</Text>
        </View>
      </Screen>
    );
  }

  if (!match) {
    return (
      <Screen scroll={false}>
        <View style={{ alignItems: 'flex-start' }}>
          <IconButton icon="arrow-back" onPress={() => goBackInPlace(router)} accessibilityLabel="Back" />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
          <Text style={{ color: tokens.muted, fontSize: 14, textAlign: 'center' }}>
            {loadError || 'Match not found'}
          </Text>
        </View>
      </Screen>
    );
  }

  const videos = match.videos || [];
  const hasVideos = videos.length > 0;
  const currentVideo = hasVideos ? videos[Math.min(selectedVideoIndex, videos.length - 1)] : null;
  const canSend = Boolean(commentText.trim());

  return (
    <Screen keyboardAvoiding>
      <View style={{ gap: 16 }}>
        {/* Header: back + match line + competition context */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <IconButton icon="arrow-back" onPress={() => goBackInPlace(router)} accessibilityLabel="Back" />
          <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text numberOfLines={1} style={{ flexShrink: 1, color: tokens.text, fontWeight: '700', fontSize: 14 }}>
                {match.home_club_name || match.home_player_name || match.home_team_name || 'Home'}
              </Text>
              <Text style={{ color: tokens.cyan, fontWeight: '800', fontSize: 15 }}>
                {match.status === 'completed'
                  ? `${match.home_score ?? 0} – ${match.away_score ?? 0}`
                  : 'vs'}
              </Text>
              <Text numberOfLines={1} style={{ flexShrink: 1, color: tokens.text, fontWeight: '700', fontSize: 14 }}>
                {match.away_club_name || match.away_player_name || match.away_team_name || 'Away'}
              </Text>
            </View>
            <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>
              {match.tournament_name || match.competition_context || 'Match'}
            </Text>
          </View>
          <View style={{ width: MIN_TOUCH }} />
        </View>

        {/* Video player: edge to edge */}
        {hasVideos && currentVideo ? (
          <View style={{ gap: 8 }}>
            <View style={{ marginHorizontal: -SCREEN_GUTTER, backgroundColor: tokens.bgDeep }}>
              <VideoPlayer
                url={currentVideo.video_url}
                source={currentVideo.video_source}
                height={VIDEO_HEIGHT}
                radius={0}
              />
            </View>
            <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12 }}>
              Uploaded by {recordingTitle(currentVideo)}
            </Text>
          </View>
        ) : (
          <Card style={{ height: VIDEO_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="videocam-off-outline" size={44} color={tokens.muted} />
            <Text style={{ color: tokens.muted, marginTop: 8, textAlign: 'center', fontSize: 14 }}>
              No videos uploaded for this match yet
            </Text>
            <View style={{ marginTop: 16, alignSelf: 'stretch' }}>
              <Button
                variant="secondary"
                title="Upload Video"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/matches/uploadvideoscreen',
                    params: { matchId },
                  })
                }
              />
            </View>
          </Card>
        )}

        {/* Other videos from same match */}
        {hasVideos && videos.length > 1 && (
          <View style={{ gap: 10 }}>
            <SectionLabel>Other recordings</SectionLabel>
            {videos.map((v, idx) => {
              const selected = selectedVideoIndex === idx;
              return (
                <Card
                  key={v.id}
                  highlight={selected}
                  onPress={() => setSelectedVideoIndex(idx)}
                  accessibilityLabel={`${recordingName(v)}${selected ? ', Now playing' : ''}`}
                  style={{ padding: 12 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 96,
                        height: 56,
                        borderRadius: 10,
                        backgroundColor: tokens.bgDeep,
                        borderWidth: 1,
                        borderColor: tokens.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="play" size={22} color={tokens.cyan} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: '700', fontSize: 14 }}>
                        {recordingTitle(v)}
                      </Text>
                      <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>
                        {selected ? 'Now playing' : 'Tap to watch'}
                      </Text>
                    </View>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={22} color={tokens.cyan} />
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Live chat */}
        <View style={{ gap: 12 }}>
          <SectionLabel
            right={socketConnected ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, marginRight: 6, backgroundColor: tokens.success }}
                />
                <Text style={{ color: tokens.muted, fontSize: 12 }}>Live</Text>
              </View>
            ) : null}
          >
            Live chat
          </SectionLabel>
          <TextField
            value={search}
            onChangeText={setSearch}
            placeholder="Search messages, media…"
            accessibilityLabel="Search messages"
          />
          <View style={{ marginHorizontal: -SCREEN_GUTTER }}>
            <ChatFilterChips activeFilters={activeFilters} onToggle={toggleFilter} />
          </View>
          <Card
            style={[
              { height: CHAT_HEIGHT, padding: 0, overflow: 'hidden' },
              tokens.live ? null : { backgroundColor: tokens.bgDeep },
            ]}
          >
            <FlatList
              ref={flatListRef}
              data={comments}
              keyExtractor={(item) => item.id}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
              renderItem={({ item }) => (
                <ChatMessageBubble item={item} isMe={isOwnChatMessage(item, user)} baseUrl={BASE_URL} />
              )}
              ListEmptyComponent={
                <Text style={{ color: tokens.muted, fontSize: 14 }}>
                  {search || (activeFilters.length && activeFilters[0] !== 'all') ? 'No matching messages' : 'No comments yet. Be the first!'}
                </Text>
              }
            />
          </Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <IconButton
              icon="add"
              onPress={() => setAttachmentMenuVisible(true)}
              accessibilityLabel="Attach"
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <TextField
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                accessibilityLabel="Add a comment"
                onSubmitEditing={sendComment}
                returnKeyType="send"
              />
            </View>
            <Pressable
              onPress={sendComment}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send comment"
              accessibilityState={{ disabled: !canSend }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tokens.cyan,
                opacity: canSend ? 1 : 0.5,
              }}
            >
              <Ionicons name="send" size={20} color={tokens.onCyan} />
            </Pressable>
          </View>
        </View>

        <ChatAttachmentMenu
          visible={attachmentMenuVisible}
          onClose={() => setAttachmentMenuVisible(false)}
          onSelect={handleAttachmentSelect}
        />
      </View>
    </Screen>
  );
}
