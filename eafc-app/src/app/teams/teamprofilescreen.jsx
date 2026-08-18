import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Image, Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';
import { stageClient } from '@/api/stageClient';
import ClubFormationCard from '@/components/team/ClubFormationCard';
import TeammateChatModal from '@/components/team/TeammateChatModal';
import { FORMATION_OPTIONS } from '@/lib/clubFormations';
import {
  GamerProfileShell,
  GamerBanner,
  GamerMetaPill,
  GamerRecordStrip,
  GamerTabNav,
  EmptyTabPanel,
  GlassIconButton,
  AMBER,
} from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleLg } from '@/lib/fonts';
import FollowToggleButton from '@/components/profile/FollowToggleButton';

const TABS = [
  { id: 'squad', label: 'Squad' },
  { id: 'lineup', label: 'Lineup' },
  { id: 'trophies', label: 'Trophies' },
];

function ClubCrest({ logoUrl, tag, platform, width = 108 }) {
  const height = Math.round(width * 1.2);
  return (
    <View
      style={{
        width,
        shadowColor: '#FFD60A',
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      }}
    >
      <LinearGradient
        colors={['#F6E27A', '#C9A227', '#8A6A12', '#F6E27A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, padding: 2 }}
      >
        <View
          style={{
            borderRadius: 14,
            overflow: 'hidden',
            height: height - 4,
            width: width - 4,
            backgroundColor: '#120E08',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={{ width: '78%', height: '58%' }} resizeMode="contain" />
          ) : (
            <Ionicons name="shield" size={42} color="rgba(255,214,10,0.35)" />
          )}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 10, alignItems: 'center', paddingHorizontal: 8 }}>
            <Text style={{ color: '#FFD60A', fontWeight: '900', fontSize: 13, letterSpacing: 1 }} numberOfLines={1}>
              {tag ? `[${tag}]` : 'CLUB'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
              {platform || ' '}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function MemberRow({ player, onPress }) {
  const name = player?.gamer_tag || player?.gamertag || [player?.first_name, player?.last_name].filter(Boolean).join(' ') || 'Player';
  const position = player?.position || player?.position_code || player?.role || 'Squad';
  const ovr = player?.overall_rating ?? player?.ovr;
  const ovrLabel = ovr == null || ovr === ''
    ? null
    : (Number.isInteger(Number(ovr)) ? String(Math.round(Number(ovr))) : (Math.round(Number(ovr) * 10) / 10).toFixed(1));
  const avatar = player?.avatar_url || player?.avatar;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingVertical: 10,
        paddingHorizontal: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          overflow: 'hidden',
          backgroundColor: '#101827',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,214,10,0.25)',
        }}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={{ width: 44, height: 44 }} />
        ) : (
          <Ionicons name="person" size={18} color="rgba(255,255,255,0.35)" />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }} numberOfLines={1}>{name}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2, letterSpacing: 0.4 }}>
          {String(position).replace(/_/g, ' ')}
        </Text>
      </View>
      {ovrLabel ? (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: AMBER, fontWeight: '900', fontSize: 18, letterSpacing: -0.5 }}>{ovrLabel}</Text>
          <Text style={{ color: 'rgba(255,214,10,0.55)', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>OVR</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function GoldCta({ label, onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ flex: 1, minHeight: 44, opacity: disabled ? 0.55 : 1 }}
    >
      <LinearGradient
        colors={['#FFD60A', '#C9A227']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 13, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: '#1A1200', fontSize: 12, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function TeamProfileScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const teamId = params?.teamId;
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [formationName, setFormationName] = useState('4-3-3');
  const [lineup, setLineup] = useState([]);
  const [activeTab, setActiveTab] = useState('squad');
  const [requestStatus, setRequestStatus] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [chatPickerOpen, setChatPickerOpen] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    api.get(`/teams/${teamId}`).then((r) => setTeam(r.data.data)).catch(() => setTeam(null));
    Promise.all([
      api.get(`/teams/${teamId}/formation`).then((r) => r.data?.data).catch(() => null),
      stageClient.entities.Club.get(teamId).catch(() => null),
    ]).then(([legacy, clubRow]) => {
      const name = clubRow?.formation || legacy?.name || legacy?.formation || '4-3-3';
      setFormationName(FORMATION_OPTIONS.includes(name) ? name : '4-3-3');
      if (Array.isArray(clubRow?.lineup) && clubRow.lineup.length) {
        setLineup(clubRow.lineup);
        return;
      }
      const positions = Array.isArray(legacy?.positions) ? legacy.positions : [];
      setLineup(positions.map((pos, i) => ({
        slot: i,
        player_id: pos.player_id || pos.user_id,
        gamertag: pos.gamertag || pos.gamer_tag,
        position: pos.position_code || pos.position,
        label: pos.position_code || pos.label,
      })).filter((row) => row.player_id));
    });
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    api.get(`/teams/${teamId}/join-request-status`)
      .then((r) => setRequestStatus(r.data?.data?.status ?? null))
      .catch(() => setRequestStatus(null));
  }, [teamId]);

  const isMember = !!(team?.players ?? []).some((p) => p.user_id === user?.id);
  const isOwner = team?.owner_id === user?.id || team?.user_id === user?.id || team?.players?.some((p) => p.user_id === user?.id && (p.role === 'owner' || p.role === 'president'));
  const signedInClub = isMember || isOwner;

  const handleJoinRequest = async () => {
    if (!teamId || joinLoading) return;
    setJoinLoading(true);
    try {
      await api.post(`/teams/${teamId}/join-request`);
      setRequestStatus('pending');
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to send request';
      if (e.response?.status === 409) setRequestStatus('pending');
      alert(msg);
    } finally {
      setJoinLoading(false);
    }
  };

  const openTeamChat = (id, name) => {
    router.push({
      pathname: '/teams/teamchatscreen',
      params: { teamId: id, teamName: name },
    });
  };

  const openDirectChat = ({ userId, name, avatar }) => {
    setChatPickerOpen(false);
    if (!userId) return;
    router.push({
      pathname: '/social/chatscreen',
      params: {
        userId: String(userId),
        name: name || '',
        avatar: avatar || '',
      },
    });
  };

  if (!team) {
    return (
      <GamerProfileShell>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={AMBER} />
          </View>
        </SafeAreaView>
      </GamerProfileShell>
    );
  }

  const clubName = team.club_name || team.name || 'Club';
  const tag = team.tag || team.handle;
  const members = team.players?.length || team.followers_count || 0;
  const wins = team.wins || 0;
  const draws = team.draws || 0;
  const losses = team.losses || 0;
  const hasRecord = wins + draws + losses > 0;
  const estYear = team.creation_date ? String(team.creation_date).slice(0, 4) : null;

  const primaryLabel = signedInClub
    ? 'Team Chat'
    : requestStatus === 'pending'
      ? 'Request Pending'
      : joinLoading
        ? 'Sending…'
        : 'Join Club';

  const onPrimary = () => {
    if (signedInClub) {
      openTeamChat(teamId, clubName);
      return;
    }
    if (requestStatus !== 'pending') handleJoinRequest();
  };

  const renderTabContent = () => {
    if (activeTab === 'squad') {
      if (!team.players?.length) {
        return (
          <EmptyTabPanel
            icon="people-outline"
            title="No squad yet"
            hint="Signed players will show here with position and OVR."
          />
        );
      }
      return (
        <View style={{ gap: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
            ROSTER · {team.players.length}
          </Text>
          {team.players.map((p) => (
            <MemberRow
              key={p.user_id || p.id}
              player={p}
              onPress={() => router.push({ pathname: '/(tabs)/profile', params: { userId: p.user_id } })}
            />
          ))}
        </View>
      );
    }

    if (activeTab === 'lineup') {
      return (
        <View style={{ gap: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
            LATEST LINEUP
          </Text>
          <ClubFormationCard
            formationName={formationName}
            lineup={lineup}
            players={team.players || []}
            clubName={clubName}
            logoUrl={team.logo_url || team.avatar}
            editable={false}
          />
        </View>
      );
    }

    if (activeTab === 'trophies') {
      return (
        <EmptyTabPanel
          icon="trophy-outline"
          title="No trophies yet"
          hint="Cabinet placements and club achievements will show here."
        />
      );
    }

    return null;
  };

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View>
            <GamerBanner
              bannerUrl={team.banner_url || team.banner}
              wash="club"
              height={132}
              topLeft={<GlassIconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel="Back" />}
            />
            <View style={{ paddingHorizontal: 16, marginTop: -72, zIndex: 10, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
                <ClubCrest
                  logoUrl={team.logo_url || team.avatar}
                  tag={tag}
                  platform={team.platform}
                  width={108}
                />
                <View style={{ flex: 1, paddingBottom: 4, gap: 8 }}>
                  <Text numberOfLines={2} style={[headingStyleLg, { color: '#fff', lineHeight: 28 }]}>
                    {clubName}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {tag ? (
                      <GamerMetaPill style={{ borderColor: 'rgba(255,214,10,0.35)' }}>[{tag}]</GamerMetaPill>
                    ) : null}
                    {team.platform ? (
                      <GamerMetaPill icon="game-controller" iconColor="#FFD60A">{team.platform}</GamerMetaPill>
                    ) : null}
                    {team.country || team.region ? (
                      <GamerMetaPill icon="globe-outline" iconColor="#FFD60A">{team.country || team.region}</GamerMetaPill>
                    ) : null}
                    <GamerMetaPill icon="people" iconColor="#FFD60A">{members} players</GamerMetaPill>
                    {estYear ? (
                      <GamerMetaPill icon="calendar-outline" iconColor="#FFD60A">Est. {estYear}</GamerMetaPill>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {signedInClub ? (
                  <TouchableOpacity
                    onPress={() => setChatPickerOpen(true)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Chat"
                    style={{
                      minHeight: 44,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.12)',
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color={AMBER} />
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>CHAT</Text>
                  </TouchableOpacity>
                ) : null}
                <FollowToggleButton
                  targetType="club"
                  targetId={teamId}
                  targetName={clubName}
                  accent="amber"
                  compact
                  hidden={isOwner}
                />
                <GoldCta
                  label={primaryLabel}
                  onPress={onPrimary}
                  disabled={!signedInClub && requestStatus === 'pending'}
                />
              </View>

              {hasRecord ? (
                <GamerRecordStrip wins={wins} draws={draws} losses={losses} />
              ) : (
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600' }}>
                  No competitive record yet
                </Text>
              )}

              {team.description ? (
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
                  {team.description}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, marginTop: 18, gap: 14 }}>
            <GamerTabNav tabs={TABS} active={activeTab} onChange={setActiveTab} accent="amber" />
            {renderTabContent()}
          </View>
        </ScrollView>
        <TeammateChatModal
          visible={chatPickerOpen}
          onClose={() => setChatPickerOpen(false)}
          teamId={teamId}
          myUserId={user?.id}
          players={team.players || []}
          onPick={openDirectChat}
        />
      </SafeAreaView>
    </GamerProfileShell>
  );
}
