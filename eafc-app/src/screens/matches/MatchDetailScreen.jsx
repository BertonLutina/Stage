import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import VideoPlayer from '../../components/common/VideoPlayer';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';

export default function MatchDetailScreen({ route, navigation }) {
  const { matchId } = route.params;
  const [match, setMatch] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    api.get(`/matches/${matchId}`).then(r => setMatch(r.data.data));
  }, [matchId]);

  if (!match) return <View className="flex-1 bg-dark items-center justify-center"><Text className="text-muted">Loading...</Text></View>;

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="px-4">
        <Text className="text-muted text-sm mt-4 text-center">{match.tournament_name}</Text>
        <View className="bg-card border border-border rounded-2xl p-6 mt-3 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 items-center">
              <Text className="text-white font-bold text-base text-center" numberOfLines={2}>{match.home_team_name}</Text>
            </View>
            <View className="mx-4 items-center">
              {match.status === 'completed' ? (
                <Text className="text-primary font-black text-3xl">{match.home_score} - {match.away_score}</Text>
              ) : (
                <Text className="text-muted text-xl font-bold">vs</Text>
              )}
              <View className={`mt-1 px-2 py-0.5 rounded-full ${match.status === 'completed' ? 'bg-secondary/20' : 'bg-primary/20'}`}>
                <Text className={`text-xs ${match.status === 'completed' ? 'text-secondary' : 'text-primary'}`}>{match.status}</Text>
              </View>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white font-bold text-base text-center" numberOfLines={2}>{match.away_team_name}</Text>
            </View>
          </View>
        </View>

        {match.videos?.length > 0 && (
          <View className="mb-4">
            <Text className="text-white font-bold mb-3">Match Videos</Text>
            {match.videos.map(v => (
              <View key={v.id} className="mb-4">
                <Text className="text-muted text-xs mb-2">Uploaded by {v.uploader} • {v.video_source}</Text>
                <VideoPlayer url={v.video_url} source={v.video_source} />
              </View>
            ))}
          </View>
        )}

        <Button title="Upload Match Video" variant="outline" onPress={() => navigation.navigate('UploadVideo', { matchId })} className="mb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
