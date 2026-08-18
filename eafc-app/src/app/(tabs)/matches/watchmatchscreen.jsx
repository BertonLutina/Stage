import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../utils/api';
import { stageClient } from '../../../api/stageClient';
import VideoPlayer from '../../../components/common/VideoPlayer';
import STText from '../../../components/common/STText';
import GradientBackground from '../../../components/common/GradientBackground';
import useAuthStore from '../../../store/authStore';
import { getMockMatchById } from '../../../utils/mockMatches';
import ChatMessageBubble from '../../../components/chat/ChatMessageBubble';
import ChatAttachmentMenu from '../../../components/chat/ChatAttachmentMenu';
import ChatFilterChips from '../../../components/chat/ChatFilterChips';
import BackButton from '../../../components/common/BackButton';

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
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
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
    api
      .get(`/matches/${matchId}`)
      .then((r) => setMatch(r.data.data))
      .catch(() => setMatch(getMockMatchById(matchId)))
      .finally(() => setLoading(false));
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
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <STText className="text-white/60">Loading...</STText>
        </View>
      </GradientBackground>
    );
  }

  if (!match) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1">
          <View className="flex-1 items-center justify-center px-6">
            <STText className="text-white/60 text-center">Match not found</STText>
            <View className="mt-4 items-center">
              <BackButton variant="light" />
            </View>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const videos = match.videos || [];
  const hasVideos = videos.length > 0;
  const currentVideo = hasVideos ? videos[Math.min(selectedVideoIndex, videos.length - 1)] : null;

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10">
          <BackButton variant="light" />
          <STText className="text-white font-bold">Watch Match</STText>
          <View className="w-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Match context */}
          <View className="px-4 pt-4 pb-2">
            <STText className="text-white/60 text-xs text-center">{match.tournament_name}</STText>
            <View className="flex-row items-center justify-center mt-2 gap-3">
              <STText className="text-white font-bold text-base" numberOfLines={1}>
                {match.home_team_name}
              </STText>
              <STText className="text-[#5FE3E8] font-black text-lg">
                {match.status === 'completed'
                  ? `${match.home_score ?? 0} – ${match.away_score ?? 0}`
                  : 'vs'}
              </STText>
              <STText className="text-white font-bold text-base" numberOfLines={1}>
                {match.away_team_name}
              </STText>
            </View>
          </View>

          {/* Video player */}
          {hasVideos && currentVideo ? (
            <View className="px-4 mt-2">
              <View className="rounded-2xl overflow-hidden bg-black">
                <VideoPlayer
                  url={currentVideo.video_url}
                  source={currentVideo.video_source}
                  height={VIDEO_HEIGHT}
                />
              </View>
              <STText className="text-white/60 text-xs mt-2">
                Uploaded by {currentVideo.uploader} • {currentVideo.video_source}
              </STText>
            </View>
          ) : (
            <View
              className="mx-4 mt-4 rounded-2xl bg-white/5 border border-white/10 items-center justify-center"
              style={{ height: VIDEO_HEIGHT }}
            >
              <Ionicons name="videocam-off-outline" size={48} color="rgba(255,255,255,0.3)" />
              <STText className="text-white/50 mt-2 text-center px-4">
                No videos uploaded for this match yet
              </STText>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/matches/uploadvideoscreen',
                    params: { matchId },
                  })
                }
                className="mt-4 px-6 py-2 rounded-xl border border-[#5FE3E8]/50"
              >
                <STText className="text-[#5FE3E8] font-semibold">Upload Video</STText>
              </TouchableOpacity>
            </View>
          )}

          {/* Live chat */}
          <View className="px-4 py-4">
            <View className="flex-row items-center justify-between mb-2">
              <STText className="text-lg font-semibold text-white">Live chat</STText>
              {socketConnected && (
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                  <STText className="text-xs text-gray-400">Live</STText>
                </View>
              )}
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search messages, media…"
              placeholderTextColor="#9ca3af"
              className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white mb-2"
            />
            <ChatFilterChips activeFilters={activeFilters} onToggle={toggleFilter} />
            <View className="rounded-xl bg-black/30 border border-white/10 mt-2" style={{ height: CHAT_HEIGHT }}>
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
                  <STText className="text-gray-500 text-sm">
                    {search || (activeFilters.length && activeFilters[0] !== 'all') ? 'No matching messages' : 'No comments yet. Be the first!'}
                  </STText>
                }
              />
            </View>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              className="flex-row items-center mt-2 gap-2"
            >
              <TouchableOpacity
                onPress={() => setAttachmentMenuVisible(true)}
                className="h-11 w-11 rounded-xl bg-black/30 border border-white/10 items-center justify-center"
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#9ca3af"
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white"
                onSubmitEditing={sendComment}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={sendComment}
                disabled={!commentText.trim()}
                className="bg-primary rounded-xl px-4 py-3"
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </View>

          <ChatAttachmentMenu
            visible={attachmentMenuVisible}
            onClose={() => setAttachmentMenuVisible(false)}
            onSelect={handleAttachmentSelect}
          />

          {/* Other videos from same match */}
          {hasVideos && videos.length > 1 && (
            <View className="px-4 mt-6 mb-8">
              <STText className="text-white font-bold mb-3">Other recordings</STText>
              {videos.map((v, idx) => (
                <TouchableOpacity
                  key={v.id}
                  onPress={() => setSelectedVideoIndex(idx)}
                  className={`flex-row items-center rounded-xl p-3 mb-2 ${
                    selectedVideoIndex === idx ? 'bg-[#5FE3E8]/20 border border-[#5FE3E8]/50' : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <View className="h-12 w-16 rounded-lg bg-black/50 items-center justify-center">
                    <Ionicons name="play-circle" size={24} color="#5FE3E8" />
                  </View>
                  <View className="ml-3 flex-1">
                    <STText className="text-white font-semibold">
                      {v.uploader} • {v.video_source}
                    </STText>
                    <STText className="text-white/50 text-xs mt-0.5">
                      {selectedVideoIndex === idx ? 'Now playing' : 'Tap to watch'}
                    </STText>
                  </View>
                  {selectedVideoIndex === idx && (
                    <Ionicons name="checkmark-circle" size={24} color="#5FE3E8" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
