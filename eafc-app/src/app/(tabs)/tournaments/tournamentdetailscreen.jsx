import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../utils/api';
import useAuthStore from '../../../store/authStore';
import useTournamentStore from '../../../store/tournamentStore';
import GradientBackground from '../../../components/common/GradientBackground';
import BackButton from '../../../components/common/BackButton';

export default function TournamentDetailScreen() {
  const { tournamentId } = useLocalSearchParams();
  const router = useRouter();
  const [tournament, setTournament] = useState(null);
  const { user } = useAuthStore();
  const { start } = useTournamentStore();

  useEffect(() => {
    api.get(`/tournaments/${tournamentId}`).then(r => setTournament(r.data.data));
  }, [tournamentId]);

  if (!tournament) return <View className="flex-1 bg-dark items-center justify-center"><Text className="text-muted">Loading...</Text></View>;

  const isOwner = tournament.owner_id === user?.id;

  const goToBracket = () => {
    const format = tournament.format;
    if (format === 'group_knockout')
      router.push({ pathname: '/(tabs)/tournaments/groupstagescreen', params: { tournamentId } });
    else if (format === 'classic_league' || format === 'league_playoffs')
      router.push({ pathname: '/(tabs)/tournaments/leaguestandingsscreen', params: { tournamentId } });
    else
      router.push({ pathname: '/(tabs)/tournaments/bracketscreen', params: { tournamentId } });
  };

  return (
    <View className="flex-1">
      <GradientBackground>
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center gap-4 px-4 py-3 border-b border-white/10">
            <BackButton variant="light" />
            <Text className="text-white text-lg font-bold flex-1" numberOfLines={1}>{tournament.name}</Text>
          </View>
          <ScrollView className="px-4">
            <View className="mt-4 mb-6">
              <View className="flex-row justify-between items-center">
                <Text className="text-white text-2xl font-black flex-1">{tournament.name}</Text>
                <View className={`px-3 py-1 rounded-full ${tournament.status === 'active' ? 'bg-secondary/20' : 'bg-primary/20'}`}>
                  <Text className={`text-xs font-bold capitalize ${tournament.status === 'active' ? 'text-secondary' : 'text-primary'}`}>{tournament.status}</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-sm mt-1">{tournament.description}</Text>
            </View>

            <View className="bg-white/5 border border-white/15 rounded-2xl p-4 mb-4">
              <Text className="text-white font-bold mb-2">Teams ({tournament.teams?.length || 0} / {tournament.max_teams})</Text>
              {(tournament.teams || []).map(t => (
                <View key={t.team_id} className="flex-row items-center py-2 border-b border-border/50">
                  <Text className="text-white flex-1">{t.club_name}</Text>
                </View>
              ))}
              {(!tournament.teams || tournament.teams.length === 0) && <Text className="text-blue-100 text-sm">No teams joined yet</Text>}
            </View>

            <View className="gap-3">
              {tournament.status !== 'draft' && (
                <TouchableOpacity
                  className="bg-lineInner/60 border border-white/15 rounded-2xl py-3 items-center"
                  onPress={goToBracket}
                >
                  <Text className="text-light font-semibold">View Bracket / Standings</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="border border-white/15 rounded-2xl py-3 items-center"
                onPress={() =>
                  router.push({ pathname: '/(tabs)/tournaments/fixturesscreen', params: { tournamentId } })
                }
              >
                <Text className="text-white font-semibold">Fixtures</Text>
              </TouchableOpacity>
              {isOwner && tournament.status === 'draft' && (
                <TouchableOpacity
                  className="bg-white/10 border border-white/15 rounded-2xl py-3 items-center"
                  onPress={async () => {
                    await start(tournamentId);
                    api.get(`/tournaments/${tournamentId}`).then(r => setTournament(r.data.data));
                  }}
                >
                  <Text className="text-dark font-semibold">Start Tournament</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </GradientBackground>
    </View>
  );
}
