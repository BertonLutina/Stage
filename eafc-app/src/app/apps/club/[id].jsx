import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import useTeam from '@/hooks/useTeam';
import { playerRoute } from '@/lib/stageNews';
import { clubStatItems } from '@/lib/clubStatItems';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import ClubProfileTabs from '@/app/(tabs)/profile/clubProfileTabs';
import ClubHero from '@/components/club/ClubHero';
import FollowToggleButton from '@/components/profile/FollowToggleButton';
import { GamerProfileShell } from '@/components/profile/gamer/GamerProfileUI';
import useThemeStore from '@/store/themeStore';
import { Button, Card, StatGrid } from '@/components/ui';

/** Screen gutter: matches ClubHero (20). */
const GUTTER = 20;

export default function PublicClubScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const [viewerClub, setViewerClub] = useState(null);
  const { data, loading, error, refreshing, refetch } = useTeam(id);
  const bundle = data?.bundle || null;

  useEffect(() => {
    resolveMyPlayerAndClub()
      .then((identity) => setViewerClub(identity?.presidentClub || null))
      .catch(() => setViewerClub(null));
  }, []);

  const club = bundle?.club;
  const statItems = clubStatItems(bundle);
  const canChallenge = Boolean(viewerClub?.id && String(viewerClub.id) !== String(club?.id));
  const clubName = club?.name || club?.club_name || 'Club';

  return (
    <GamerProfileShell>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={tokens.cyan} />
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: GUTTER }}>
            <Text style={{ color: tokens.danger, fontSize: 15, textAlign: 'center' }}>{error}</Text>
            <Text accessibilityRole="button" onPress={refetch} style={{ color: tokens.cyan, fontWeight: '700' }}>Try again</Text>
          </View>
        ) : !club ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: GUTTER }}>
            <Text style={{ color: tokens.muted, fontSize: 15, textAlign: 'center' }}>
              Club not found
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} />}
            contentContainerStyle={{ paddingBottom: guideFabClearanceStack(insets.bottom) }}
          >
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
              extraActions={(
                <>
                  <FollowToggleButton
                    targetType="club"
                    targetId={club.id}
                    targetName={clubName}
                    accent="amber"
                    compact
                    hidden={String(viewerClub?.id || '') === String(club.id)}
                  />
                  {canChallenge ? (
                    <View style={{ flex: 1, minWidth: 132 }}>
                      <Button
                        title="Challenge"
                        variant="secondary"
                        icon="football-outline"
                        onPress={() => router.push({
                          pathname: '/(tabs)/matches',
                          params: {
                            arrange: '1',
                            opponentKind: 'club',
                            opponentId: club.id,
                            opponentName: clubName,
                            opponentTag: club.tag || '',
                            opponentEmail: club.owner_email || '',
                          },
                        })}
                      />
                    </View>
                  ) : null}
                </>
              )}
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
