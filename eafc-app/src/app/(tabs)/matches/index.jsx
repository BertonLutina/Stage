import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../../components/common/GradientBackground';
import STText from '../../../components/common/STText';
import api from '../../../utils/api';
import { MOCK_MATCHES } from '../../../utils/mockMatches';

export default function MatchesIndex() {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/matches/fixtures')
      .then((r) => setMatches(r.data.data || []))
      .catch(() => setMatches(MOCK_MATCHES))
      .finally(() => setLoading(false));
  }, []);

  const displayMatches = matches.length > 0 ? matches : MOCK_MATCHES;

  return (
    <View className="flex-1">
      <GradientBackground>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView showsVerticalScrollIndicator={false} className="px-4">
            <STText className="text-white text-2xl font-bold mt-6 mb-4">Matches</STText>
            <STText className="text-white/70 text-sm mb-6">Fixtures and results</STText>

            {loading ? (
              <View className="py-12 items-center">
                <STText className="text-white/60">Loading matches...</STText>
              </View>
            ) : (
              displayMatches.map((match) => {
                const isCompleted = match.status === 'completed';
                const score = isCompleted
                  ? `${match.home_score ?? 0} – ${match.away_score ?? 0}`
                  : 'vs';
                return (
                  <TouchableOpacity
                    key={match.id}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/matches/matchdetailscreen',
                        params: { matchId: match.id },
                      })
                    }
                    className="bg-white/10 border border-white/20 rounded-2xl p-4 mb-3 flex-row items-center"
                  >
                    <View className="flex-1">
                      <STText className="text-white/60 text-xs mb-1">{match.tournament_name}</STText>
                      <View className="flex-row items-center justify-between">
                        <STText className="text-white font-semibold flex-1" numberOfLines={1}>
                          {match.home_team_name}
                        </STText>
                        <View className="mx-3 items-center min-w-[60px]">
                          <STText
                            className={`text-lg font-bold ${isCompleted ? 'text-[#5FE3E8]' : 'text-white/70'}`}
                          >
                            {score}
                          </STText>
                          <View
                            className={`mt-1 px-2 py-0.5 rounded-full ${isCompleted ? 'bg-[#22C55E]/20' : 'bg-[#5FE3E8]/20'}`}
                          >
                            <STText
                              className={`text-[10px] font-semibold ${isCompleted ? 'text-[#22C55E]' : 'text-[#5FE3E8]'}`}
                            >
                              {match.status}
                            </STText>
                          </View>
                        </View>
                        <STText className="text-white font-semibold flex-1 text-right" numberOfLines={1}>
                          {match.away_team_name}
                        </STText>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      {match.videos?.length > 0 && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push({
                              pathname: '/(tabs)/matches/watchmatchscreen',
                              params: { matchId: match.id },
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#5FE3E8]/20"
                        >
                          <STText className="text-[#5FE3E8] text-xs font-semibold">Watch</STText>
                        </TouchableOpacity>
                      )}
                      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            <View className="h-8" />
          </ScrollView>
        </SafeAreaView>
      </GradientBackground>
    </View>
  );
}
