import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import STText from '../../../components/common/STText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../../utils/api';
import useAuthStore from '../../../store/authStore';
import useColorSchemeColors from '../../../hooks/useColorSchemeColors';

const SAMPLE = {
  liveMatch: {
    home: 'LVFC',
    away: 'UNITED',
    score: '2 ~ 1',
    minute: "78'",
    players: ['@lengarose', '@lutina_17'],
  },
  upcoming: {
    fixture: 'LVFC vs Milan Club',
    countdown: 'Starts in 18m',
    competition: 'Supreme League',
    date: 'Jan 19',
  },
  invitation: {
    title: 'SUPREME LEAGUE',
    subtitle: 'League > Playoffs > Knockout',
  },
  activity: [
    { id: 1, title: 'FC LONGUE VIE signed @romedns', desc: '+ 3 new players joined' },
    { id: 2, title: 'NOTIFICATIONS', desc: 'New tournament available' },
  ],
  form: ['W', 'W', 'L', 'W'],
};

function GlassCard({ title, right, children }) {
  return (
    <View className="mx-4 mt-4 rounded-3xl border dark:border-[#C7D8F3]/20 border-[#C7D8F3] bg-darkCard dark:bg-[#F7FAFF]/10 bg-[#F7FAFF] px-4 py-4">
      <View className="mb-3 flex-row items-center justify-between">
        <STText className="text-[14px] font-black tracking-tight">{title}</STText>
        {right}
      </View>
      {children}
    </View>
  );
}

function GlassCardImage({ title, right, children }) {
  return (
    <ImageBackground source={require('../../../../assets/sumprem.png')} className="mx-4 mt-4 rounded-3xl px-4 py-4">
      <View className="mb-3 flex-row items-center justify-between">
        <STText className="text-[14px] font-black tracking-tight" style={{ color: '#1B2D4A' }}>{title}</STText>
        {right}
      </View>
      {children}
    </ImageBackground>
  );
}

function AvatarDot({ icon = 'person' }) {
  return (
    <View className="h-8 w-8 items-center justify-center rounded-full border border-[#D9E6FB] bg-white">
      <Ionicons name={icon} size={16} color="#3A4D6B" />
    </View>
  );
}

