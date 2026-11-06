import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { Screen, Card, Chip, IconButton, SectionLabel, SegmentedControl } from '@/components/ui';
import PageTile, { PageTitle } from '@/components/theme/PageTile';
import { resolveMyPlayerAndClub, stageClient } from '@/api/stageClient';
import { COMPETITIONS } from '@/lib/competitionUtils';
import { loadCompetitionsHub, loadLeaguesHub } from '@/lib/competitionSeason';
import { clubPathway, qualificationRange } from '@/lib/gostOverview';

const TAP = 44;

function GostTrophy({ trophy, guidance, tokens }) {
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
      <Ionicons name="trophy-outline" size={36} color={tokens.muted} />
      <Text style={{ color: tokens.muted, fontSize: 12, textAlign: 'center' }}>
        {failed
          ? 'Trophy artwork unavailable.'
          : (guidance || 'No captured trophy design available.')}
      </Text>
    </View>
  );
}

export default function CompetitionsScreen() {
  const router = useRouter();
  const tokens = useThemeStore((st) => st.tokens);
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
    <Screen
      tabBar={false} guideFab
      scroll={!loading}
      refreshControl={loading ? undefined : (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={tokens.cyan}
        />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <IconButton icon="chevron-back" accessibilityLabel="Back" onPress={() => router.back()} />
        <Chip label="REGISTER" onPress={() => router.push('/apps/register')} />
      </View>
      {loading ? (
        <ActivityIndicator color={tokens.cyan} style={{ marginTop: 40 }} />
      ) : (
        <>
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
            <SegmentedControl
              options={[
                { key: 'current', label: 'Current season' },
                { key: 'archive', label: 'Archive' },
              ]}
              value={archive ? 'archive' : 'current'}
              onChange={(key) => setArchive(key === 'archive')}
            />

            {overviewError ? (
              <Text style={{ color: tokens.danger, fontSize: 12 }}>{overviewError}</Text>
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
                <Card
                  key={meta.slug}
                  onPress={() => router.push({
                    pathname: '/apps/competitions/[slug]',
                    params: { slug: meta.slug },
                  })}
                >
                  <GostTrophy
                    tokens={tokens}
                    trophy={trophy}
                    guidance={competition?.assignment?.guidance}
                  />
                  <Text style={{ color: tokens.cyan, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, marginTop: 8 }}>
                    TIER {meta.tier}
                  </Text>
                  <Text numberOfLines={2} style={{ color: tokens.text, fontWeight: '700', fontSize: 17, marginTop: 4 }}>
                    {(competition?.name || meta.name).replace(/^STAGE\s+/i, '')}
                  </Text>
                  <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                    Regional Division 1 · Positions {qualificationRange(meta.slug)}
                  </Text>
                  <Text style={{ color: tokens.textSoft, fontSize: 12, marginTop: 8, fontWeight: '600' }}>
                    {statusLine}
                  </Text>
                  {season?.registered != null ? (
                    <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                      {season.registered} registered
                      {season.maximum ? ` · ${season.maximum} max` : ''}
                    </Text>
                  ) : null}
                </Card>
              );
            })}

            <Card>
              <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 16 }}>Your club’s pathway</Text>
              {path?.league ? (
                <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 6 }}>
                  {path.club} · {path.league} · Division {path.division}
                </Text>
              ) : null}
              <Text style={{ color: tokens.textSoft, fontSize: 14, marginTop: 8, lineHeight: 20 }}>
                {path?.text || 'Loading your regional pathway...'}
              </Text>
              <Pressable
                accessibilityRole="button"
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
                <Text style={{ color: tokens.cyan, fontWeight: '700', fontSize: 14 }}>
                  Explore regional leagues
                </Text>
              </Pressable>
            </Card>

            <SectionLabel>REGIONAL LEAGUES</SectionLabel>
            {leagues.map(({ region, leagues: list }) => (
              <Card key={region.slug}>
                <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }}>{region.name}</Text>
                {list.map((league) => (
                  <Pressable
                    key={league.id}
                    accessibilityRole="button"
                    onPress={() => router.push({
                      pathname: '/apps/leagues/[slug]',
                      params: { slug: league.slug },
                    })}
                    style={{ paddingVertical: 10, minHeight: TAP, justifyContent: 'center' }}
                  >
                    <Text numberOfLines={1} style={{ color: tokens.cyan, fontWeight: '600', fontSize: 15 }}>{league.name}</Text>
                    <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12 }}>
                      Div {league.division} · {league.status}
                    </Text>
                  </Pressable>
                ))}
              </Card>
            ))}
          </PageTile>
        </>
      )}
    </Screen>
  );
}
