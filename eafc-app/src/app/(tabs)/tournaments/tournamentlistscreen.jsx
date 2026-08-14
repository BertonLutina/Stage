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
  GamerTabNav,
  GlassTextButton,
  CYAN,
  AMBER,
  useGamerTokens,
} from '@/components/profile/gamer/GamerProfileUI';
import {
  PitchAtmosphere,
  SectionCard,
  SectionTitle,
  FUT,
} from '@/components/dashboard/CommandCenterUI';
import { headingStyle, headingStyleSm } from '@/lib/fonts';

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
    canCreate,
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
          <ActivityIndicator color={CYAN} size="large" />
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 14 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />
          }
        >
          <PitchAtmosphere
            style={{
              borderWidth: 1.5,
              borderColor: 'rgba(255,210,74,0.4)',
              marginTop: 4,
              shadowColor: FUT.gold,
              shadowOpacity: 0.3,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 12,
            }}
          >
            <View style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[headingStyleSm, { color: FUT.gold, fontSize: 10, letterSpacing: 3.2 }]}>
                    COMPETITION
                  </Text>
                  <Text
                    style={[
                      headingStyle,
                      {
                        color: tokens.text,
                        marginTop: 6,
                        fontSize: 26,
                        textShadowColor: 'rgba(255,210,74,0.35)',
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 12,
                      },
                    ]}
                  >
                    Tournaments
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8, lineHeight: 18 }}>
                    Official open tournaments and community competition.
                  </Text>
                </View>
                {canCreate ? (
                  <GlassTextButton
                    label="Create"
                    icon="add"
                    onPress={() => router.push('/(tabs)/tournaments/createtournamentscreen')}
                  />
                ) : (
                  <View style={{
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 10,
                    maxWidth: 110,
                  }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '700', textAlign: 'center' }}>
                      STAGE Plus required
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,210,74,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,210,74,0.35)',
                }}
                >
                  <Text style={{ color: AMBER, fontSize: 11, fontWeight: '900' }}>
                    {stageTournaments.length} OFFICIAL
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: 'rgba(0,232,255,0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(0,232,255,0.3)',
                }}
                >
                  <Text style={{ color: CYAN, fontSize: 11, fontWeight: '900' }}>
                    {open.length + live.length} ACTIVE
                  </Text>
                </View>
              </View>
            </View>
          </PitchAtmosphere>

          {error ? (
            <SectionCard accent="rose">
              <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text>
              <TouchableOpacity onPress={reload} style={{ marginTop: 8 }}>
                <Text style={{ color: CYAN, fontSize: 12, fontWeight: '800' }}>Retry</Text>
              </TouchableOpacity>
            </SectionCard>
          ) : null}

          {trophyShowcase.length > 0 ? (
            <SectionCard accent="gold">
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
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: 'rgba(255,210,74,0.35)',
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
            </SectionCard>
          ) : null}

          {stageTournaments.length > 0 ? (
            <SectionCard accent="gold">
              <SectionTitle
                eyebrow="BY STAGE"
                right={(
                  <View style={{
                    borderWidth: 1,
                    borderColor: 'rgba(255,210,74,0.35)',
                    backgroundColor: 'rgba(255,210,74,0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                  >
                    <Text style={{
                      color: AMBER,
                      fontSize: 10,
                      fontWeight: '800',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                    >
                      Official
                    </Text>
                  </View>
                )}
              >
                Open tournaments
              </SectionTitle>
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
            </SectionCard>
          ) : null}

          <SectionCard>
            <SectionTitle eyebrow="COMMUNITY">Open competition</SectionTitle>
            <View style={{ marginBottom: 14 }}>
              <GamerTabNav tabs={tabs} active={tab} onChange={setTab} />
            </View>

            {communityData.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 36, gap: 10 }}>
                <Ionicons name="trophy-outline" size={36} color="rgba(255,255,255,0.2)" />
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '800' }}>
                  {`No ${tab} tournaments`}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center' }}>
                  Check back soon or create your own cup.
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
          </SectionCard>
        </ScrollView>
      </SafeAreaView>
    </GamerProfileShell>
  );
}
