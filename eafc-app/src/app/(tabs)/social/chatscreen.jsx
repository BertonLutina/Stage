import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { io } from 'socket.io-client';
import api from '../../../utils/api';
import useAuthStore from '../../../store/authStore';

const SOCKET_URL = 'http://localhost:3000';

export default function ChatScreen() {
  const { userId: otherUserId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    api.get(`/social/messages/${otherUserId}`).then(r => setMessages(r.data.data || []));
    const socket = io(`${SOCKET_URL}/dm`);
    socketRef.current = socket;
    const roomId = [user.id, otherUserId].sort().join('_');
    socket.emit('join_room', roomId);
    socket.on('new_message', (msg) => setMessages(prev => [...prev, msg]));
    return () => socket.disconnect();
  }, [otherUserId]);

  const send = async () => {
    if (!text.trim()) return;
    const msg = { sender_id: user.id, receiver_id: otherUserId, content: text };
    const roomId = [user.id, otherUserId].sort().join('_');
    socketRef.current?.emit('send_message', msg);
    await api.post('/social/messages', { receiver_id: otherUserId, content: text });
    setText('');
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={i => i.id || String(Math.random())}
          renderItem={({ item }) => {
            const isMe = item.sender_id === user.id;
            return (
              <View className={`px-4 py-1 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                <View className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe ? 'bg-primary' : 'bg-card border border-border'}`}>
                  <Text className={isMe ? 'text-dark' : 'text-white'}>{item.content}</Text>
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          contentContainerStyle={{ paddingVertical: 12 }}
        />
        <View className="flex-row px-4 py-3 border-t border-border gap-2">
          <TextInput value={text} onChangeText={setText} placeholder="Message..." placeholderTextColor="#6B7280" className="flex-1 bg-card border border-border rounded-2xl px-4 py-2.5 text-white" />
          <TouchableOpacity onPress={send} className="bg-primary rounded-2xl px-4 items-center justify-center">
            <Text className="text-dark font-black text-lg">↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
