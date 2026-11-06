import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { stageClient } from '@/api/stageClient';
import { loadClubProfile } from '@/lib/clubProfileData';
import { playerRoute } from '@/lib/stageNews';
import { clubStatItems } from '@/lib/clubStatItems';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import ClubProfileTabs from '@/app/(tabs)/profile/clubProfileTabs';
import ClubHero from '@/components/club/ClubHero';
import { GamerProfileShell } from '@/components/profile/gamer/GamerProfileUI';
import useThemeStore from '@/store/themeStore';
import { Card, StatGrid } from '@/components/ui';

/** Screen gutter: matches ClubHero (20). */
const GUTTER = 20;

export default function PublicClubScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
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
  const statItems = clubStatItems(bundle);

  return (
    <GamerProfileShell>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={tokens.cyan} />
          </View>
        ) : !club ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: GUTTER }}>
            <Text style={{ color: tokens.muted, fontSize: 15, textAlign: 'center' }}>
              Club not found
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: guideFabClearanceStack(insets.bottom) }}>
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
            <View style={{ paddingHorizontal: GUTTER, marginTop: 14, gap: 14 }}>
              {statItems.length > 0 ? (
                <Card style={{ paddingVertical: 14 }}>
                  <StatGrid items={statItems} columns={statItems.length} />
                </Card>
              ) : null}
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
