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
import FixtureScheduleActions from '@/components/schedule/FixtureScheduleActions';
import { groupFixturesByMatchday, loadLeagueDetail } from '@/lib/competitionSeason';
import { canOpenGameDayFromFixture, createMatchFromFixture } from '@/lib/gameDayIntegration';
import { pickMyClubForMatch, uniqueIdentityClubs } from '@/lib/gameDayOps';

export default function LeagueDetailScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [identityClubs, setIdentityClubs] = useState([]);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('table');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [{ user: u, player, club, presidentClub }, detail] = await Promise.all([
      resolveMyPlayerAndClub(),
      loadLeagueDetail(slug),
    ]);
    setUser(u);
    setIdentityClubs(uniqueIdentityClubs(
      player?.club_id ? { id: player.club_id } : null,
      club,
      presidentClub,
    ));
    setData(detail);
    setLoading(false);
    setRefreshing(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const clubForFixture = (fixture) => pickMyClubForMatch(fixture, identityClubs);

  const openFixture = async (fixture) => {
    setError('');
    if (!canOpenGameDayFromFixture(fixture)) return;
    try {
      let matchId = fixture.match_id;
      if (!matchId) {
        const match = await createMatchFromFixture(fixture, 'regional_league');
        matchId = match?.id;
      }
      if (matchId) {
        router.push({ pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId } });
      }
    } catch (err) {
      setError(err?.message || 'Could not open fixture');
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
              {day.rows.map((f) => {
                const sideClub = clubForFixture(f);
                return (
                  <View key={f.id} style={{ paddingVertical: 8 }}>
                    <TouchableOpacity onPress={() => openFixture(f)}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>{f.home_club_name} vs {f.away_club_name}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{f.scheduling_status || f.status}</Text>
                    </TouchableOpacity>
                    <FixtureScheduleActions
                      fixture={f}
                      fixtureType="regional_league"
                      myClub={sideClub}
                      userEmail={user?.email}
                      userGamertag={sideClub?.name}
                      onDone={load}
                      onError={setError}
                    />
                  </View>
                );
              })}
            </SectionCard>
          ))}
        </ScrollView>
      </SafeAreaView>
    </GamerProfileShell>
  );
}
