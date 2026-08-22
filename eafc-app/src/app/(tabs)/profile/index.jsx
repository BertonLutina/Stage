import React, { useEffect } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import useMyStageIdentities from '@/hooks/useMyStageIdentities';
import ProfileScreen from './profilescreen';
import { GamerProfileShell } from '@/components/profile/gamer/GamerProfileUI';

/**
 * Profile hub — player surface only.
 * Club is opened from the player page (club pill). President is a role on that page, not a tab.
 */
export default function ProfileIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams();
  const identities = useMyStageIdentities();

  const clubId = identities.presidentClub?.id || identities.club?.id || identities.player?.club_id || null;

  useEffect(() => {
    if (identities.loading) return;
    if (String(tab || '') !== 'squad' || !clubId) return;
    router.replace({
      pathname: '/teams/teamprofilescreen',
      params: { teamId: String(clubId) },
    });
  }, [identities.loading, tab, clubId, router]);

  if (identities.loading) {
    return (
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#00F0FF" />
        </View>
      </GamerProfileShell>
    );
  }

  const signedClub = identities.club
    && identities.player?.club_id
    && String(identities.club.id) === String(identities.player.club_id)
    ? identities.club
    : null;

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: 88, backgroundColor: 'transparent' }}>
        <ProfileScreen
          embedded
          player={identities.player}
          signedClub={signedClub}
          presidentClub={identities.presidentClub}
          onOpenClub={(teamId) => {
            if (!teamId) return;
            router.push({
              pathname: '/teams/teamprofilescreen',
              params: { teamId: String(teamId) },
            });
          }}
          onClubLeft={identities.refresh}
        />
      </View>
    </GamerProfileShell>
  );
}
