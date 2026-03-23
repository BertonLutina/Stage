import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../../utils/api';
import useAuthStore from '../../store/authStore';

export default function ChatScreen() {
  const { userId: otherUserId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const baseUrl = api.defaults.baseURL || '';

  useEffect(() => {
    api.get(`/social/messages/${otherUserId}`).then(r => setMessages(r.data.data || []));
    const socket = io(`${SOCKET_URL}/dm`);
    socketRef.current = socket;
    const roomId = [user?.id, otherUserId].sort().join('_');
    socket.emit('join_room', roomId);
    socket.on('new_message', (msg) => setMessages(prev => [...prev, msg]));
    return () => socket.disconnect();
  }, [otherUserId, user?.id]);

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
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      const payload = {
        receiver_id: otherUserId,
        content: '',
        message_type: messageType,
        media_url: fullUrl,
      };
      const res = await api.post('/social/messages', payload);
      const saved = res.data.data;
      socketRef.current?.emit('send_message', { ...saved, sender_id: user.id, receiver_id: otherUserId });
      setMessages(prev => [...prev, { ...saved, sender_id: user.id, receiver_id: otherUserId }]);
    } catch (e) {
      Alert.alert('Upload failed', 'Could not send image.');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';
      const name = asset.fileName || 'photo.jpg';
      uploadAndSend(asset.uri, 'photo', mime, name);
    }
  };

  const send = async () => {
    if (!text.trim() || !user) return;
    const payload = { receiver_id: otherUserId, content: text.trim() };
    const roomId = [user.id, otherUserId].sort().join('_');
    try {
      const res = await api.post('/social/messages', payload);
      const saved = res.data.data;
      socketRef.current?.emit('send_message', { ...saved, sender_id: user.id, receiver_id: otherUserId });
      setMessages(prev => [...prev, { ...saved, sender_id: user.id, receiver_id: otherUserId }]);
    } catch (e) {
      socketRef.current?.emit('send_message', { sender_id: user.id, receiver_id: otherUserId, content: text.trim() });
      setMessages(prev => [...prev, { sender_id: user.id, receiver_id: otherUserId, content: text.trim() }]);
    }
    setText('');
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === user?.id;
    const type = item.message_type || 'text';
    const mediaUrl = item.media_url ? (item.media_url.startsWith('http') ? item.media_url : `${baseUrl}${item.media_url}`) : null;
    return (
      <View className={`px-4 py-1 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
        <View className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe ? 'bg-primary' : 'bg-card border border-border'}`}>
          {type === 'photo' && mediaUrl ? (
            <Image source={{ uri: mediaUrl }} className="rounded-xl" style={{ width: 200, height: 150 }} resizeMode="cover" />
          ) : (
            <Text className={isMe ? 'text-dark' : 'text-white'}>{item.content || ''}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={i => i.id || String(Math.random())}
          renderItem={renderMessage}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          contentContainerStyle={{ paddingVertical: 12 }}
        />
        <View className="flex-row px-4 py-3 border-t border-border gap-2">
          <TouchableOpacity onPress={pickImage} className="bg-card border border-border rounded-2xl px-3 items-center justify-center">
            <Text className="text-primary font-bold text-lg">📷</Text>
          </TouchableOpacity>
          <TextInput value={text} onChangeText={setText} placeholder="Message..." placeholderTextColor="#6B7280" className="flex-1 bg-card border border-border rounded-2xl px-4 py-2.5 text-white" />
          <TouchableOpacity onPress={send} className="bg-primary rounded-2xl px-4 items-center justify-center">
            <Text className="text-dark font-black text-lg">↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
