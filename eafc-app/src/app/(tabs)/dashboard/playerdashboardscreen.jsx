import React, { useCallback, useEffect, useState } from 'react';
import {
  View, ScrollView, Text, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { loadPlayerDashboard, getMatchOpponent } from '@/lib/dashboardData';
import {
  GamerProfileShell,
  CYAN,
  AMBER,
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleLg } from '@/lib/fonts';
import {
  DashboardRankRing,
  DashboardGamerStatCard,
  DashboardQuickGlance,
  DashboardFormStrip,
  SectionCard,
  SectionTitle,
  LinkText,
  MiniBarChart,
  ObjectivesWidget,
  FutMatchLogPanel,
  EafcClubPanel,
  ClubCrest,
  PitchAtmosphere,
  FutCta,
  FUT,
  formatNumber,
  formatDays,
  formatWhen,
} from '@/components/dashboard/CommandCenterUI';

function tournamentBadge(status) {
  const s = String(status || '').toLowerCase();
  if (['open', 'registration'].includes(s)) {
    return { text: 'OPEN', color: FUT.lime, bg: 'rgba(124,255,107,0.12)', border: 'rgba(124,255,107,0.35)' };
  }
  if (['league_phase', 'in_progress', 'group_stage', 'knockout', 'playoffs'].includes(s)) {
    return { text: 'LIVE', color: FUT.cyan, bg: 'rgba(0,232,255,0.12)', border: 'rgba(0,232,255,0.35)' };
  }
  return {
    text: s.replace(/_/g, ' ').toUpperCase() || '—',
    color: 'rgba(255,255,255,0.5)',
    bg: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.12)',
  };
}

/**
 * Home — Stage Command Center (parity with web /dashboard).
 */
