import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity,
  Image, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import STText from '../../../components/common/STText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';
import useAuthStore from '../../../store/authStore';
import GradientBackground from '../../../components/common/GradientBackground';
import useColorSchemeColors from '../../../hooks/useColorSchemeColors';
import ThemeToggle from '../../../components/common/ThemeToggle';
import BackButton from '../../../components/common/BackButton';
import { getIdentity } from '../../../services/playerIdentityService';

const PLATFORM_CONFIG = {
  PS: { icon: 'logo-playstation', label: 'PS' },
  Xbox: { icon: 'logo-xbox', label: 'Xbox' },
  PC: { icon: 'desktop-outline', label: 'PC' },
};

const TABS = ['Feed', 'Teams', 'Trophies', 'Stats'];

function AvatarCircle({ uri, name, size = 100, onPress }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: 3, borderColor: 'rgba(95,227,232,0.6)',
          overflow: 'hidden', backgroundColor: '#0E2454',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {uri
          ? <Image source={{ uri }} style={{ width: size, height: size }} />
          : (
            <LinearGradient
              colors={['#1A3566', '#0A1F4A']}
              style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="person" size={size * 0.45} color="rgba(95,227,232,0.5)" />
              <STText style={{ color: '#5FE3E8', fontWeight: '800', fontSize: size * 0.2, marginTop: 2 }}>
                {initials}
              </STText>
            </LinearGradient>
          )
        }
      </View>
    </Wrapper>
  );
}

function PlatformBadge({ platform }) {
  const config = PLATFORM_CONFIG[platform] || null;
  if (!config) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(95,227,232,0.15)', borderWidth: 1, borderColor: 'rgba(95,227,232,0.35)' }}>
      <Ionicons name={config.icon} size={14} color="#5FE3E8" />
      <STText style={{ color: '#5FE3E8', fontSize: 12, fontWeight: '700' }}>{config.label}</STText>
    </View>
  );
}

function StatColumn({ value, label }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <STText style={{ fontWeight: '800', fontSize: 20 }}>{value}</STText>
      <STText style={{ fontSize: 11, marginTop: 2 }}>{label}</STText>
    </View>
  );
}

const MOCK_FEED = [
  {
    id: 1,
    club: 'F.C. Longue Vie Clubs',
    sub: 'Shared post',
    text: "New matchday. Let's go, boys! 🏆🔥",
    image: null,
    time: '2h ago',
  },
];

