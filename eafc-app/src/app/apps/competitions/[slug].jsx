import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { Screen, Card, Chip, SectionLabel } from '@/components/ui';
import CompetitionHeader from '@/components/tournament/CompetitionHeader';
import StandingsTable from '@/components/tournament/StandingsTable';
import TournamentLeaderboard from '@/components/tournament/TournamentLeaderboard';
import { loadCompetitionDetail, groupFixturesByMatchday } from '@/lib/competitionSeason';
import { createMatchFromFixture } from '@/lib/gameDayIntegration';
import { proposeTime, roleForClub } from '@/lib/scheduleEngine';

export default function CompetitionDetailScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
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
      loadCompetitionDetail(slug),
    ]);
    setUser(u);
    setMyClub(club || null);
    setData(detail);
    setLoading(false);
    setRefreshing(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const openFixture = async (fixture) => {
    setError('');
    try {
      if (fixture.match_id) {
        router.push({ pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId: fixture.match_id } });
        return;
      }
      if (fixture.scheduling_status === 'confirmed' || fixture.status === 'scheduled') {
        const match = await createMatchFromFixture(fixture, 'competition');
        if (match?.id) {
          router.push({ pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId: match.id } });
        }
      }
    } catch (err) {
      setError(err?.message || 'Could not open fixture');
    }
  };

  const propose = async (fixture) => {
    const role = roleForClub(fixture, myClub?.id);
    if (!role) return;
    const date = fixture.home_proposed_date || fixture.away_proposed_date || new Date(Date.now() + 86400000).toISOString();
    try {
      await proposeTime({
        fixture,
        fixtureType: 'competition',
        role,
        proposedDate: date,
        myClub,
        myEmail: user?.email,
        myGamertag: myClub?.name,
      });
      await load();
    } catch (err) {
      setError(err?.message || 'Could not propose time');
    }
  };

  if (loading || !data) {
    return (
      <Screen scroll={false} tabBar={false} guideFab>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.cyan} />
        </View>
      </Screen>
    );
  }

  const days = groupFixturesByMatchday(data.fixtures);

  return (
    <Screen
      tabBar={false} guideFab
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={tokens.cyan} />}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ gap: 14 }}>
        <CompetitionHeader title={data.meta.name} onBack={() => router.back()} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['table', 'fixtures', 'stats'].map((id) => (
            <Chip key={id} label={id.toUpperCase()} active={tab === id} onPress={() => setTab(id)} />
          ))}
        </View>
        {error ? <Text style={{ color: tokens.danger, fontSize: 12 }}>{error}</Text> : null}
        {tab === 'table' ? (
          <StandingsTable
            title="Season table"
            rows={data.standings}
            emptyLabel="Season table is empty."
          />
        ) : tab === 'stats' && data.season?.id ? (
          <TournamentLeaderboard
            tournamentId={data.season.id}
            title="Season Statistics"
            statisticsUrl={`/competition-views/competition_season/${encodeURIComponent(data.season.id)}/statistics`}
          />
        ) : tab === 'stats' ? (
          <Text style={{ color: tokens.muted, textAlign: 'center', paddingVertical: 24, fontSize: 14 }}>
            No active season for statistics.
          </Text>
        ) : days.map((day) => (
          <Card key={day.matchday} style={{ gap: 4 }}>
            <SectionLabel>{`MATCHDAY ${day.matchday}`}</SectionLabel>
            {day.rows.map((f) => (
              <View
                key={f.id}
                style={{ paddingVertical: 4, borderTopWidth: 1, borderTopColor: tokens.border }}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openFixture(f)}
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Text numberOfLines={2} style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>
                    {f.home_club_name} vs {f.away_club_name}
                  </Text>
                  <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>
                    {f.scheduling_status || f.status}
                    {f.confirmed_date ? ` · ${String(f.confirmed_date).slice(0, 16)}` : ''}
                  </Text>
                </Pressable>
                {myClub && roleForClub(f, myClub.id) && ['open', 'home_proposed', 'away_proposed'].includes(f.scheduling_status) ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => propose(f)}
                    style={{ minHeight: 44, justifyContent: 'center' }}
                  >
                    <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '700' }}>Propose / counter time</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </Card>
        ))}
      </View>
    </Screen>
  );
}
