import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  GamerProfileShell,
  GlassIconButton,
} from '@/components/profile/gamer/GamerProfileUI';
import { GAME_DAY_SILVER, SectionCard } from '@/components/dashboard/CommandCenterUI';
import PageTile, { PageTitle } from '@/components/theme/PageTile';
import { resolveMyPlayerAndClub, stageClient } from '@/api/stageClient';
import { COMPETITIONS } from '@/lib/competitionUtils';
import { loadCompetitionsHub, loadLeaguesHub } from '@/lib/competitionSeason';
import { clubPathway, qualificationRange } from '@/lib/gostOverview';

const TAP = 44;

function GostTrophy({ trophy, guidance }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [trophy?.id, trophy?.image_url]);
  if (trophy?.image_url && !failed) {
    return (
      <Image
        source={{ uri: trophy.image_url }}
        style={{ width: '100%', height: 160 }}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View style={{ height: 120, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 }}>
      <Ionicons name="trophy-outline" size={36} color="rgba(255,255,255,0.35)" />
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center' }}>
        {failed
          ? 'Trophy artwork unavailable.'
          : (guidance || 'No captured trophy design available.')}
      </Text>
    </View>
  );
}

export default function CompetitionsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState('');
  const [path, setPath] = useState(null);
  const [archive, setArchive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [hub, leagueHub, overviewResult] = await Promise.all([
      loadCompetitionsHub().catch(() => []),
      loadLeaguesHub().catch(() => []),
      stageClient.http.get('/gost/overview').catch((e) => {
        setOverviewError(e?.status === 404
          ? 'The GOST overview needs the matching backend update.'
          : (e?.message || 'GOST overview unavailable'));
        return null;
      }),
    ]);
    setRows(hub);
    setLeagues(leagueHub);
    if (overviewResult) {
      setOverview(overviewResult);
      setOverviewError('');
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const identity = await resolveMyPlayerAndClub();
        const club = identity.club || identity.presidentClub;
        if (!club) {
          if (active) setPath(clubPathway(null, [], [], []));
          return;
        }
        const [standings, entries] = await Promise.all([
          stageClient.entities.RegionalLeagueStanding.filter({ club_id: club.id }, '-season_number', 100).catch(() => []),
          stageClient.entities.QualificationEntry.filter({ club_id: club.id }, '-created_date', 100).catch(() => []),
        ]);
        const ids = [...new Set((standings || []).map((s) => s.league_id).filter(Boolean))];
        const leagueRows = await Promise.all(
          ids.map((id) => stageClient.entities.RegionalLeague.get(id).catch(() => null)),
        );
        if (active) setPath(clubPathway(club, leagueRows.filter(Boolean), standings || [], entries || []));
      } catch {
        if (active) {
          setPath({ text: 'Your club’s regional pathway is currently unavailable.', href: '/apps/competitions' });
        }
      }
    })();
    return () => { active = false; };
  }, []);

  const competitions = overview?.competitions || [];

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <TouchableOpacity
            onPress={() => router.push('/apps/register')}
            style={{ marginLeft: 'auto', minHeight: TAP, justifyContent: 'center' }}
          >
            <Text style={{ color: GAME_DAY_SILVER, fontWeight: '800', fontSize: 12 }}>REGISTER</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={GAME_DAY_SILVER} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            refreshControl={(
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(); }}
                tintColor={GAME_DAY_SILVER}
              />
            )}
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
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { label: 'Current season', value: false },
                  { label: 'Archive', value: true },
                ].map((tab) => (
                  <TouchableOpacity
                    key={tab.label}
                    onPress={() => setArchive(tab.value)}
                    style={{
                      minHeight: TAP,
                      paddingHorizontal: 12,
                      justifyContent: 'center',
                      borderBottomWidth: 2,
                      borderBottomColor: archive === tab.value ? GAME_DAY_SILVER : 'transparent',
                    }}
                  >
                    <Text style={{
                      color: archive === tab.value ? GAME_DAY_SILVER : 'rgba(255,255,255,0.45)',
                      fontWeight: '800',
                      fontSize: 12,
                    }}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {overviewError ? (
                <Text style={{ color: '#fb7185', fontSize: 12 }}>{overviewError}</Text>
              ) : null}

              {(overview ? COMPETITIONS : rows.map((r) => r.meta)).map((meta) => {
                const competition = competitions.find((c) => c.slug === meta.slug);
                const fallback = rows.find((r) => r.meta.slug === meta.slug);
                const season = archive
                  ? (competition?.archive?.[0] || null)
                  : (competition?.current || null);
                const trophy = archive ? season?.trophy : competition?.assignment?.trophy;
                const statusLine = season
                  ? `${season.label || season.status} · ${season.state || season.status || 'open'}`
                  : fallback?.season
                    ? `${fallback.season.status} · ${fallback.standings.length} clubs`
                    : 'Season not started';

                return (
                  <TouchableOpacity
                    key={meta.slug}
                    onPress={() => router.push({
                      pathname: '/apps/competitions/[slug]',
                      params: { slug: meta.slug },
                    })}
                  >
                    <SectionCard>
                      <GostTrophy
                        trophy={trophy}
                        guidance={competition?.assignment?.guidance}
                      />
                      <Text style={{ color: GAME_DAY_SILVER, fontSize: 10, fontWeight: '900', marginTop: 8 }}>
                        TIER {meta.tier}
                      </Text>
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 4 }}>
                        {(competition?.name || meta.name).replace(/^STAGE\s+/i, '')}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 }}>
                        Regional Division 1 · Positions {qualificationRange(meta.slug)}
                      </Text>
                      <Text style={{ color: GAME_DAY_SILVER, fontSize: 11, marginTop: 8, fontWeight: '800' }}>
                        {statusLine}
                      </Text>
                      {season?.registered != null ? (
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>
                          {season.registered} registered
                          {season.maximum ? ` · ${season.maximum} max` : ''}
                        </Text>
                      ) : null}
                    </SectionCard>
                  </TouchableOpacity>
                );
              })}

              <SectionCard>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Your club’s pathway</Text>
                {path?.league ? (
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 6 }}>
                    {path.club} · {path.league} · Division {path.division}
                  </Text>
                ) : null}
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8, lineHeight: 18 }}>
                  {path?.text || 'Loading your regional pathway...'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (path?.href?.startsWith('/apps/leagues/')) {
                      const slug = path.href.split('/').pop();
                      router.push({ pathname: '/apps/leagues/[slug]', params: { slug } });
                    } else {
                      router.push('/apps/competitions');
                    }
                  }}
                  style={{ marginTop: 12, minHeight: TAP, justifyContent: 'center' }}
                >
                  <Text style={{ color: GAME_DAY_SILVER, fontWeight: '800', fontSize: 12 }}>
                    Explore regional leagues
                  </Text>
                </TouchableOpacity>
              </SectionCard>

              <Text style={{ color: GAME_DAY_SILVER, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
                REGIONAL LEAGUES
              </Text>
              {leagues.map(({ region, leagues: list }) => (
                <SectionCard key={region.slug}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>{region.name}</Text>
                  {list.map((league) => (
                    <TouchableOpacity
                      key={league.id}
                      onPress={() => router.push({
                        pathname: '/apps/leagues/[slug]',
                        params: { slug: league.slug },
                      })}
                      style={{ paddingVertical: 10, minHeight: TAP, justifyContent: 'center' }}
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
