import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../../components/common/Avatar';
import useFeed from '../../../hooks/useFeed';

function PostCard({ post, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} className="bg-card border-b border-border mb-1">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <Avatar uri={post.user_avatar} name={`${post.first_name} ${post.last_name}`} size={40} />
        <View className="ml-3 flex-1">
          <Text className="text-white font-semibold">{post.gamer_tag || `${post.first_name} ${post.last_name}`}</Text>
          <Text className="text-muted text-xs">{new Date(post.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
      {post.content ? <Text className="text-white px-4 pb-3 text-sm leading-5">{post.content}</Text> : null}
      {post.media_url && post.media_type === 'image' ? (
        <Image source={{ uri: post.media_url }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
      ) : null}
      <View className="flex-row px-4 py-3 gap-6">
        <Text className="text-muted text-sm">♥ {post.likes_count || 0}</Text>
        <Text className="text-muted text-sm">💬 {post.comments_count || 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen({ navigation }) {
  const { feed, loadMore } = useFeed();

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
        <Text className="text-primary font-black text-xl">Stage</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Messages')}>
          <Text className="text-white text-2xl">✉</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={feed}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <PostCard post={item} onPress={() => navigation.navigate('PostDetail', { postId: item.id })} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<Text className="text-muted text-center mt-12">No posts yet. Follow players to see their content!</Text>}
      />
    </SafeAreaView>
  );
}
