import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { stageClient, resolveMyPlayerAndClub } from '@/api/stageClient';
import { loadClubProfile } from '@/lib/clubProfileData';
import { getPrimaryClubRole } from '@/lib/clubStaffRoles';
import { playerRoute } from '@/lib/stageNews';
import TeammateChatModal from '@/components/team/TeammateChatModal';
import ClubHero from '@/components/club/ClubHero';
import ClubProfileTabs from '@/app/(tabs)/profile/clubProfileTabs';
import {
  GamerProfileShell,
  AMBER,
} from '@/components/profile/gamer/GamerProfileUI';
import FollowToggleButton from '@/components/profile/FollowToggleButton';

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
        style={{ paddingVertical: 13, alignItems: 'center' }}
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
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myPlayer, setMyPlayer] = useState(null);
  const [chatPickerOpen, setChatPickerOpen] = useState(false);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadClubProfile(String(teamId), stageClient).then((next) => {
      setBundle(next?.club ? next : null);
    }).catch(() => setBundle(null)).finally(() => setLoading(false));
    resolveMyPlayerAndClub().then((resolved) => setMyPlayer(resolved?.player || null)).catch(() => setMyPlayer(null));
  }, [teamId]);

  const club = bundle?.club;
  const players = bundle?.players || [];
  const president = bundle?.president;
  const role = getPrimaryClubRole(myPlayer);
  const isMember = !!(myPlayer?.id && players.some((p) => String(p.id) === String(myPlayer.id) || String(p.user_id) === String(user?.id)));
  const isOwner = String(club?.owner_id) === String(user?.id) || (isMember && role === 'president');
  const isCaptain = isMember && role === 'captain';
  const isViceCaptain = isMember && (role === 'vice_captain' || role === 'vice-captain');
  const isPresident = isMember && role === 'president';
  const signedInClub = isMember || isOwner;

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

  if (loading || !club) {
    return (
      <GamerProfileShell>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {loading ? (
              <ActivityIndicator color={AMBER} />
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.45)' }}>Club not found</Text>
            )}
          </View>
        </SafeAreaView>
      </GamerProfileShell>
    );
  }

  const clubName = club.name || club.club_name || 'Club';
  const onPrimary = () => {
    if (signedInClub) openTeamChat(teamId, clubName);
  };

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <ClubHero
            club={club}
            president={president}
            record={bundle.record}
            memberCount={players.length}
            onBack={() => router.back()}
            onOpenPresident={() => {
              const route = playerRoute(president?.player_id || president?.id);
              if (route) router.push(route);
            }}
            extraActions={(
              <>
                {signedInClub ? (
                  <TouchableOpacity
                    onPress={() => setChatPickerOpen(true)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Chat"
                    style={{
                      minHeight: 44,
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
                {signedInClub ? (
                  <GoldCta
                    label="Team Chat"
                    onPress={onPrimary}
                  />
                ) : null}
              </>
            )}
          />

          <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
            <ClubProfileTabs
              club={club}
              isOwner={isOwner}
              isCaptain={isCaptain}
              isPresident={isPresident}
              isViceCaptain={isViceCaptain}
              isMember={signedInClub}
              currentPlayerId={myPlayer?.id || null}
              players={players}
              matches={bundle.matches}
              upcomingMatches={bundle.upcomingMatches}
              posts={bundle.posts}
              trophies={bundle.trophies}
              chatMessages={bundle.chatMessages}
              contracts={bundle.contracts}
              auditLogs={bundle.auditLogs}
              availability={bundle.availability}
              stadium={bundle.stadium}
              finance={bundle.finance}
              shirts={bundle.shirts}
            />
          </View>
        </ScrollView>
        <TeammateChatModal
          visible={chatPickerOpen}
          onClose={() => setChatPickerOpen(false)}
          teamId={teamId}
          myUserId={user?.id}
          players={players}
          onPick={openDirectChat}
        />
      </SafeAreaView>
    </GamerProfileShell>
  );
}
