import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../../../utils/api';
import VideoPlayer from '../../../components/common/VideoPlayer';
import STText from '../../../components/common/STText';
import GradientBackground from '../../../components/common/GradientBackground';
import useAuthStore from '../../../store/authStore';
import { getMockMatchById } from '../../../utils/mockMatches';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.round(SCREEN_WIDTH * (9 / 16));
const CHAT_HEIGHT = 200;


export default function WatchMatchScreen() {
  const { matchId, videoIndex: videoIndexParam } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(parseInt(videoIndexParam || '0', 10));
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    api
      .get(`/matches/${matchId}`)
      .then((r) => setMatch(r.data.data))
      .catch(() => setMatch(getMockMatchById(matchId)))
      .finally(() => setLoading(false));
  }, [matchId]);

  // Load chat history from API
  useEffect(() => {
    if (!matchId) return;
    api
      .get(`/matches/${matchId}/chat`)
      .then((r) => setComments(r.data?.data ?? []))
      .catch(() => setComments([]));
  }, [matchId]);

  // Socket: join match room and listen for comments
  useEffect(() => {
    if (!matchId) return;
    const socket = io(`${SOCKET_URL}/match-chat`);
    socketRef.current = socket;
    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_match', matchId);
    });
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('new_comment', (data) => {
      setComments((prev) => [...prev, { ...data, id: data.id || `c-${Date.now()}` }]);
    });
    return () => {
      socket.emit('leave_match', matchId);
      socket.disconnect();
    };
  }, [matchId]);

  const sendComment = () => {
    if (!commentText.trim() || !user) return;
    const data = {
      matchId,
      user_id: user.id,
      gamer_tag: user.gamer_tag || user.email?.split('@')[0] || 'Anonymous',
      content: commentText.trim(),
    };
    socketRef.current?.emit('send_comment', data);
    setCommentText('');
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
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-4 px-6 py-3 rounded-xl border border-white/30"
            >
              <STText className="text-white font-semibold">Go Back</STText>
            </TouchableOpacity>
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
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 rounded-full bg-white/10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
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
            <View className="rounded-xl bg-black/30 border border-white/10" style={{ height: CHAT_HEIGHT }}>
              <FlatList
                ref={flatListRef}
                data={comments}
                keyExtractor={(item) => item.id}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
                renderItem={({ item }) => (
                  <View className="mb-2">
                    <STText className="text-xs text-gray-400">
                      {item.gamer_tag} · {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </STText>
                    <STText className="text-white">{item.content}</STText>
                  </View>
                )}
                ListEmptyComponent={
                  <STText className="text-gray-500 text-sm">No comments yet. Be the first!</STText>
                }
              />
            </View>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              className="flex-row items-center mt-2 gap-2"
            >
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
