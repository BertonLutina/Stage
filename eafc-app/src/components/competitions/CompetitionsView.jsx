import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import {
  Button, Card, Chip, EmptyState, ErrorState, SectionLabel, SegmentedControl, SkeletonList,
} from '@/components/ui';
import PageTile, { PageTitle } from '@/components/theme/PageTile';
import { stageClient } from '@/api/stageClient';
import { COMPETITIONS } from '@/lib/competitionUtils';
import { loadCompetitionsHub as loadLegacyCompetitions } from '@/lib/competitionSeason';
import { clubPathway, qualificationRange } from '@/lib/gostOverview';
import {
  groupLeaguesByRegion,
  registrationWindowState,
  summarizeCup,
  summarizeRegistration,
} from '@/lib/competitionsHub';
import { REGIONS } from '@/lib/qualificationConfig';
import useCompetitionsHub from '@/hooks/useCompetitionsHub';
import useT from '@/hooks/useT';
import StatusTag from './StatusTag';

const TAP = 44;

function regionName(slug) {
  const known = REGIONS.find((r) => r.slug === slug);
  if (known) return known.name;
  return String(slug || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Region slug of the club, read from the club record only (never guessed). */
export function clubRegionSlug(club) {
  const raw = String(club?.region_slug || club?.region || '').trim().toLowerCase();
  if (!raw) return null;
  const hit = REGIONS.find((r) => r.slug === raw || r.name.toLowerCase() === raw);
  return hit ? hit.slug : null;
}

function formatDay(iso, withWeekday = false) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, withWeekday
    ? { weekday: 'short', day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

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
        {failed ? 'Trophy artwork unavailable.' : (guidance || 'No captured trophy design available.')}
      </Text>
    </View>
  );
}

function SectionError({ message, onRetry }) {
  const t = useT();
  return <ErrorState message={message || t('stage.competitions.sectionError')} onRetry={onRetry} testID="section-error" />;
}

function ClubPathwayCard({ club }) {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((st) => st.tokens);
  const [path, setPath] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
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
  }, [club]);

  return (
    <Card>
      <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 16 }}>{t('stage.competitions.pathway')}</Text>
      {path?.league ? (
        <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 6 }}>
          {path.club} · {path.league} · Division {path.division}
        </Text>
      ) : null}
      <Text style={{ color: tokens.textSoft, fontSize: 14, marginTop: 8, lineHeight: 20 }}>
        {path?.text || '…'}
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
        <Text style={{ color: tokens.cyan, fontWeight: '700', fontSize: 14 }}>{t('stage.competitions.explore')}</Text>
      </Pressable>
    </Card>
  );
}

/**
 * Competitions content, shared by the Tournaments tab (Competitions) and the pushed
 * `/apps/competitions` screen. The parent owns the scroll view: it hands the refresh
 * state up through `onRefreshState({ refreshing, refetch })` for pull-to-refresh.
 */
