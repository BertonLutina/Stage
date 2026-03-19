import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import useAuthStore from '../../../store/authStore';
import GradientBackground from '../../../components/common/GradientBackground';

const SAMPLE = {
  formation: '4-3-3',
  ranking: '#12 Regional',
  lastResults: ['W 3-1', 'L 0-1', 'D 1-1'],
  upcoming: ['vs Milan Club - Tue 19:00', 'vs United Eleven - Sat 21:00'],
  activity: [
    { id: 1, label: 'Transfer', text: 'Signed @romedns from Free Agents' },
    { id: 2, label: 'Match', text: 'Won 3-1 against FC Longe Vie' },
    { id: 3, label: 'Announcement', text: 'Training at 20:00 tonight' },
  ],
  chatPreview: [
    { id: 1, user: 'Coach', msg: 'Lineup confirmed for tonight.' },
    { id: 2, user: 'Captain', msg: 'Everyone online 30m before kickoff.' },
  ],
};

function SectionCard({ title, children, right }) {
  return (
    <View className="mx-4 mt-4 rounded-3xl border border-[#C7D8F3] bg-[#F7FAFF] px-4 py-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[#1B2D4A] text-[20px] font-black tracking-tight">{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

function Crest({ uri, name }) {
  return (
    <View className="h-16 w-16 rounded-full border-2 border-[#9BB7E7] bg-white overflow-hidden items-center justify-center">
      {uri ? (
        <Image source={{ uri }} className="h-16 w-16" />
      ) : (
        <Ionicons name="shield" size={28} color="#1B2D4A" />
      )}
      {!uri && <Text className="text-[10px] text-[#1B2D4A] font-bold absolute bottom-1">{(name || 'FC').slice(0, 2).toUpperCase()}</Text>}
    </View>
  );
}

export default function TeamDashboardScreen() {
  const { teamId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    api
      .get(`/teams/${teamId}`)
      .then((r) => setTeam(r.data.data))
      .catch(() => {});
  }, [teamId]);

  const isOwner = team?.owner_id === user?.id;
  const total = (team?.wins ?? 0) + (team?.draws ?? 0) + (team?.losses ?? 0);
  const memberCount = team?.players?.length ?? 0;
  const winRate = useMemo(() => (total > 0 ? Math.round((team?.wins ?? 0) / total * 100) : 0), [team?.wins, total]);

  return (
    <View className="flex-1 bg-[#EEF4FF]">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientBackground>
        <SafeAreaView className="flex-1 pb-24" edges={['top']}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="px-4 pt-1 pb-2 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="h-10 w-10 rounded-full border border-[#C9D8F2] bg-white items-center justify-center"
              >
                <Ionicons name="chevron-back" size={20} color="#1B2D4A" />
              </TouchableOpacity>

              <View className="flex-row items-center">
                <Image source={require('../../../../assets/logo1.png')} className="h-12 w-12" style={{ resizeMode: 'contain' }} />
                <Text className="text-[#1A2D4C] text-[16px] font-semibold tracking-[3px] ml-1">STAGE</Text>
              </View>

              <TouchableOpacity className="h-10 w-10 rounded-full border border-[#C9D8F2] bg-white items-center justify-center">
                <Ionicons name="notifications-outline" size={20} color="#1B2D4A" />
              </TouchableOpacity>
            </View>

            {/* Club Hero */}
            <SectionCard
              title="CLUB OVERVIEW"
              right={
                <View className="flex-row items-center gap-1">
                  <Ionicons name="checkmark-circle" size={14} color="#2F7EF7" />
                  <Text className="text-[#2F7EF7] text-xs font-semibold">Verified</Text>
                </View>
              }
            >
              {!team ? (
                <ActivityIndicator color="#1B2D4A" />
              ) : (
                <>
                  <View className="flex-row items-center">
                    <Crest uri={team.avatar} name={team.club_name} />
                    <View className="ml-3 flex-1">
                      <Text className="text-[#1B2D4A] text-[25px] font-black">{team.club_name}</Text>
                      <Text className="text-[#5E718F] text-xs mt-1">
                        Record: {team.wins ?? 0}W / {team.losses ?? 0}L / {team.draws ?? 0}D
                      </Text>
                    </View>
                  </View>
                  <View className="mt-3 flex-row flex-wrap">
                    <View className="w-1/2 py-1"><Text className="text-[#5E718F] text-xs">Formation</Text><Text className="text-[#1B2D4A] font-semibold">{SAMPLE.formation}</Text></View>
                    <View className="w-1/2 py-1"><Text className="text-[#5E718F] text-xs">Captain</Text><Text className="text-[#1B2D4A] font-semibold">{team.players?.find((p) => p.role === 'captain')?.gamer_tag || 'TBD'}</Text></View>
                    <View className="w-1/2 py-1"><Text className="text-[#5E718F] text-xs">Total Players</Text><Text className="text-[#1B2D4A] font-semibold">{memberCount}</Text></View>
                    <View className="w-1/2 py-1"><Text className="text-[#5E718F] text-xs">Club Ranking</Text><Text className="text-[#1B2D4A] font-semibold">{SAMPLE.ranking}</Text></View>
                  </View>
                </>
              )}
            </SectionCard>

            {/* Roster */}
            <SectionCard title="ROSTER">
              {(team?.players ?? []).length === 0 ? (
                <Text className="text-[#5E718F]">No players yet</Text>
              ) : (
                <View className="gap-2">
                  {(team?.players ?? []).map((p, idx) => (
                    <View key={p.id || idx} className="rounded-2xl border border-[#D8E4F7] bg-white px-3 py-2.5 flex-row items-center">
                      <View className="h-10 w-10 rounded-full bg-[#EAF1FD] items-center justify-center">
                        <Ionicons name="person" size={18} color="#1B2D4A" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-[#1B2D4A] font-semibold">{p.gamer_tag || `${p.first_name || ''} ${p.last_name || ''}`.trim()}</Text>
                        <Text className="text-[#5E718F] text-xs">{(p.position || 'Flex').toUpperCase()}</Text>
                      </View>
                      <Text className="text-[#1B2D4A] font-bold">{88 - (idx % 6)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>

            {/* Club matches */}
            <SectionCard title="CLUB MATCHES">
              <View className="rounded-2xl border border-[#D8E4F7] bg-white p-3">
                <Text className="text-[#1B2D4A] font-semibold mb-2">Last Results</Text>
                {SAMPLE.lastResults.map((r, i) => (
                  <Text key={i} className="text-[#5E718F] text-xs mb-1">{r}</Text>
                ))}
                <Text className="text-[#1B2D4A] font-semibold mt-2 mb-2">Upcoming Fixtures</Text>
                {SAMPLE.upcoming.map((f, i) => (
                  <Text key={i} className="text-[#5E718F] text-xs mb-1">{f}</Text>
                ))}
              </View>
            </SectionCard>

            {/* Club stats */}
            <SectionCard title="CLUB STATS">
              <View className="rounded-2xl border border-[#D8E4F7] bg-white p-3">
                <View className="flex-row justify-between mb-2"><Text className="text-[#5E718F]">Total Wins</Text><Text className="text-[#1B2D4A] font-semibold">{team?.wins ?? 0}</Text></View>
                <View className="flex-row justify-between mb-2"><Text className="text-[#5E718F]">Win Rate</Text><Text className="text-[#1B2D4A] font-semibold">{winRate}%</Text></View>
                <View className="flex-row justify-between mb-2"><Text className="text-[#5E718F]">Goals Scored</Text><Text className="text-[#1B2D4A] font-semibold">{(team?.wins ?? 0) * 2 + (team?.draws ?? 0)}</Text></View>
                <View className="flex-row justify-between"><Text className="text-[#5E718F]">Tournament Wins</Text><Text className="text-[#1B2D4A] font-semibold">{Math.floor((team?.wins ?? 0) / 5)}</Text></View>
              </View>
            </SectionCard>

            {/* Activity feed */}
            <SectionCard title="CLUB ACTIVITY FEED">
              <View className="rounded-2xl border border-[#D8E4F7] bg-white overflow-hidden">
                {SAMPLE.activity.map((a, i) => (
                  <View key={a.id} className={`px-3 py-3 ${i !== SAMPLE.activity.length - 1 ? 'border-b border-[#E6EEF9]' : ''}`}>
                    <Text className="text-[#1B2D4A] font-semibold">{a.label}</Text>
                    <Text className="text-[#5E718F] text-xs mt-1">{a.text}</Text>
                  </View>
                ))}
              </View>
            </SectionCard>

            {/* Team chat */}
            <SectionCard title="TEAM CHAT PREVIEW">
              <View className="rounded-2xl border border-[#D8E4F7] bg-white p-3">
                {SAMPLE.chatPreview.map((m) => (
                  <View key={m.id} className="mb-2">
                    <Text className="text-[#1B2D4A] font-semibold text-xs">{m.user}</Text>
                    <Text className="text-[#5E718F] text-xs">{m.msg}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => router.push('/social/messagesscreen')}
                  className="mt-1 rounded-xl border border-[#C6D7F3] bg-[#F7FAFF] py-2.5 items-center"
                >
                  <Text className="text-[#1B2D4A] font-semibold">Open Chat</Text>
                </TouchableOpacity>
              </View>
            </SectionCard>

            {/* CTA */}
            <SectionCard title="INVITE PLAYER">
              <View className="flex-row gap-3">
                {isOwner ? (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/teams/manageteamscreen', params: { teamId } })}
                    className="flex-1 rounded-2xl bg-[#1E57CB] py-3 items-center"
                  >
                    <Text className="text-white font-semibold">Invite Player</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => setJoined((j) => !j)}
                    className="flex-1 rounded-2xl bg-[#1E57CB] py-3 items-center"
                  >
                    <Text className="text-white font-semibold">{joined ? 'Leave Club' : 'Join Club'}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/teams/dressingroomscreen', params: { teamId } })}
                  className="flex-1 rounded-2xl border border-[#BFD1F0] bg-white py-3 items-center"
                >
                  <Text className="text-[#1B2D4A] font-semibold">Dressing Room</Text>
                </TouchableOpacity>
              </View>
            </SectionCard>

            <View className="h-10" />
          </ScrollView>
        </SafeAreaView>
      </GradientBackground>
    </View>
  );
}
