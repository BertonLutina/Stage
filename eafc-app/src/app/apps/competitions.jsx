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
} from '@/components/profile/gamer/GamerProfileUI';
import { GAME_DAY_SILVER, SectionCard } from '@/components/dashboard/CommandCenterUI';
import PageTile, { PageTitle } from '@/components/theme/PageTile';
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
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <TouchableOpacity onPress={() => router.push('/apps/register')} style={{ marginLeft: 'auto' }}>
            <Text style={{ color: GAME_DAY_SILVER, fontWeight: '800', fontSize: 12 }}>REGISTER</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={GAME_DAY_SILVER} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={GAME_DAY_SILVER} />}
          >
            <PageTitle
              title="GOST"
              subtitle="Global Official STAGE Tournaments"
              padded={false}
            />
            <PageTile
              tileKey="competitions"
              tileTitle="GOST"
              contentStyle={{ paddingHorizontal: 12, gap: 12 }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18 }}>
                Admins run Supreme, Elite and Challenger. Clubs register through regional leagues, then play on Game Day.
              </Text>

              {rows.map(({ meta, season, standings }) => (
                <TouchableOpacity
                  key={meta.slug}
                  onPress={() => router.push({ pathname: '/apps/competitions/[slug]', params: { slug: meta.slug } })}
                >
                  <SectionCard>
                    <Text style={{ color: GAME_DAY_SILVER, fontSize: 10, fontWeight: '900' }}>TIER {meta.tier}</Text>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 4 }}>{meta.name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 }}>{meta.description}</Text>
                    <Text style={{ color: GAME_DAY_SILVER, fontSize: 11, marginTop: 8, fontWeight: '800' }}>
                      {season ? `${season.status} · ${standings.length} clubs` : 'Season not started'}
                    </Text>
                  </SectionCard>
                </TouchableOpacity>
              ))}

              <Text style={{ color: GAME_DAY_SILVER, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
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
                      <Text style={{ color: GAME_DAY_SILVER, fontWeight: '700' }}>{league.name}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                        Div {league.division} · {league.status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </SectionCard>
              ))}
            </PageTile>
          </ScrollView>
        )}
      </SafeAreaView>
    </GamerProfileShell>
  );
}
