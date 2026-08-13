import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import STText from '../../../components/common/STText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import { resolveMyPlayerAndClub } from '../../../api/stageClient';
import { leaveStageClub } from '../../../lib/leaveClub';
import useAuthStore from '../../../store/authStore';
import useColorSchemeColors from '../../../hooks/useColorSchemeColors';
import BackButton from '../../../components/common/BackButton';

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

function GlassCard({ title, right, children }) {
  const { isDark } = useColorSchemeColors();
  return (
    <View
      className="mx-4 mt-4 rounded-3xl border px-4 py-4"
      style={{
        borderColor: isDark ? 'rgba(199,216,243,0.2)' : '#C7D8F3',
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
      }}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <STText className="text-[14px] font-black tracking-tight">{title}</STText>
        {right}
      </View>
      {children}
    </View>
  );
}

function Crest({ uri, name }) {
  const { isDark } = useColorSchemeColors();
  return (
    <View
      className="h-16 w-16 rounded-full border-2 overflow-hidden items-center justify-center"
      style={{
        borderColor: isDark ? 'rgba(155,183,231,0.5)' : '#9BB7E7',
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
      }}
    >
      {uri ? (
        <Image source={{ uri }} className="h-16 w-16" />
      ) : (
        <Ionicons name="shield" size={28} color={isDark ? '#E9F0FD' : '#1B2D4A'} />
      )}
      {!uri && (
        <STText className="text-[10px] font-bold absolute bottom-1" style={{ color: isDark ? '#E9F0FD' : '#1B2D4A' }}>
          {(name || 'FC').slice(0, 2).toUpperCase()}
        </STText>
      )}
    </View>
  );
}

