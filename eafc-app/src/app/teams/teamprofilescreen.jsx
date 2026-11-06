import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, ActivityIndicator, StatusBar, Text, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import useAuthStore from '../../store/authStore';
import { stageClient, resolveMyPlayerAndClub } from '@/api/stageClient';
import useTeam from '@/hooks/useTeam';
import { getPrimaryClubRole } from '@/lib/clubStaffRoles';
import { playerRoute } from '@/lib/stageNews';
import { clubStatItems } from '@/lib/clubStatItems';
import ClubHero from '@/components/club/ClubHero';
import ClubProfileTabs from '@/app/(tabs)/profile/clubProfileTabs';
import { GamerProfileShell } from '@/components/profile/gamer/GamerProfileUI';
import useThemeStore from '@/store/themeStore';
import Card from '@/components/ui/Card';
import StatGrid from '@/components/ui/StatGrid';
import FollowToggleButton from '@/components/profile/FollowToggleButton';

export default function TeamProfileScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const teamId = params?.teamId;
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const [myPlayer, setMyPlayer] = useState(null);
  const { data, loading, error, refreshing, refetch } = useTeam(teamId);
  const bundle = data?.bundle || null;

  useEffect(() => {
    if (!teamId) return;
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

  if (loading || !club) {
    return (
      <GamerProfileShell>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {loading ? (
              <ActivityIndicator color={tokens.cyan} />
            ) : error ? (
              <View style={{ gap: 12, alignItems: 'center', paddingHorizontal: 24 }}>
                <Text style={{ color: tokens.danger, fontSize: 15, textAlign: 'center' }}>{error}</Text>
                <Text accessibilityRole="button" onPress={refetch} style={{ color: tokens.cyan, fontWeight: '700' }}>Try again</Text>
              </View>
            ) : (
              <Text style={{ color: tokens.muted, fontSize: 15 }}>Club not found</Text>
            )}
          </View>
        </SafeAreaView>
      </GamerProfileShell>
    );
  }

  const clubName = club.name || club.club_name || 'Club';
  const statItems = clubStatItems(bundle);

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
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
              <FollowToggleButton
                targetType="club"
                targetId={teamId}
                targetName={clubName}
                accent="amber"
                compact
                hidden={isOwner}
              />
            )}
          />

          <View style={{ paddingHorizontal: 20, marginTop: 14, gap: 14 }}>
            {statItems.length > 0 ? (
              <Card style={{ paddingVertical: 14 }}>
                <StatGrid items={statItems} columns={statItems.length} />
              </Card>
            ) : null}
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
      </SafeAreaView>
    </GamerProfileShell>
  );
}
