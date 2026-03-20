import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../../utils/api';
import STText from '../../components/common/STText';
import useAuthStore from '../../store/authStore';

export default function TeamChatScreen() {
  const { teamId, teamName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!teamId) return;
    api
      .get(`/teams/${teamId}/chat`)
      .then((r) => setMessages(r.data?.data ?? []))
      .catch((err) => {
        setError(err.response?.status === 403 ? 'You must be a team member to view chat' : 'Failed to load chat');
        setMessages([]);
      })
      .finally(() => setLoading(false));
  }, [teamId]);

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
    socket.on('chat_error', (data) => setError(data?.message));
    return () => {
      socket.emit('leave_team', teamId);
      socket.disconnect();
    };
  }, [teamId]);

  const send = () => {
    if (!text.trim() || !user) return;
    const data = {
      teamId,
      user_id: user.id,
      gamer_tag: user.gamer_tag || user.email?.split('@')[0] || 'Anonymous',
      content: text.trim(),
    };
    socketRef.current?.emit('send_message', data);
    setText('');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <STText className="text-muted">Loading chat...</STText>
      </View>
    );
  }

  if (error && messages.length === 0) {
    return (
      <View className="flex-1 bg-dark items-center justify-center px-6">
        <Ionicons name="chatbubbles-outline" size={48} color="rgba(255,255,255,0.3)" />
        <STText className="text-muted text-center mt-4">{error}</STText>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 px-6 py-3 rounded-xl border border-white/30">
          <STText className="text-white font-semibold">Go Back</STText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10">
        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <STText className="text-white font-bold">{teamName || 'Team Chat'}</STText>
          {socketConnected && (
            <View className="flex-row items-center mt-0.5">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
              <STText className="text-xs text-gray-400">Live</STText>
            </View>
          )}
        </View>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          renderItem={({ item }) => {
            const isMe = item.user_id === user?.id;
            return (
              <View className={`mb-3 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                <View className={`max-w-[80%] px-4 py-2 rounded-2xl ${isMe ? 'bg-primary' : 'bg-white/10 border border-white/10'}`}>
                  {!isMe && (
                    <STText className="text-primary text-xs font-semibold mb-0.5">{item.gamer_tag}</STText>
                  )}
                  <STText className={isMe ? 'text-dark' : 'text-white'}>{item.content}</STText>
                  <STText className={`text-xs mt-1 ${isMe ? 'text-dark/70' : 'text-gray-400'}`}>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </STText>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <STText className="text-gray-500 text-sm">No messages yet. Say hi to your team!</STText>
            </View>
          }
        />
        <View className="flex-row items-center px-4 py-3 border-t border-white/10 gap-2">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message your team..."
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white"
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={send} disabled={!text.trim()} className="bg-primary rounded-xl px-4 py-3">
            <Ionicons name="send" size={20} color="#0F0F0F" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