export default function PlayerDashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownedTeam, setOwnedTeam] = useState(null);
  const { isDark } = useColorSchemeColors();
  useEffect(() => {
    api
      .get(`/users/${user?.id ?? 0}/stats`)
      .then((r) => setStats(r.data.data))
      .catch(() => { })
      .finally(() => setLoading(false));

    api
      .get(`/users/${user?.id ?? 0}`)
      .then((r) => {
        const teams = r.data.data?.teams ?? [];
        const owned = teams.find((t) => t.role === 'owner');
        if (owned) setOwnedTeam(owned);
      })
      .catch(() => { });
  }, [user?.id]);

  const performance = useMemo(() => {
    const wins = stats?.wins ?? 0;
    const draws = stats?.draws ?? 0;
    const losses = stats?.losses ?? 0;
    const played = wins + draws + losses;
    const rating = played ? (6 + wins / Math.max(played, 1) * 4).toFixed(1) : '6.0';
    return { wins, draws, losses, rating };
  }, [stats]);

  return (
    <View className="flex-1">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView className="flex-1 pb-24" edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-4 pt-1 pb-2 flex-row items-center justify-between">
            {ownedTeam ? (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/dashboard/teamdashboardscreen',
                    params: { teamId: ownedTeam.id },
                  })
                }
                className="h-10 w-10 rounded-full border border-[#C9D8F2] bg-white dark:bg-white/20 items-center justify-center"
              >
                <Ionicons name="shield-outline" size={20} color={isDark ? "#FFFFFF" : "#1B2D4A"} />
              </TouchableOpacity>
            ) : (
              <View className="h-10 w-10 rounded-full border border-[#C9D8F2] dark:border-[#C7D8F3]/20 bg-white dark:bg-white/20 items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} className="h-10 w-10" />
                ) : (
                  <Ionicons name="person" size={20} color={isDark ? "#FFFFFF" : "#1B2D4A"} />
                )}
              </View>
            )}

            <View className="flex-row items-center">
              <STText className="text-[16px] font-semibold tracking-[3px] ml-1">STAGE</STText>
            </View>

            <TouchableOpacity className="h-10 w-10 rounded-full border border-[#C9D8F2] bg-white dark:bg-white/20 items-center justify-center">
              <Ionicons name="notifications-outline" size={20} color={isDark ? "#FFFFFF" : "#1B2D4A"} />
            </TouchableOpacity>
          </View>

          {/* Live matches */}
          <GlassCard
            title="LIVE MATCHES"
            right={
              <View className="flex-row items-center gap-1">
                <Ionicons name="radio-button-on" size={10} color="#D62839" />
                <STText className="text-xs font-semibold" style={{ color: '#D62839' }}>LIVE</STText>
              </View>
            }
          >
            <View className="rounded-2xl border border-[#D8E4F7] dark:border-[#C7D8F3]/20 bg-white dark:bg-white/20 px-3 py-3">
              <View className="flex-row items-start justify-between">
                <STText className="text-[20px] font-extrabold">
                  {SAMPLE.liveMatch.home} {SAMPLE.liveMatch.score} {SAMPLE.liveMatch.away}
                </STText>
                <STText className="text-[33px] font-bold">{SAMPLE.liveMatch.minute}</STText>
              </View>
              <View className="mt-2 flex-row items-center gap-2">
                <AvatarDot />
                <STText className="text-md">{SAMPLE.liveMatch.players[0]}</STText>
                <AvatarDot />
                <STText className="text-md">{SAMPLE.liveMatch.players[1]}</STText>
              </View>
            </View>
          </GlassCard>

          {/* Upcoming */}
          <GlassCard
            title="UPCOMING MATCHES"
            right={<STText className="text-[11px] rounded-full bg-[#E8F0FD] dark:bg-white/20 px-2 py-1">{SAMPLE.upcoming.date}</STText>}
          >
            <View className="rounded-2xl border border-[#D8E4F7] dark:border-[#C7D8F3]/20 dark:bg-white/20 bg-white px-3 py-3">
              <STText className="text-[20px] font-bold">{SAMPLE.upcoming.fixture}</STText>
              <STText className="mt-1" >{SAMPLE.upcoming.countdown}</STText>
              <View className="mt-3 flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={16} color="#4EAAC5" />
                <STText className="text-xs">{SAMPLE.upcoming.competition}</STText>
              </View>
            </View>
          </GlassCard>

          {/* Performance */}
          {/* <GlassCard title="PERFORMANCE SNAPSHOT">
            {loading ? (
              <ActivityIndicator color="#1B2D4A" />
            ) : (
              <View className="rounded-2xl border border-[#D8E4F7] bg-white p-3">
                <View className="flex-row justify-between">
                  <View className="items-center flex-1">
                    <STText className="text-2xl font-extrabold" style={{ color: '#18A957' }}>{performance.wins}</STText>
                    <STText className="text-xs" style={{ color: '#60728F' }}>Wins</STText>
                  </View>
                  <View className="items-center flex-1">
                    <STText className="text-2xl font-extrabold" style={{ color: '#E24E4E' }}>{performance.losses}</STText>
                    <STText className="text-xs" style={{ color: '#60728F' }}>Losses</STText>
                  </View>
                  <View className="items-center flex-1">
                    <STText className="text-2xl font-extrabold" style={{ color: '#5A6E8E' }}>{performance.draws}</STText>
                    <STText className="text-xs" style={{ color: '#60728F' }}>Draws</STText>
                  </View>
                  <View className="items-center flex-1">
                    <STText className="text-2xl font-extrabold" style={{ color: '#1A2D4C' }}>{performance.rating}</STText>
                    <STText className="text-xs" style={{ color: '#60728F' }}>Rating</STText>
                  </View>
                </View>
                <View className="mt-3 flex-row items-center">
                  <STText className="text-xs mr-2" style={{ color: '#5B6F8F' }}>Recent form:</STText>
                  <View className="flex-row gap-1">
                    {SAMPLE.form.map((f, idx) => (
                      <View key={`${f}-${idx}`} className={`h-6 w-6 rounded-full items-center justify-center ${f === 'W' ? 'bg-[#E3F8EC]' : 'bg-[#FBEAEA]'}`}>
                        <STText className="text-xs font-bold" style={{ color: f === 'W' ? '#18A957' : '#E24E4E' }}>{f}</STText>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </GlassCard> */}

          {/* Tournament invitation */}
          <GlassCard title="TOURNAMENT INVITATIONS" right={<STText className="text-xs">vs form ment</STText>}>
            <ImageBackground source={require('../../../../assets/sumprem.png')} resizeMode='stretch' className="rounded-2xl overflow-hidden border h-[150px] px-3 py-4">
              
              <TouchableOpacity className="mt-4 absolute bottom-5 right-6 w-40 rounded-xl bg-[#1C56C9] py-2.5 items-center">
                <STText className="font-semibold" style={{ color: '#FFFFFF' }}>Join Tournament</STText>
              </TouchableOpacity>
            </ImageBackground>
          </GlassCard>

          {/* Club activity */}
          <GlassCard title="CLUB ACTIVITY">
            <View className="rounded-2xl border border-[#D8E4F7] dark:border-white/20 bg-white dark:bg-white/20 overflow-hidden">
              {SAMPLE.activity.map((a, idx) => (
                <View key={a.id} className={`px-3 py-3 flex-row items-center ${idx === 0 ? 'border-b border-[#E6EEF9]' : ''}`}>
                  <View className="h-10 w-10 rounded-full bg-[#E9F0FD] items-center justify-center">
                    <Ionicons name={idx === 0 ? 'people-outline' : 'notifications-outline'} size={18} color="#1B2D4A" />
                  </View>
                  <View className="ml-3 flex-1">
                    <STText className="font-semibold">{a.title}</STText>
                    <STText className="text-xs mt-0.5" style={{ color: isDark ? '#E9F0FD' : '#5A6D8C' }}>{a.desc}</STText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={isDark ? "#E9F0FD" : "#5A6D8C"} />
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Quick actions */}
          <GlassCard title="QUICK ACTIONS">
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 rounded-2xl bg-[#1E57CB] py-3 items-center">
                <STText className="font-semibold" style={{ color: '#FFFFFF' }}>Find Match</STText>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 rounded-2xl border border-[#BFD1F0] dark:border-white/20 bg-white dark:bg-white/20 py-3 items-center">
                <STText className="font-semibold" >Join Tournament</STText>
              </TouchableOpacity>
            </View>
          </GlassCard>

          <View className="h-10" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