export default function PlayerDashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await loadPlayerDashboard();
      setData(next);
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const open = (href) => {
    if (!href) return;
    router.push(href);
  };

  if (loading && !data) {
    return (
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={CYAN} size="large" />
        </View>
      </GamerProfileShell>
    );
  }

  const {
    user, player, club, playerRank, clubRank, nextMatch, upcomingMatches,
    activeTournaments, leagueStandings, activity, tenure, futMatches,
    eafcSummary, glance, form, futActivity,
  } = data || {};

  const rankedPlayer = playerRank?.row;
  const wins = rankedPlayer?.ranking_wins ?? player?.wins_count ?? player?.wins ?? 0;
  const draws = rankedPlayer?.ranking_draws ?? player?.draws_count ?? player?.draws ?? 0;
  const losses = rankedPlayer?.ranking_losses ?? player?.losses_count ?? player?.losses ?? 0;
  const matchesPlayed = rankedPlayer?.ranking_matches ?? player?.matches_played ?? 0;
  const rankingPoints = rankedPlayer?.ranking_points ?? player?.ranking_points ?? 0;
  const winRate = rankedPlayer?.ranking_win_rate
    ?? (matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0);
  const goals = rankedPlayer?.ranking_goals ?? player?.goals ?? 0;
  const avgRating = rankedPlayer?.ranking_avg_rating ?? player?.avg_rating ?? 0;
  const opponentInfo = getMatchOpponent(nextMatch, player, club);
  const activityLevel = (activity?.matchesThisMonth ?? 0) >= 8
    ? 'High'
    : (activity?.matchesThisMonth ?? 0) >= 3
      ? 'Medium'
      : 'Low';

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 14 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />}
        >
          {/* Command Center hero — EA FC 27 energy */}
          <PitchAtmosphere style={{
            borderWidth: 1.5,
            borderColor: 'rgba(0,232,255,0.35)',
            marginTop: 4,
            shadowColor: FUT.cyan,
            shadowOpacity: 0.35,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          }}
          >
            <View style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                <DashboardRankRing rank={playerRank?.rank} winRate={winRate} />
                <View style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  <Text style={{ color: FUT.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 3.2 }}>
                    COMMAND CENTER
                  </Text>
                  <Text
                    style={[
                      headingStyleLg,
                      {
                        color: '#fff',
                        marginTop: 6,
                        textShadowColor: 'rgba(0,232,255,0.35)',
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 12,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {player?.gamertag || user?.email?.split('@')[0] || 'Guest'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {player?.position ? (
                      <View style={{
                        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
                        backgroundColor: 'rgba(255,210,74,0.14)', borderWidth: 1, borderColor: 'rgba(255,210,74,0.35)',
                      }}
                      >
                        <Text style={{ color: FUT.gold, fontSize: 11, fontWeight: '900' }}>{player.position}</Text>
                      </View>
                    ) : null}
                    {player?.platform ? (
                      <View style={{
                        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
                        backgroundColor: 'rgba(0,232,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,232,255,0.28)',
                      }}
                      >
                        <Text style={{ color: FUT.cyan, fontSize: 11, fontWeight: '800' }}>{player.platform}</Text>
                      </View>
                    ) : null}
                    {player?.is_verified ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5 }}>
                        <Ionicons name="checkmark-circle" size={15} color={FUT.cyan} />
                        <Text style={{ color: FUT.cyan, fontSize: 12, fontWeight: '800' }}>Verified</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={{
                marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 14,
              }}
              >
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', letterSpacing: 1.6 }}>SEASON FORM</Text>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 3 }}>
                    {wins}W · {draws}D · {losses}L
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => open('/apps/rankings')}
                  activeOpacity={0.88}
                  style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,210,74,0.45)' }}
                >
                  <LinearGradient
                    colors={['rgba(255,210,74,0.28)', 'rgba(255,210,74,0.08)']}
                    style={{
                      minHeight: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8,
                    }}
                  >
                    <Ionicons name="trophy-outline" size={15} color={FUT.gold} />
                    <Text style={{ color: FUT.gold, fontWeight: '900', fontSize: 11, letterSpacing: 1 }}>RANKINGS</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </PitchAtmosphere>

          {!player?.id ? (
            <SectionCard>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 20 }}>
                Finish player onboarding to unlock your Command Center widgets.
              </Text>
              <TouchableOpacity
                onPress={() => open('/auth/onboarding')}
                style={{
                  marginTop: 14, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(0,240,255,0.14)', borderWidth: 1, borderColor: 'rgba(0,240,255,0.35)',
                }}
              >
                <Text style={{ color: CYAN, fontWeight: '800' }}>Continue setup</Text>
              </TouchableOpacity>
            </SectionCard>
          ) : (
            <>
              <DashboardQuickGlance glance={glance} onOpen={open} />

              {/* Stats grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <DashboardGamerStatCard
                  label="Global Rank"
                  value={playerRank?.rank ? `#${playerRank.rank}` : '—'}
                  sub={rankingPoints ? `${formatNumber(rankingPoints, 1)} pts` : null}
                  accent="gold"
                  icon="trophy-outline"
                />
                <DashboardGamerStatCard
                  label="Record"
                  value={`${wins}W ${draws}D ${losses}L`}
                  sub={`${formatNumber(winRate, 1)}% win rate`}
                  accent="green"
                  icon="football-outline"
                />
                <DashboardGamerStatCard
                  label="Matches / Month"
                  value={formatNumber(activity?.matchesThisMonth ?? 0)}
                  sub={`${formatNumber(activity?.matchesThisWeek ?? 0)} this week`}
                  accent="cyan"
                  icon="calendar-outline"
                />
                <DashboardGamerStatCard
                  label="Member since"
                  value={formatDays(tenure?.daysOnPlatform)}
                  sub={tenure?.daysAtClub != null ? `${formatDays(tenure.daysAtClub)} at club` : 'Ranked only'}
                  accent="violet"
                  icon="time-outline"
                />
                <DashboardGamerStatCard
                  label="Matches played"
                  value={formatNumber(matchesPlayed)}
                  sub={`${formatNumber(goals)} goals`}
                  accent="cyan"
                  icon="stats-chart-outline"
                />
                <DashboardGamerStatCard
                  label="Avg rating"
                  value={formatNumber(avgRating, 1)}
                  sub={activity?.totalRecorded ? `${activity.totalRecorded} tracked` : 'Ranked only'}
                  accent="gold"
                  icon="trending-up-outline"
                />
                <DashboardGamerStatCard
                  label="Contract"
                  value={tenure?.contractLabel || '—'}
                  sub={
                    tenure?.contractProgress
                      ? `${tenure.contractProgress.gamesLeft} games · ${tenure.contractProgress.daysLeft}d`
                      : 'No active contract'
                  }
                  accent={tenure?.contractLabel ? 'green' : 'rose'}
                  icon="shield-outline"
                />
                <DashboardGamerStatCard
                  label="Activity"
                  value={activityLevel}
                  sub={`${formatNumber(activity?.matchesThisMonth ?? 0)} last 30 days`}
                  accent="violet"
                  icon="flash-outline"
                />
              </View>

              {/* Form */}
              <SectionCard>
                <SectionTitle eyebrow="FORM">Recent form</SectionTitle>
                <DashboardFormStrip label="Stage form" mode="outcome" items={form?.stage} emptyLabel="No completed Stage matches yet." />
                <DashboardFormStrip label="Rating form" mode="rating" items={form?.rating} emptyLabel="No match ratings tracked yet." />
                <DashboardFormStrip label="FUT form" mode="outcome" items={form?.fut} emptyLabel="Log FUT matches below." />
              </SectionCard>

              {/* Next match + My club */}
              <PitchAtmosphere style={{
                borderWidth: 1.5,
                borderColor: 'rgba(0,232,255,0.4)',
                shadowColor: FUT.cyan,
                shadowOpacity: 0.4,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 8 },
                elevation: 11,
              }}
              >
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: FUT.gold, fontSize: 10, fontWeight: '900', letterSpacing: 2.4 }}>KICKOFF</Text>
                      <Text style={[headingStyleLg, { color: '#fff', marginTop: 6, fontSize: 24 }]}>
                        {nextMatch ? opponentInfo.opponent : 'No match lined up'}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 8, lineHeight: 19 }}>
                        {nextMatch
                          ? `${formatWhen(nextMatch.scheduled_date)}${nextMatch.competition ? ` · ${nextMatch.competition}` : ''}`
                          : 'Check Game Day or Schedule when your next fixture drops.'}
                      </Text>
                    </View>
                    <LinearGradient
                      colors={['rgba(0,232,255,0.35)', 'rgba(255,210,74,0.2)']}
                      style={{
                        width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1.5, borderColor: 'rgba(0,232,255,0.45)',
                      }}
                    >
                      <Ionicons name="flash" size={24} color={FUT.cyan} />
                    </LinearGradient>
                  </View>
                  {nextMatch ? (
                    <View style={{
                      marginTop: 14, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,210,74,0.3)',
                      backgroundColor: 'rgba(0,0,0,0.4)', padding: 14, flexDirection: 'row', justifyContent: 'space-between',
                    }}
                    >
                      <Text style={{ color: opponentInfo.isHome ? FUT.cyan : '#fff', fontWeight: '900', flex: 1 }} numberOfLines={1}>
                        {opponentInfo.home}
                      </Text>
                      <Text style={{ color: FUT.gold, fontWeight: '900', fontSize: 11, marginHorizontal: 10 }}>VS</Text>
                      <Text
                        style={{
                          color: !opponentInfo.isHome ? FUT.cyan : '#fff', fontWeight: '900', flex: 1, textAlign: 'right',
                        }}
                        numberOfLines={1}
                      >
                        {opponentInfo.away}
                      </Text>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <FutCta label="GAME DAY" icon="flash" primary onPress={() => open('/(tabs)/matches')} />
                    <FutCta label="SCHEDULE" icon="calendar-outline" onPress={() => open('/apps/schedule')} />
                  </View>
                </View>
              </PitchAtmosphere>

              <SectionCard accent="gold">
                <SectionTitle
                  eyebrow="SQUAD"
                  right={clubRank?.rank ? (
                    <Text style={{ color: FUT.gold, fontSize: 14, fontWeight: '900' }}>#{clubRank.rank}</Text>
                  ) : null}
                >
                  My Club
                </SectionTitle>
                {club ? (
                  <TouchableOpacity
                    onPress={() => open({ pathname: '/teams/teamprofilescreen', params: { teamId: String(club.id) } })}
                    activeOpacity={0.85}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <ClubCrest club={club} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }} numberOfLines={1}>
                          {club.name}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 3 }}>
                          {[club.tag ? `[${club.tag}]` : null, club.region || 'Global'].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                    </View>
                    {clubRank?.row ? (
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 12 }}>
                        {formatNumber(clubRank.row.ranking_points, 1)} pts · {clubRank.row.wins || 0}W {clubRank.row.draws || 0}D {clubRank.row.losses || 0}L
                      </Text>
                    ) : null}
                    {tenure?.daysAtClub != null ? (
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>
                        {formatDays(tenure.daysAtClub)} at club
                      </Text>
                    ) : null}
                    {tenure?.contractProgress ? (
                      <View style={{ marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800' }}>CONTRACT GAMES</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800' }}>
                            {tenure.contractProgress.gamesPlayed}/{tenure.contractProgress.maxGames}
                          </Text>
                        </View>
                        <View style={{
                          height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 6, overflow: 'hidden',
                        }}
                        >
                          <View style={{
                            width: `${tenure.contractProgress.gamesPercent}%`,
                            height: '100%',
                            backgroundColor: CYAN,
                          }}
                          />
                        </View>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ) : (
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>You’re a free agent — find a club.</Text>
                    <TouchableOpacity
                      onPress={() => open('/(tabs)/search/searchclubs')}
                      style={{
                        marginTop: 12, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '800' }}>Find Club</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </SectionCard>

              {/* Upcoming */}
              {upcomingMatches?.length > 1 ? (
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, textTransform: 'uppercase' }}>Upcoming</Text>
                    <LinkText label="Schedule" onPress={() => open('/apps/schedule')} />
                  </View>
                  {upcomingMatches.slice(1, 5).map((m, i) => {
                    const opp = getMatchOpponent(m, player, club);
                    return (
                      <TouchableOpacity
                        key={m.id || i}
                        onPress={() => open('/(tabs)/matches')}
                        style={{
                          borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                          backgroundColor: 'rgba(255,255,255,0.03)', padding: 14,
                        }}
                      >
                        <Text style={{ color: CYAN, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>
                          {String(m.status).toLowerCase() === 'live' ? 'LIVE' : formatWhen(m.scheduled_date)}
                        </Text>
                        <Text style={{ color: '#fff', fontWeight: '800', marginTop: 4 }} numberOfLines={1}>
                          {opp.home} <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>vs</Text> {opp.away}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}

              {/* Activity + Objectives */}
              <SectionCard>
                <SectionTitle eyebrow="PERFORMANCE">Activity</SectionTitle>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 }}>
                  RATING TREND
                </Text>
                <MiniBarChart
                  data={(activity?.timeline || []).map((p) => ({ label: p.label, matches: p.rating }))}
                  valueKey="matches"
                  color={AMBER}
                  emptyLabel="No rating history yet."
                />
                <Text style={{
                  color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
                  marginTop: 16, marginBottom: 8,
                }}
                >
                  WEEKLY MATCHES
                </Text>
                <MiniBarChart
                  data={activity?.weekly}
                  valueKey="matches"
                  color={CYAN}
                  emptyLabel="No weekly activity yet."
                />
              </SectionCard>

              <SectionCard accent="gold">
                <SectionTitle eyebrow="REWARDS">Objectives</SectionTitle>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 10 }}>
                  Daily and weekly rewards for staying active.
                </Text>
                <ObjectivesWidget playerId={player.id} />
              </SectionCard>

              {/* Tournaments + League */}
              <SectionCard>
                <SectionTitle
                  eyebrow="COMPETE"
                  right={<LinkText label="View all" onPress={() => open('/(tabs)/tournaments')} />}
                >
                  Active tournaments
                </SectionTitle>
                {!activeTournaments?.length ? (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No active competitions yet.</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {activeTournaments.slice(0, 5).map((tr) => {
                      const badge = tournamentBadge(tr.status);
                      return (
                        <TouchableOpacity
                          key={tr.id}
                          onPress={() => open({
                            pathname: '/(tabs)/tournaments/tournamentdetailscreen',
                            params: { tournamentId: String(tr.id) },
                          })}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 10,
                            borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                            backgroundColor: 'rgba(0,0,0,0.2)', padding: 12,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#fff', fontWeight: '800' }} numberOfLines={1}>{tr.name}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 3, textTransform: 'uppercase' }}>
                              {String(tr.type || 'tournament').replace(/_/g, ' ')}
                            </Text>
                          </View>
                          <View style={{
                            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
                            borderWidth: 1, borderColor: badge.border, backgroundColor: badge.bg,
                          }}
                          >
                            <Text style={{ color: badge.color, fontSize: 9, fontWeight: '900' }}>{badge.text}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </SectionCard>

              <SectionCard accent="gold">
                <SectionTitle
                  eyebrow="TABLE"
                  right={<LinkText label="View all" onPress={() => open('/apps/register')} />}
                >
                  League standings
                </SectionTitle>
                {!leagueStandings?.length ? (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No league place yet.</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {leagueStandings.slice(0, 5).map((row) => (
                      <View
                        key={row.id || `${row.season_id}-${row.club_id}`}
                        style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                          borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                          backgroundColor: 'rgba(0,0,0,0.2)', padding: 12,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#fff', fontWeight: '800' }} numberOfLines={1}>{row.label}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 3 }}>
                            {row.points ?? 0} pts · {row.played ?? 0} played
                          </Text>
                        </View>
                        <Text style={{ color: CYAN, fontWeight: '900', fontSize: 22 }}>
                          {row.position ? `#${row.position}` : '—'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>

              {/* FUT + EAFC */}
              <SectionCard accent="gold">
                <SectionTitle eyebrow="ULTIMATE TEAM">FUT activity</SectionTitle>
                <MiniBarChart
                  data={futActivity?.weekly}
                  valueKey="wins"
                  color={AMBER}
                  emptyLabel="No FUT wins logged this month."
                />
                {futActivity?.summary ? (
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 10 }}>
                    {futActivity.summary.wins}W {futActivity.summary.draws}D {futActivity.summary.losses}L · {futActivity.summary.total} logged
                  </Text>
                ) : null}
              </SectionCard>

              <SectionCard>
                <SectionTitle eyebrow="EA FC">EA FC Pro Club</SectionTitle>
                <EafcClubPanel player={player} eafcSummary={eafcSummary} onRefresh={load} />
              </SectionCard>

              <SectionCard accent="gold">
                <SectionTitle eyebrow="MATCH LOG">FUT match log</SectionTitle>
                <FutMatchLogPanel playerId={player.id} initialMatches={futMatches || []} />
              </SectionCard>
            </>
          )}

          <LinearGradient
            colors={['rgba(0,232,255,0.12)', 'rgba(255,210,74,0.08)', 'rgba(255,255,255,0.02)']}
            style={{
              borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(0,232,255,0.25)',
              padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
            }}
          >
            <Ionicons name="game-controller-outline" size={22} color={FUT.cyan} />
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, flex: 1, lineHeight: 19, fontWeight: '600' }}>
              Built like EA FC 27 — holographic panels, kickoff energy, Ultimate Team glow.
            </Text>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </GamerProfileShell>
  );
}
