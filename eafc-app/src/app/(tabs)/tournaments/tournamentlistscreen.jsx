import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TournamentCard from '../../../components/tournament/TournamentCard';
import useTournamentsList from '../../../hooks/useTournamentsList';
import {
  GamerProfileShell,
  useGamerTokens,
} from '@/components/profile/gamer/GamerProfileUI';
import {
  GAME_DAY_SILVER,
  SectionTitle,
  TILE_BORDER,
  FUT,
} from '@/components/dashboard/CommandCenterUI';
import PageTile, { SilverPill } from '@/components/theme/PageTile';

const COMMUNITY_TABS = [
  { id: 'open', label: 'Open' },
  { id: 'live', label: 'Live' },
  { id: 'done', label: 'Done' },
];

export default function TournamentListScreen() {
  const router = useRouter();
  const tokens = useGamerTokens();
  const {
    loading,
    error,
    reload,
    stageTournaments,
    open,
    live,
    done,
    trophyShowcase,
    trophyItems,
  } = useTournamentsList();
  const [tab, setTab] = useState('open');
  const [refreshing, setRefreshing] = useState(false);

  const communityData = tab === 'open' ? open : tab === 'live' ? live : done;

  const tabs = useMemo(
    () => COMMUNITY_TABS.map((t) => ({
      ...t,
      badge: String(
        t.id === 'open' ? open.length : t.id === 'live' ? live.length : done.length,
      ),
    })),
    [open.length, live.length, done.length],
  );

  const openTournament = (id) => {
    router.push({
      pathname: '/(tabs)/tournaments/tournamentdetailscreen',
      params: { tournamentId: id },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const trophyUrlFor = (t) =>
    t.trophy_url || trophyItems.find((i) => String(i.id) === String(t.trophy_item_id))?.image_url;

  if (loading && !refreshing) {
    return (
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={GAME_DAY_SILVER} size="large" />
        </View>
      </GamerProfileShell>
    );
  }

  return (
    <GamerProfileShell>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GAME_DAY_SILVER} />
          }
        >
          <PageTile
            tileKey="tournaments"
            eyebrow="TOURNAMENTS"
            subtitle={`${stageTournaments.length} official · ${open.length + live.length} active`}
            contentStyle={{ paddingHorizontal: 12, gap: 16 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 18 }}>
              GOST, regional leagues, and community cups. Register here, play on Game Day.
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <SilverPill
                label="GOST"
                onPress={() => router.push('/apps/competitions')}
              />
              <SilverPill
                label="Register"
                onPress={() => router.push('/apps/register')}
              />
            </View>

            {error ? (
              <View>
                <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text>
                <TouchableOpacity onPress={reload} style={{ marginTop: 8 }}>
                  <Text style={{ color: GAME_DAY_SILVER, fontSize: 12, fontWeight: '800' }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {trophyShowcase.length > 0 ? (
              <View>
                <SectionTitle eyebrow="PRIZE POOL">Trophies at stake</SectionTitle>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                  {trophyShowcase.map((t) => {
                    const url = trophyUrlFor(t);
                    if (!url) return null;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => openTournament(t.id)}
                        activeOpacity={0.8}
                        style={{ width: 76, alignItems: 'center' }}
                      >
                        <View style={{
                          width: 64,
                          height: 64,
                          borderWidth: 1,
                          borderColor: TILE_BORDER,
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 6,
                        }}
                        >
                          <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                        </View>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: 9,
                            marginTop: 6,
                            textAlign: 'center',
                            fontWeight: '700',
                          }}
                        >
                          {t.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {stageTournaments.length > 0 ? (
              <View>
                <SectionTitle eyebrow="BY STAGE">Open tournaments</SectionTitle>
                <View style={{ gap: 10 }}>
                  {stageTournaments.map((t) => (
                    <TournamentCard
                      key={t.id}
                      tournament={t}
                      trophyItems={trophyItems}
                      onPress={() => openTournament(t.id)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View>
              <SectionTitle eyebrow="COMMUNITY">Open competition</SectionTitle>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
              >
                {tabs.map((item) => (
                  <SilverPill
                    key={item.id}
                    label={item.label}
                    badge={item.badge}
                    active={tab === item.id}
                    onPress={() => setTab(item.id)}
                  />
                ))}
              </ScrollView>

              {communityData.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 36, gap: 10 }}>
                  <Ionicons name="trophy-outline" size={36} color="rgba(255,255,255,0.2)" />
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '800' }}>
                    {`No ${tab} tournaments`}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center' }}>
                    Check back soon for open cups.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {communityData.map((t) => (
                    <TournamentCard
                      key={t.id}
                      tournament={t}
                      trophyItems={trophyItems}
                      onPress={() => openTournament(t.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          </PageTile>
        </ScrollView>
      </SafeAreaView>
    </GamerProfileShell>
  );
}
