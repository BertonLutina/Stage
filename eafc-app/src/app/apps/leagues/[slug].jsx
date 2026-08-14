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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
} from '@/components/profile/gamer/GamerProfileUI';
import { FUT, SectionCard } from '@/components/dashboard/CommandCenterUI';
import { groupFixturesByMatchday, loadLeagueDetail } from '@/lib/competitionSeason';
import { createMatchFromFixture } from '@/lib/gameDayIntegration';
import { proposeTime, roleForClub } from '@/lib/scheduleEngine';

export default function LeagueDetailScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [myClub, setMyClub] = useState(null);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('table');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [{ user: u, club }, detail] = await Promise.all([
      resolveMyPlayerAndClub(),
      loadLeagueDetail(slug),
    ]);
    setUser(u);
    setMyClub(club || null);
    setData(detail);
    setLoading(false);
    setRefreshing(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const openFixture = async (fixture) => {
    try {
      if (fixture.match_id) {
        router.push({ pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId: fixture.match_id } });
        return;
      }
      const match = await createMatchFromFixture(fixture, 'regional_league');
      if (match?.id) router.push({ pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId: match.id } });
    } catch (err) {
      setError(err?.message || 'Could not open fixture');
    }
  };

  const propose = async (fixture) => {
    const role = roleForClub(fixture, myClub?.id);
    if (!role) return;
    try {
      await proposeTime({
        fixture,
        fixtureType: 'regional_league',
        role,
        proposedDate: new Date(Date.now() + 86400000).toISOString(),
        myClub,
        myEmail: user?.email,
        myGamertag: myClub?.name,
      });
      await load();
    } catch (err) {
      setError(err?.message || 'Could not propose time');
    }
  };

  if (loading || !data?.league) {
    return (
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {loading ? <ActivityIndicator color={CYAN} /> : <Text style={{ color: 'rgba(255,255,255,0.45)' }}>League not found</Text>}
        </View>
      </GamerProfileShell>
    );
  }

  const days = groupFixturesByMatchday(data.fixtures);

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <Text style={{ color: '#fff', fontWeight: '900', marginLeft: 12, flex: 1 }} numberOfLines={1}>
            {data.league.name}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 }}>
          {['table', 'fixtures'].map((id) => (
            <TouchableOpacity
              key={id}
              onPress={() => setTab(id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: tab === id ? 'rgba(0,232,255,0.16)' : 'transparent',
                borderWidth: 1,
                borderColor: tab === id ? 'rgba(0,232,255,0.4)' : 'rgba(255,255,255,0.12)',
              }}
            >
              <Text style={{ color: tab === id ? CYAN : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800' }}>
                {id.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={CYAN} />}
        >
          {error ? <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text> : null}
          {tab === 'table' ? (
            <SectionCard>
              {data.standings.map((row, i) => (
                <View key={row.id || i} style={{ flexDirection: 'row', paddingVertical: 8, gap: 8 }}>
                  <Text style={{ color: i === 0 ? FUT.gold : 'rgba(255,255,255,0.45)', width: 22, fontWeight: '900' }}>{i + 1}</Text>
                  <Text style={{ color: '#fff', flex: 1, fontWeight: '700' }}>{row.club_tag || row.club_name}</Text>
                  <Text style={{ color: '#fff', fontWeight: '900' }}>{row.points ?? 0}</Text>
                </View>
              ))}
            </SectionCard>
          ) : days.map((day) => (
            <SectionCard key={day.matchday}>
              <Text style={{ color: CYAN, fontSize: 11, fontWeight: '900', marginBottom: 6 }}>MATCHDAY {day.matchday}</Text>
              {day.rows.map((f) => (
                <View key={f.id} style={{ paddingVertical: 8 }}>
                  <TouchableOpacity onPress={() => openFixture(f)}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>{f.home_club_name} vs {f.away_club_name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{f.scheduling_status || f.status}</Text>
                  </TouchableOpacity>
                  {myClub && roleForClub(f, myClub.id) && ['open', 'home_proposed', 'away_proposed'].includes(f.scheduling_status) ? (
                    <TouchableOpacity onPress={() => propose(f)}>
                      <Text style={{ color: CYAN, fontSize: 11, fontWeight: '800' }}>Propose time</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </SectionCard>
          ))}
        </ScrollView>
      </SafeAreaView>
    </GamerProfileShell>
  );
}
