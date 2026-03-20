import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../utils/api';
import VideoPlayer from '../../../components/common/VideoPlayer';
import Button from '../../../components/common/Button';
import STText from '../../../components/common/STText';
import GradientBackground from '../../../components/common/GradientBackground';
import { getMockMatchById } from '../../../utils/mockMatches';

export default function MatchDetailScreen() {
  const { matchId } = useLocalSearchParams();
  const router = useRouter();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/matches/${matchId}`)
      .then((r) => setMatch(r.data.data))
      .catch(() => setMatch(getMockMatchById(matchId)))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <STText className="text-white/60">Loading match...</STText>
        </View>
      </GradientBackground>
    );
  }
  if (!match) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center px-6">
          <STText className="text-white/60 text-center">Match not found</STText>
          <Button title="Go Back" onPress={() => router.back()} className="mt-4" />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <ScrollView className="px-4">
          <STText className="text-white/70 text-sm mt-4 text-center">{match.tournament_name}</STText>
          <View className="bg-white/10 border border-white/20 rounded-2xl p-6 mt-3 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 items-center">
                <STText className="text-white font-bold text-base text-center" numberOfLines={2}>
                  {match.home_team_name}
                </STText>
              </View>
              <View className="mx-4 items-center">
                {match.status === 'completed' ? (
                  <STText className="text-[#5FE3E8] font-black text-3xl">
                    {match.home_score} – {match.away_score}
                  </STText>
                ) : (
                  <STText className="text-white/60 text-xl font-bold">vs</STText>
                )}
                <View
                  className={`mt-1 px-2 py-0.5 rounded-full ${match.status === 'completed' ? 'bg-[#22C55E]/20' : 'bg-[#5FE3E8]/20'}`}
                >
                  <STText
                    className={`text-xs font-semibold ${match.status === 'completed' ? 'text-[#22C55E]' : 'text-[#5FE3E8]'}`}
                  >
                    {match.status}
                  </STText>
                </View>
              </View>
              <View className="flex-1 items-center">
                <STText className="text-white font-bold text-base text-center" numberOfLines={2}>
                  {match.away_team_name}
                </STText>
              </View>
            </View>
          </View>

          {match.videos?.length > 0 && (
            <View className="mb-4">
              <STText className="text-white font-bold mb-3">Match Videos</STText>
              {match.videos.map((v, idx) => (
                <TouchableOpacity
                  key={v.id}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/matches/watchmatchscreen',
                      params: { matchId, videoIndex: String(idx) },
                    })
                  }
                  className="mb-4"
                  activeOpacity={0.8}
                >
                  <STText className="text-white/60 text-xs mb-2">
                    Uploaded by {v.uploader} • {v.video_source} • Tap to watch full screen
                  </STText>
                  <VideoPlayer url={v.video_url} source={v.video_source} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Button
            title="Upload Match Video"
            variant="outline"
            onPress={() =>
              router.push({
                pathname: '/(tabs)/matches/uploadvideoscreen',
                params: { matchId },
              })
            }
            className="mb-8"
          />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