export default function TeamDashboardScreen() {
  const { user, logout } = useAuthStore();
  const { teamId } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useColorSchemeColors();
  const [team, setTeam] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);

  useEffect(() => {
    if (!teamId) return;
    api
      .get(`/teams/${teamId}`)
      .then((r) => setTeam(r.data.data))
      .catch(() => {});
  }, [teamId]);

  useEffect(() => {
    if (!teamId || !user?.id) return;
    api.get(`/teams/${teamId}/join-request-status`).then((r) => setRequestStatus(r.data?.data?.status ?? null)).catch(() => setRequestStatus(null));
  }, [teamId, user?.id]);

  const isOwner = team?.owner_id === user?.id;
  const joined = !!(team?.players ?? []).some((p) => p.user_id === user?.id);
  const pending = requestStatus === 'pending';

  const handleJoinLeave = async () => {
    if (!user || !teamId || joinLoading) return;
    if (joined) {
      Alert.alert(
        'Leave Club',
        'Leave this club? Your player and president contracts with this club will end, and you will return to the transfer market as a free agent.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave Club', style: 'destructive', onPress: () => performJoinLeave() },
        ],
      );
      return;
    }
    await performJoinLeave();
  };

  const performJoinLeave = async () => {
    if (!user || !teamId || joinLoading) return;
    setJoinLoading(true);
    try {
      if (joined) {
        const rosterPlayer = (team?.players ?? []).find((p) => p.user_id === user?.id || p.id === user?.id);
        const playerId = rosterPlayer?.player_id || (await resolveMyPlayerAndClub())?.player?.id;
        if (!playerId) throw new Error('No player profile');
        await leaveStageClub({ clubId: teamId, playerId, userId: user.id });
        const refreshed = await api.get(`/teams/${teamId}`).catch(() => null);
        if (refreshed?.data?.data) setTeam(refreshed.data.data);
        else setTeam((prev) => (prev ? { ...prev, players: (prev.players || []).filter((p) => p.user_id !== user.id && p.id !== user.id) } : prev));
      } else {
        await api.post(`/teams/${teamId}/join-request`);
        setRequestStatus('pending');
        Alert.alert('Request sent', 'The club owner will review your request.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err?.message || (joined ? 'Failed to leave' : 'Failed to send request');
      if (err.response?.status === 409) setRequestStatus('pending');
      Alert.alert(joined ? 'Could not leave the club' : 'Request failed', msg);
    } finally {
      setJoinLoading(false);
    }
  };

  const total = (team?.wins ?? 0) + (team?.draws ?? 0) + (team?.losses ?? 0);
  const memberCount = team?.players?.length ?? 0;
  const winRate = useMemo(() => (total > 0 ? Math.round((team?.wins ?? 0) / total * 100) : 0), [team?.wins, total]);

  const innerCardStyle = {
    borderColor: isDark ? 'rgba(199,216,243,0.2)' : '#D8E4F7',
    backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
  };

  return (
    <View className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView className="flex-1 pb-24" edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-4 pt-1 pb-2 flex-row items-center justify-between">
            <BackButton />

            <View className="flex-row items-center">
              <STText className="text-[16px] font-semibold tracking-[3px] ml-1">STAGE</STText>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  await logout();
                  router.replace('/auth/loginscreen');
                }}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Club Hero */}
          <GlassCard
            title="CLUB OVERVIEW"
            right={
              <View className="flex-row items-center gap-1">
                <Ionicons name="checkmark-circle" size={14} color="#2F7EF7" />
                <STText className="text-xs font-semibold" style={{ color: '#2F7EF7' }}>Verified</STText>
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
                    <STText className="text-[25px] font-black" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{team.club_name}</STText>
                    <STText className="text-xs mt-1" style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>
                      Record: {team.wins ?? 0}W / {team.losses ?? 0}L / {team.draws ?? 0}D
                    </STText>
                  </View>
                </View>
                <View className="mt-3 flex-row flex-wrap">
                  <View className="w-1/2 py-1">
                    <STText className="text-xs" style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>Formation</STText>
                    <STText className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{SAMPLE.formation}</STText>
                  </View>
                  <View className="w-1/2 py-1">
                    <STText className="text-xs" style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>Captain</STText>
                    <STText className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{team.players?.find((p) => p.role === 'captain')?.gamer_tag || 'TBD'}</STText>
                  </View>
                  <View className="w-1/2 py-1">
                    <STText className="text-xs" style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>Total Players</STText>
                    <STText className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{memberCount}</STText>
                  </View>
                  <View className="w-1/2 py-1">
                    <STText className="text-xs" style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>Club Ranking</STText>
                    <STText className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{SAMPLE.ranking}</STText>
                  </View>
                </View>
              </>
            )}
          </GlassCard>

          {/* Roster */}
          <GlassCard title="ROSTER">
            {(team?.players ?? []).length === 0 ? (
              <STText style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>No players yet</STText>
            ) : (
              <View className="gap-2">
                {(team?.players ?? []).map((p, idx) => (
                  <View key={p.id || idx} className="rounded-2xl border px-3 py-2.5 flex-row items-center" style={innerCardStyle}>
                    <View className="h-10 w-10 rounded-full items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(234,241,253,0.3)' : '#EAF1FD' }}>
                      <Ionicons name="person" size={18} color={isDark ? '#E9F0FD' : '#1B2D4A'} />
                    </View>
                    <View className="ml-3 flex-1">
                      <STText className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{p.gamer_tag || `${p.first_name || ''} ${p.last_name || ''}`.trim()}</STText>
                      <STText className="text-xs" style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>{(p.position || 'Flex').toUpperCase()}</STText>
                    </View>
                    <STText className="font-bold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{88 - (idx % 6)}</STText>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>

          {/* Club matches */}
          <GlassCard title="CLUB MATCHES">
            <View className="rounded-2xl border px-3 py-3" style={innerCardStyle}>
              <STText className="font-semibold mb-2" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>Last Results</STText>
              {SAMPLE.lastResults.map((r, i) => (
                <STText key={i} className="text-xs mb-1" style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>{r}</STText>
              ))}
              <STText className="font-semibold mt-2 mb-2" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>Upcoming Fixtures</STText>
              {SAMPLE.upcoming.map((f, i) => (
                <STText key={i} className="text-xs mb-1" style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>{f}</STText>
              ))}
            </View>
          </GlassCard>

          {/* Club stats */}
          <GlassCard title="CLUB STATS">
            <View className="rounded-2xl border px-3 py-3" style={innerCardStyle}>
              <View className="flex-row justify-between mb-2">
                <STText style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>Total Wins</STText>
                <STText className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{team?.wins ?? 0}</STText>
              </View>
              <View className="flex-row justify-between mb-2">
                <STText style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>Win Rate</STText>
                <STText className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{winRate}%</STText>
              </View>
              <View className="flex-row justify-between mb-2">
                <STText style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>Goals Scored</STText>
                <STText className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{(team?.wins ?? 0) * 2 + (team?.draws ?? 0)}</STText>
              </View>
              <View className="flex-row justify-between">
                <STText style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>Tournament Wins</STText>
                <STText className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{Math.floor((team?.wins ?? 0) / 5)}</STText>
              </View>
            </View>
          </GlassCard>

          {/* Activity feed */}
          <GlassCard title="CLUB ACTIVITY FEED">
            <View className="rounded-2xl border overflow-hidden" style={{ ...innerCardStyle, borderColor: isDark ? 'rgba(199,216,243,0.2)' : '#D8E4F7' }}>
              {SAMPLE.activity.map((a, i) => (
                <View key={a.id} className={`px-3 py-3 ${i !== SAMPLE.activity.length - 1 ? 'border-b' : ''}`} style={{ borderBottomColor: isDark ? 'rgba(230,238,249,0.2)' : '#E6EEF9' }}>
                  <STText className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{a.label}</STText>
                  <STText className="text-xs mt-1" style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>{a.text}</STText>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Team chat */}
          <GlassCard title="TEAM CHAT PREVIEW">
            <View className="rounded-2xl border px-3 py-3" style={innerCardStyle}>
              {SAMPLE.chatPreview.map((m) => (
                <View key={m.id} className="mb-2">
                  <STText className="font-semibold text-xs" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>{m.user}</STText>
                  <STText className="text-xs" style={{ color: isDark ? '#E9F0FD' : '#5E718F' }}>{m.msg}</STText>
                </View>
              ))}
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/teams/teamchatscreen', params: { teamId, teamName: team?.club_name } })}
                className="mt-1 rounded-xl border py-2.5 items-center"
                style={{ borderColor: isDark ? 'rgba(199,216,243,0.3)' : '#C6D7F3', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F7FAFF' }}
              >
                <STText className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>Open Chat</STText>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* CTA */}
          <GlassCard title="INVITE PLAYER">
            <View className="flex-row gap-3">
              {isOwner && !joined ? (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/teams/manageteamscreen', params: { teamId } })}
                  className="flex-1 rounded-2xl bg-[#1E57CB] py-3 items-center"
                >
                  <STText className="font-semibold" style={{ color: '#FFFFFF' }}>Invite Player</STText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={joined || !isOwner ? handleJoinLeave : () => router.push({ pathname: '/teams/manageteamscreen', params: { teamId } })}
                  disabled={joinLoading || pending}
                  className="flex-1 rounded-2xl bg-[#1E57CB] py-3 items-center"
                >
                  {joinLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <STText className="font-semibold" style={{ color: '#FFFFFF' }}>
                      {joined ? 'Leave Club' : isOwner ? 'Invite Player' : pending ? 'Request Pending' : 'Join Club'}
                    </STText>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/teams/dressingroomscreen', params: { teamId } })}
                className="flex-1 rounded-2xl border py-3 items-center"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#BFD1F0',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                }}
              >
                <STText className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#1B2D4A' }}>Dressing Room</STText>
              </TouchableOpacity>
            </View>
          </GlassCard>

          <View className="h-10" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
