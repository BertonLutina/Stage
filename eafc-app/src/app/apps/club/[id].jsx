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
import ClubProfileTabs from '@/app/(tabs)/profile/clubProfileTabs';
import {
  GamerProfileShell,
  GamerBanner,
  GlassIconButton,
  CYAN,
} from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleLg } from '@/lib/fonts';

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
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <Text style={{ color: '#fff', fontWeight: '900', marginLeft: 12, fontSize: 16 }}>CLUB</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={CYAN} style={{ marginTop: 40 }} />
        ) : !club ? (
          <Text style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 40 }}>
            Club not found
          </Text>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
            <GamerBanner bannerUrl={club.banner_url} wash="club" height={140} />
            <View style={{ paddingHorizontal: 16, marginTop: -28, gap: 8 }}>
              <Text style={[headingStyleLg, { color: '#fff' }]}>{club.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
                {[club.tag ? `[${club.tag}]` : null, club.region, club.platform].filter(Boolean).join(' · ')}
              </Text>
              <ClubProfileTabs
                club={club}
                isOwner={false}
                players={bundle.players}
                matches={bundle.matches}
                upcomingMatches={bundle.upcomingMatches}
                posts={bundle.posts}
                historyRows={bundle.historyRows}
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