export default function ProfileScreen() {
  const { user: me, logout } = useAuthStore();
  const { isDark } = useColorSchemeColors();
  const params = useLocalSearchParams();
  const router = useRouter();
  const userId = params?.userId || me?.id;
  const isOwn = !params?.userId || params.userId === me?.id;

  const [profile, setProfile] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [activeTab, setActiveTab] = useState('Feed');
  const [uploading, setUploading] = useState(false);

  const pickAndUploadAvatar = async () => {
    if (!isOwn || uploading) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('avatar', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        });
        const { data } = await api.put('/users/me', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        useAuthStore.getState().updateUser?.(data.data);
        setProfile((p) => (p ? { ...p, avatar: data.data?.avatar } : null));
      } catch (e) {
        Alert.alert('Upload failed', e.response?.data?.message || 'Could not update avatar.');
      } finally {
        setUploading(false);
      }
    }
  };

  useEffect(() => {
    api.get(`/users/${userId}`)
      .then(r => setProfile(r.data.data))
      .catch(() => setProfile({ first_name: me?.first_name, last_name: me?.last_name, gamer_tag: me?.gamer_tag, avatar: me?.avatar, stats: {} }));
  }, [userId]);

  useEffect(() => {
    if (isOwn && me?.id) {
      getIdentity(me.id).then(id => setPlatform(id?.platform || null));
    } else if (profile?.platform) {
      setPlatform(profile.platform);
    } else {
      setPlatform(null);
    }
  }, [isOwn, me?.id, profile?.platform]);

  return (
    <View style={{ flex: 1, paddingBottom:100 }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 4 }}>
            <BackButton variant="light" />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="stats-chart" size={13} color="#5FE3E8" />
              <STText style={{ fontWeight: '900', fontSize: 15, letterSpacing: 2 }}>STAGE</STText>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                await logout();
                router.replace('/auth/loginscreen');
              }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Avatar + Name ── */}
          <View style={{ alignItems: 'center', paddingTop: 24, paddingHorizontal: 24 }}>
            {profile
              ? (
                <AvatarCircle
                  uri={profile.avatar ? (profile.avatar.startsWith('http') ? profile.avatar : `${api.defaults.baseURL}${profile.avatar}`) : null}
                  name={`${profile.first_name} ${profile.last_name}`}
                  size={110}
                  onPress={isOwn ? pickAndUploadAvatar : undefined}
                />
              )
              : <ActivityIndicator size="large" color="#5FE3E8" />
            }
            {isOwn && profile && (
              <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploading} className="mt-2">
                <STText style={{ color: '#5FE3E8', fontSize: 12 }}>{uploading ? 'Uploading...' : 'Change photo'}</STText>
              </TouchableOpacity>
            )}

            <STText style={{ fontWeight: '900', fontSize: 24, marginTop: 14, textAlign: 'center' }}>
              {profile ? `${profile.first_name} ${profile.last_name}` : '—'}
            </STText>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
              <STText style={{ color: '#5FE3E8', fontSize: 14, fontWeight: '600' }}>
                @{profile?.gamer_tag || profile?.email?.split('@')[0] || 'player'}
              </STText>
              {platform && <PlatformBadge platform={platform} />}
            </View>

            {/* ── Action Buttons ── */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18, width: '100%' }}>
              {isOwn ? (
                <>
                  <TouchableOpacity
                    onPress={() => router.push('/profile/editprofilescreen')}
                    style={{ flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: '#fff', alignItems: 'center' }}
                  >
                    <STText style={{ fontWeight: '700', fontSize: 14 }}>Edit Profile</STText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="dark:bg-white/10 bg-white/30 border border-white/90"
                    onPress={() => router.push('/dashboard/playerdashboardscreen')}
                    style={{
                      flex: 1, paddingVertical: 11, borderRadius: 12,
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center'
                    }}
                  >
                    <STText style={{ fontWeight: '700', fontSize: 14 }}>Dashboard</STText>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: '#fff', alignItems: 'center' }}
                  >
                    <STText style={{ fontWeight: '700', fontSize: 14 }}>Follow</STText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="dark:bg-white/10 bg-white/30 border border-white/90"
                    style={{ flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' }}
                  >
                    <STText style={{ fontWeight: '700', fontSize: 14 }}>Message</STText>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {isOwn && (
              <View className="dark:bg-white/10 bg-white/30 border border-white/90" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', width: '100%' }}>
                <STText style={{ fontWeight: '600', fontSize: 14 }}>Theme</STText>
                <ThemeToggle />
              </View>
            )}

            {/* ── Stats Row ── */}
            <View style={{ flexDirection: 'row', marginTop: 22, width: '100%', paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <StatColumn value={profile?.followers_count ?? 0} label="Followers" />
              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
              <StatColumn value={(profile?.stats?.wins ?? 0) + (profile?.stats?.draws ?? 0) + (profile?.stats?.losses ?? 0)} label="Matches Played" />
              <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.12)' }} />
              <StatColumn value={profile?.stats?.wins ?? 0} label="Trophies" />
            </View>

            {/* ── Update Profile (own profile only) ── */}
            {isOwn && (
              <View style={{ marginTop: 16, width: '100%', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/profile/editprofilescreen')}
                  className="dark:bg-white/10 bg-white/30 rounded-2xl"
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A3566', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="create-outline" size={20} color="#5FE3E8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <STText style={{ fontWeight: '700', fontSize: 15 }}>Edit Profile</STText>
                    <STText style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 12, marginTop: 2 }}>Update name, gamer tag, bio...</STText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="dark:bg-white/10 bg-white/30 border border-white/20"

                  onPress={() => router.push('/(tabs)/profile/availabilityscreen')}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1 }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A3566', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="calendar-outline" size={20} color="#5FE3E8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <STText style={{ fontWeight: '700', fontSize: 15 }}>Availability</STText>
                    <STText style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 12, marginTop: 2 }}>Set when you can play</STText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="dark:bg-white/10 bg-white/30 border border-white/20"
                  onPress={() => router.push('/(tabs)/profile/connectiontestscreen')}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1 }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A3566', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="wifi-outline" size={20} color="#5FE3E8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <STText style={{ fontWeight: '700', fontSize: 15 }}>Connection Test</STText>
                    <STText style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 12, marginTop: 2 }}>Test with someone ~30km away</STText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Tab Bar ── */}
          <View style={{ flexDirection: 'row', marginTop: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab}

                onPress={() => setActiveTab(tab)}
                style={{ flex: 1, alignItems: 'center', borderRadius: 10, backgroundColor: activeTab === tab ? '#5FE3E8A3' : 'transparent', paddingBottom: activeTab === tab ? 5 : 5, paddingTop: activeTab === tab ? 5 : 5, borderWidth: activeTab === tab ? 2 : 0, borderColor: '#5FE3E8' }}
              >
                <STText style={{ color: activeTab === tab ? '#FFFFFF' : isDark ? 'rgba(255,255,255,0.45)' : '#02091B', fontWeight: activeTab === tab ? '700' : '500', fontSize: 13 }}>
                  {tab}
                </STText>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Tab Content ── */}
          {activeTab === 'Feed' && (
            <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 12 }}>
              {MOCK_FEED.map(post => (
                <View
                className="dark:bg-white/10 bg-white/40 border border-white/90"
                key={post.id} style={{  borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#1A3566', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="shield" size={20} color="#5FE3E8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <STText style={{ fontWeight: '700', fontSize: 13 }}>{post.club}</STText>
                      <STText style={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#02091B', fontSize: 11 }}>{post.sub}</STText>
                    </View>
                    <STText style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontSize: 11 }}>{post.time}</STText>
                  </View>
                  <STText style={{ fontSize: 14, paddingHorizontal: 12, paddingBottom: 10 }}>{post.text}</STText>
                  <View className="dark:bg-white/10 bg-white/40 border border-white/90" style={{ height: 160,  margin: 12, marginTop: 0, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.2)" />
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'Teams' && (
            <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
              {(profile?.teams ?? []).length === 0
                ? <STText style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'center', marginTop: 24 }}>No teams yet</STText>
                : (profile?.teams ?? []).map(t => (
                  <TouchableOpacity key={t.id} onPress={() => router.push({ pathname: '/teams/manageteamscreen', params: { teamId: t.id } })}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A3566', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="shield" size={20} color="#5FE3E8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <STText style={{ fontWeight: '700' }}>{t.club_name}</STText>
                      <STText style={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#02091B', fontSize: 12, textTransform: 'capitalize' }}>{t.role}</STText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                ))
              }
              {isOwn && (
                <TouchableOpacity
                  onPress={() => router.push('/teams/createteamscreen')}
                  className="mt-1 rounded-2xl bg-primary py-3.5 items-center "
                >
                  <STText className="font-bold" style={{ color: '#FFFFFF' }}>+ Create Team</STText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {activeTab === 'Stats' && (
            <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
              {[
                { label: 'Wins', value: profile?.stats?.wins ?? 0, color: '#22C55E' },
                { label: 'Draws', value: profile?.stats?.draws ?? 0, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' },
                { label: 'Losses', value: profile?.stats?.losses ?? 0, color: '#EF4444' },
                { label: 'Tournaments', value: profile?.stats?.tournaments_played ?? 0, color: '#F5C518' },
              ].map(s => (
                <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <STText style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 14 }}>{s.label}</STText>
                  <STText style={{ color: s.color, fontWeight: '800', fontSize: 18 }}>{s.value}</STText>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'Trophies' && (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Ionicons name="trophy-outline" size={56} color="rgba(245,197,24,0.4)" />
              <STText style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', marginTop: 12 }}>No trophies yet</STText>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
