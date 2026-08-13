import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';
import { FUT, PitchAtmosphere, SectionCard } from '@/components/dashboard/CommandCenterUI';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import { loadCompetitionsHub, loadLeaguesHub } from '@/lib/competitionSeason';

export default function CompetitionsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [hub, leagueHub] = await Promise.all([
      loadCompetitionsHub().catch(() => []),
      loadLeaguesHub().catch(() => []),
    ]);
    setRows(hub);
    setLeagues(leagueHub);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <Text style={{ color: '#fff', fontWeight: '900', marginLeft: 12, fontSize: 16 }}>COMPETITIONS</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={CYAN} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 12 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={CYAN} />}
          >
            <PitchAtmosphere style={{ borderWidth: 1.5, borderColor: 'rgba(0,232,255,0.35)' }}>
              <View style={{ padding: 18 }}>
                <Text style={[headingStyleSm, { color: FUT.cyan, fontSize: 10, letterSpacing: 3 }]}>SEASON</Text>
                <Text style={[headingStyle, { color: '#fff', fontSize: 24, marginTop: 6 }]}>Official path</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 12 }}>
                  Regional leagues feed Challenger, Elite, then Supreme.
                </Text>
              </View>
            </PitchAtmosphere>

            {rows.map(({ meta, season, standings }) => (
              <TouchableOpacity
                key={meta.slug}
                onPress={() => router.push({ pathname: '/apps/competitions/[slug]', params: { slug: meta.slug } })}
              >
                <SectionCard>
                  <Text style={{ color: FUT.gold, fontSize: 10, fontWeight: '900' }}>TIER {meta.tier}</Text>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 4 }}>{meta.name}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 }}>{meta.description}</Text>
                  <Text style={{ color: CYAN, fontSize: 11, marginTop: 8, fontWeight: '800' }}>
                    {season ? `${season.status} · ${standings.length} clubs` : 'Season not started'}
                  </Text>
                </SectionCard>
              </TouchableOpacity>
            ))}

            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
              REGIONAL LEAGUES
            </Text>
            {leagues.map(({ region, leagues: list }) => (
              <SectionCard key={region.slug}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{region.name}</Text>
                {list.map((league) => (
                  <TouchableOpacity
                    key={league.id}
                    onPress={() => router.push({ pathname: '/apps/leagues/[slug]', params: { slug: league.slug } })}
                    style={{ paddingVertical: 8 }}
                  >
                    <Text style={{ color: CYAN, fontWeight: '700' }}>{league.name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                      Div {league.division} · {league.status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </SectionCard>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </GamerProfileShell>
  );
}