export default function CompetitionsView({ onRefreshState, showTitle = true }) {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((st) => st.tokens);
  const { data, loading, error, refreshing, refetch } = useCompetitionsHub();
  const [archive, setArchive] = useState(false);
  const [legacyRows, setLegacyRows] = useState([]);

  useEffect(() => {
    if (onRefreshState) onRefreshState({ refreshing, refetch });
  }, [onRefreshState, refreshing, refetch]);

  const errors = data?.errors || {};
  const gostFailed = Boolean(errors.gost);
  useEffect(() => {
    if (!gostFailed) return undefined;
    let active = true;
    loadLegacyCompetitions().then((rows) => { if (active) setLegacyRows(rows || []); }).catch(() => {});
    return () => { active = false; };
  }, [gostFailed]);

  const myClubId = data?.club?.id || null;
  const regionSlug = clubRegionSlug(data?.club);
  const cups = useMemo(
    () => (data?.cups || []).map((cup) => summarizeCup(cup, myClubId)),
    [data?.cups, myClubId],
  );
  const leagueGroups = useMemo(
    () => groupLeaguesByRegion(data?.leagues || [], { regionSlug }),
    [data?.leagues, regionSlug],
  );
  const registrations = useMemo(
    () => (data?.registrations || []).map(summarizeRegistration),
    [data?.registrations],
  );
  const windowState = useMemo(() => registrationWindowState(data?.windows || []), [data?.windows]);

  const openLeague = useCallback((slug) => router.push({ pathname: '/apps/leagues/[slug]', params: { slug } }), [router]);

  const allFailed = Boolean(errors.gost && errors.cups && errors.leagues);
  const gostCompetitions = data?.gost || [];

  const registrationLine = (() => {
    if (windowState.state === 'open') return t('stage.competitions.registrationOpen');
    if (windowState.state === 'confirmation') return t('stage.competitions.registrationConfirmation');
    if (windowState.state === 'upcoming') {
      return t('stage.competitions.registrationUpcoming', { date: formatDay(windowState.opensAt) });
    }
    if (windowState.state === 'closed') return t('stage.competitions.registrationClosed');
    return null;
  })();
  const canOpenRegister = windowState.state === 'open' || windowState.state === 'confirmation';

  const statusLabel = (tone) => (
    tone === 'success' ? t('stage.competitions.statusApproved')
      : tone === 'danger' ? t('stage.competitions.statusRejected')
        : t('stage.competitions.statusPending')
  );

  return (
    <View style={{ gap: 14 }}>
      {showTitle ? (
        <PageTitle title={t('stage.competitions.title')} subtitle={t('stage.competitions.subtitle')} padded={false} />
      ) : null}
      {loading ? (
        <SkeletonList count={4} />
      ) : error || allFailed ? (
        <ErrorState message={error || errors.gost} onRetry={refetch} />
      ) : (
        <PageTile tileKey="competitions" tileTitle={t('stage.competitions.title')} contentStyle={{ paddingHorizontal: 12, gap: 12 }}>
          <SectionLabel right={<Chip label={t('stage.competitions.registerChip')} onPress={() => router.push('/apps/register')} />}>
            {t('stage.competitions.myRegistrations')}
          </SectionLabel>
          {errors.registrations ? (
            <SectionError message={errors.registrations} onRetry={refetch} />
          ) : registrations.length ? (
            registrations.map((reg) => (
              <Card key={reg.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Text numberOfLines={1} style={{ flex: 1, color: tokens.text, fontWeight: '700', fontSize: 15 }}>
                    {reg.regionName || regionName(reg.regionSlug)}
                  </Text>
                  <StatusTag label={statusLabel(reg.tone)} tone={reg.tone} />
                </View>
                <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 6 }}>
                  {[
                    reg.seasonNumber != null ? t('stage.competitions.seasonLine', { season: reg.seasonNumber }) : null,
                    reg.division != null ? t('stage.competitions.divisionLine', { division: reg.division }) : null,
                    reg.confirmedPlayers ? t('stage.competitions.playersConfirmed', { count: reg.confirmedPlayers }) : null,
                  ].filter(Boolean).join(' · ')}
                </Text>
              </Card>
            ))
          ) : (
            <Card style={{ gap: 12 }} testID="no-registrations">
              <Text style={{ color: tokens.textSoft, fontSize: 14, lineHeight: 20 }}>
                {data?.club ? t('stage.competitions.noRegistrations') : t('stage.competitions.noClub')}
              </Text>
            </Card>
          )}
          {registrationLine ? (
            <Card highlight={canOpenRegister} style={{ gap: 12 }} testID="registration-window">
              <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '600' }}>{registrationLine}</Text>
              {canOpenRegister && data?.club ? (
                <Button title={t('stage.competitions.registerClub')} onPress={() => router.push('/apps/register')} />
              ) : null}
            </Card>
          ) : null}

          <SectionLabel>{t('stage.competitions.gost')}</SectionLabel>
          <SegmentedControl
            options={[
              { key: 'current', label: t('stage.competitions.currentSeason') },
              { key: 'archive', label: t('stage.competitions.archive') },
            ]}
            value={archive ? 'archive' : 'current'}
            onChange={(key) => setArchive(key === 'archive')}
          />
          {gostFailed ? <SectionError message={errors.gost} onRetry={refetch} /> : null}
          {(gostFailed ? legacyRows.map((r) => r.meta) : COMPETITIONS).map((meta) => {
            const competition = gostCompetitions.find((c) => c.slug === meta.slug);
            const fallback = legacyRows.find((r) => r.meta.slug === meta.slug);
            const season = archive
              ? (competition?.archive?.[0] || null)
              : (competition?.current || null);
            const trophy = archive ? season?.trophy : competition?.assignment?.trophy;
            const statusLine = season
              ? `${season.label || season.status} · ${season.state || season.status || 'open'}`
              : fallback?.season
                ? `${fallback.season.status} · ${fallback.standings.length} clubs`
                : t('stage.competitions.seasonNotStarted');
            return (
              <Card
                key={meta.slug}
                onPress={() => router.push({ pathname: '/apps/competitions/[slug]', params: { slug: meta.slug } })}
              >
                <GostTrophy tokens={tokens} trophy={trophy} guidance={competition?.assignment?.guidance} />
                <Text style={{ color: tokens.cyan, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, marginTop: 8 }}>
                  {t('stage.competitions.tierLine', { tier: meta.tier }).toUpperCase()}
                </Text>
                <Text numberOfLines={2} style={{ color: tokens.text, fontWeight: '700', fontSize: 17, marginTop: 4 }}>
                  {(competition?.name || meta.name).replace(/^STAGE\s+/i, '')}
                </Text>
                <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                  Regional Division 1 · Positions {qualificationRange(meta.slug)}
                </Text>
                <Text style={{ color: tokens.textSoft, fontSize: 12, marginTop: 8, fontWeight: '600' }}>{statusLine}</Text>
                {season?.registered != null ? (
                  <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                    {season.registered} registered{season.maximum ? ` · ${season.maximum} max` : ''}
                  </Text>
                ) : null}
              </Card>
            );
          })}

          <SectionLabel>{t('stage.competitions.cups')}</SectionLabel>
          {errors.cups ? (
            <SectionError message={errors.cups} onRetry={refetch} />
          ) : cups.length ? (
            cups.map((cup) => (
              <Card key={cup.id} testID={`cup-${cup.id}`}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Text numberOfLines={1} style={{ flex: 1, color: tokens.text, fontWeight: '700', fontSize: 15 }}>{cup.name}</Text>
                  {cup.isMine ? <StatusTag label={t('stage.competitions.statusApproved')} tone="info" /> : null}
                </View>
                <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 6 }}>
                  {[
                    cup.status === 'completed' ? t('stage.competitions.cupCompleted') : t('stage.competitions.cupRunning'),
                    cup.round != null ? t('stage.competitions.cupRound', { round: cup.round }) : null,
                    t('stage.competitions.cupParticipants', { count: cup.participantCount }),
                  ].filter(Boolean).join(' · ')}
                </Text>
                {cup.myNext?.kickoffAt ? (
                  <Text style={{ color: tokens.textSoft, fontSize: 12, marginTop: 6, fontWeight: '600' }}>
                    {t('stage.competitions.cupYouPlay', { date: formatDay(cup.myNext.kickoffAt, true) })}
                  </Text>
                ) : null}
              </Card>
            ))
          ) : (
            <EmptyState icon="trophy-outline" title={t('stage.competitions.noCups')} />
          )}

          <SectionLabel>{t('stage.competitions.leagues')}</SectionLabel>
          {errors.leagues ? (
            <SectionError message={errors.leagues} onRetry={refetch} />
          ) : leagueGroups.length ? (
            leagueGroups.map((group) => (
              <Card key={group.regionSlug}>
                <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }}>
                  {regionName(group.regionSlug)}
                </Text>
                {group.editions.map((league) => (
                  <Pressable
                    key={league.id}
                    accessibilityRole="button"
                    onPress={() => openLeague(league.slug || league.stable_slug)}
                    style={{ paddingVertical: 10, minHeight: TAP, justifyContent: 'center' }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <Text numberOfLines={1} style={{ flex: 1, color: tokens.cyan, fontWeight: '600', fontSize: 15 }}>{league.name}</Text>
                      {league.status === 'registration' ? <StatusTag label={t('stage.competitions.open')} tone="warning" /> : null}
                    </View>
                    <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12 }}>
                      {[
                        t('stage.competitions.divisionShort', { division: league.division }),
                        league.season_number != null ? t('stage.competitions.seasonLine', { season: league.season_number }) : null,
                        league.participant_count != null ? t('stage.competitions.clubsCount', { count: league.participant_count }) : null,
                      ].filter(Boolean).join(' · ')}
                    </Text>
                  </Pressable>
                ))}
              </Card>
            ))
          ) : (
            <EmptyState
              icon="earth-outline"
              title={regionSlug ? t('stage.competitions.noLeaguesRegion') : t('stage.competitions.noLeagues')}
            />
          )}

          <ClubPathwayCard club={data?.club} />
        </PageTile>
      )}
    </View>
  );
}
