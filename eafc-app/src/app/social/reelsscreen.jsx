import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import VideoPlayer from '../../components/common/VideoPlayer';
import Avatar from '../../components/common/Avatar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function ReelItem({ reel, isVisible }) {
  return (
    <View style={{ height: SCREEN_HEIGHT }} className="bg-dark relative">
      <VideoPlayer url={reel.video_url} source="other" height={SCREEN_HEIGHT} />
      <View className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/80 to-transparent">
        <View className="flex-row items-center mb-2">
          <Avatar uri={reel.user_avatar} name={reel.gamer_tag} size={36} />
          <Text className="text-white font-bold ml-2">@{reel.gamer_tag}</Text>
        </View>
        {reel.title ? <Text className="text-white text-sm mb-2">{reel.title}</Text> : null}
      </View>
      <View className="absolute right-4 bottom-32 items-center gap-4">
        <TouchableOpacity className="items-center">
          <Text className="text-white text-2xl">♥</Text>
          <Text className="text-white text-xs">{reel.likes_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <Text className="text-white text-2xl">💬</Text>
          <Text className="text-white text-xs">{reel.comments_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <Text className="text-white text-2xl">↗</Text>
          <Text className="text-white text-xs">Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReelsScreen() {
  const [reels, setReels] = useState([]);
  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    api.get('/social/reels').then(r => setReels(r.data.data || []));
  }, []);

  return (
    <View className="flex-1">
      <FlatList
        data={reels}
        keyExtractor={i => i.id}
        renderItem={({ item, index }) => <ReelItem reel={item} isVisible={index === visibleIndex} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={({ viewableItems }) => {
          if (viewableItems[0]) setVisibleIndex(viewableItems[0].index);
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        ListEmptyComponent={<View style={{ height: SCREEN_HEIGHT }} className="items-center justify-center"><Text className="text-muted">No reels yet</Text></View>}
      />
    </View>
  );
}
