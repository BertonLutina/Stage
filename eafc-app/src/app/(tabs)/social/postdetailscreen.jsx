import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import Avatar from '../../../components/common/Avatar';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    api.get(`/social/posts/${postId}`).then(r => setPost(r.data.data)).catch(() => {});
    api.get(`/social/comments?target_id=${postId}&target_type=post`).then(r => setComments(r.data.data || [])).catch(() => {});
  }, [postId]);

  const addComment = async () => {
    if (!comment.trim()) return;
    await api.post('/social/comments', { target_id: postId, target_type: 'post', content: comment });
    setComment('');
    api.get(`/social/comments?target_id=${postId}&target_type=post`).then(r => setComments(r.data.data || []));
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="flex-1 px-4">
        {post && (
          <View className="pt-4 pb-6 border-b border-border">
            <View className="flex-row items-center mb-3">
              <Avatar uri={post.user_avatar} name={`${post.first_name} ${post.last_name}`} size={40} />
              <View className="ml-3"><Text className="text-white font-bold">{post.gamer_tag}</Text><Text className="text-muted text-xs">{new Date(post.created_at).toLocaleDateString()}</Text></View>
            </View>
            <Text className="text-white text-sm leading-6">{post.content}</Text>
          </View>
        )}
        <Text className="text-white font-bold mt-4 mb-3">Comments</Text>
        {comments.map(c => (
          <View key={c.id} className="flex-row mb-3">
            <Avatar uri={c.avatar} name={c.gamer_tag} size={32} />
            <View className="ml-2 flex-1 bg-card rounded-xl px-3 py-2">
              <Text className="text-primary text-xs font-bold mb-0.5">{c.gamer_tag}</Text>
              <Text className="text-white text-sm">{c.content}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View className="flex-row px-4 py-3 border-t border-border gap-2">
        <TextInput value={comment} onChangeText={setComment} placeholder="Add a comment..." placeholderTextColor="#6B7280" className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-white" />
        <TouchableOpacity onPress={addComment} className="bg-primary rounded-xl px-4 py-2 items-center justify-center">
          <Text className="text-dark font-bold">Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
