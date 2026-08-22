import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { stageClient } from '@/api/stageClient';
import { loadClubProfile } from '@/lib/clubProfileData';
import { playerRoute } from '@/lib/stageNews';
import ClubProfileTabs from '@/app/(tabs)/profile/clubProfileTabs';
import ClubHero from '@/components/club/ClubHero';
import {
  GamerProfileShell,
  CYAN,
} from '@/components/profile/gamer/GamerProfileUI';

export default function PublicClubScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setBundle(null);
      setLoading(false);
      return;
    }
    const next = await loadClubProfile(String(id), stageClient);
    setBundle(next?.club ? next : null);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const club = bundle?.club;

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        {loading ? (
          <ActivityIndicator color={CYAN} style={{ marginTop: 40 }} />
        ) : !club ? (
          <Text style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 40 }}>
            Club not found
          </Text>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
            <ClubHero
              club={club}
              president={bundle.president}
              record={bundle.record}
              memberCount={bundle.players?.length}
              onBack={() => router.back()}
              onOpenPresident={() => {
                const route = playerRoute(bundle.president?.player_id || bundle.president?.id);
                if (route) router.push(route);
              }}
            />
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <ClubProfileTabs
                club={club}
                isOwner={false}
                isMember={false}
                players={bundle.players}
                matches={bundle.matches}
                upcomingMatches={bundle.upcomingMatches}
                posts={bundle.posts}
                trophies={bundle.trophies}
                record={bundle.record}
                contracts={bundle.contracts}
                stadium={bundle.stadium}
                finance={bundle.finance}
                shirts={bundle.shirts}
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </GamerProfileShell>
  );
}
