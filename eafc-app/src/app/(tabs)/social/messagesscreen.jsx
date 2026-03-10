import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../utils/api';
import Avatar from '../../../components/common/Avatar';
import useAuthStore from '../../../store/authStore';

export default function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    api.get('/social/messages').then(r => setConversations(r.data.data || []));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-4 py-4 border-b border-border">
        <Text className="text-white text-2xl font-black">Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={i => i.other_user_id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('Chat', { userId: item.other_user_id })}
            className="flex-row items-center px-4 py-4 border-b border-border/50">
            <Avatar name={item.other_user_id} size={48} />
            <View className="ml-3 flex-1">
              <Text className="text-white font-semibold">{item.other_user_id}</Text>
              <Text className="text-muted text-xs">{new Date(item.last_message_at).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text className="text-muted text-center mt-12">No conversations yet</Text>}
      />
    </SafeAreaView>
  );
}
