import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { hexToRgba } from '@/lib/stageTheme';
import LiveGlass from '@/components/theme/LiveGlass';
import { CYAN, AMBER, useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleLg } from '@/lib/fonts';
import { getMatchOpponent } from '@/lib/dashboardData';
import { DASHBOARD_LAYOUTS } from '@/lib/dashboardLayouts';
import TransferWindowHomeIcon from '@/components/dashboard/TransferWindowHomeIcon';
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
  ClubCrest,
  PitchAtmosphere,
  FutCta,
  FUT,
  formatNumber,
  formatDays,
  formatWhen,
} from '@/components/dashboard/CommandCenterUI';

export { DASHBOARD_LAYOUTS };

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
    color: '#94A3B8',
    bg: 'rgba(148,163,184,0.12)',
    border: 'rgba(148,163,184,0.28)',
  };
}

function Chip({ label, gold }) {
  const tokens = useGamerTokens();
  const color = gold ? tokens.amber : tokens.cyan;
  const border = gold ? tokens.amberBorder : tokens.cyanBorder;
  return (
    <View style={{
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: tokens.live ? 'transparent' : (tokens.isDark ? hexToRgba(color, 0.12) : tokens.cardSolid),
      borderWidth: 1,
      borderColor: border,
    }}
    >
      <Text style={{ color, fontSize: 11, fontWeight: '900' }}>{label}</Text>
    </View>
  );
}

function GamertagTitle({ vm, style, centered = false }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: centered ? 'center' : 'flex-start',
      gap: 10,
      minWidth: 0,
    }}
    >
      <Text
        style={[headingStyleLg, { flexShrink: 1 }, style]}
        numberOfLines={1}
      >
        {vm.gamertag}
      </Text>
      {vm.transferWindowOpen ? (
        <TransferWindowHomeIcon onPress={() => vm.open('/apps/transfers')} />
      ) : null}
    </View>
  );
}

function IdentityChips({ player }) {
  const tokens = useGamerTokens();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {player?.position ? <Chip label={player.position} gold /> : null}
      {player?.platform ? <Chip label={player.platform} /> : null}
      {player?.is_verified ? (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          paddingHorizontal: tokens.isDark ? 0 : 10, paddingVertical: 5, borderRadius: 999,
          backgroundColor: tokens.isDark ? 'transparent' : tokens.cardSolid,
          borderWidth: tokens.isDark ? 0 : 1, borderColor: tokens.cyanBorder,
        }}
        >
          <Ionicons name="checkmark-circle" size={15} color={tokens.cyan} />
          <Text style={{ color: tokens.cyan, fontSize: 12, fontWeight: '800' }}>Verified</Text>
        </View>
      ) : null}
    </View>
  );
}

function KickoffCard({ vm, compact = false }) {
  const tokens = useGamerTokens();
  const { nextMatch, opponentInfo, open } = vm;
  return (
    <PitchAtmosphere style={{
      borderWidth: 1.5,
      borderColor: tokens.isDark ? tokens.cyanBorder : tokens.amberBorder,
      shadowColor: tokens.isDark ? tokens.cyan : '#0B1A3A',
      shadowOpacity: tokens.isDark ? 0.35 : 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    }}
    >
      <View style={{ padding: compact ? 14 : 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: tokens.amber, fontSize: 10, fontWeight: '900', letterSpacing: 2.4 }}>KICKOFF</Text>
            <Text
              style={[headingStyleLg, { color: tokens.text, marginTop: 6, fontSize: compact ? 20 : 24 }]}
              numberOfLines={1}
            >
              {nextMatch ? opponentInfo.opponent : 'No match lined up'}
            </Text>
            <Text style={{ color: tokens.muted, fontSize: 13, marginTop: 8, lineHeight: 19 }}>
              {nextMatch
                ? `${formatWhen(nextMatch.scheduled_date)}${nextMatch.competition ? ` · ${nextMatch.competition}` : ''}`
                : 'Check Game Day when your next fixture drops.'}
            </Text>
          </View>
          {!compact ? (
            <LinearGradient
              colors={[hexToRgba(tokens.cyan, 0.22), hexToRgba(tokens.amber, 0.16)]}
              style={{
                width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: tokens.cyanBorder,
              }}
            >
              <Ionicons name="flash" size={24} color={tokens.cyan} />
            </LinearGradient>
          ) : null}
        </View>
        {nextMatch ? (
          <View style={{
            marginTop: 14, borderRadius: 14, borderWidth: 1.5, borderColor: tokens.amberBorder,
            backgroundColor: tokens.inputFill, padding: 14, flexDirection: 'row', justifyContent: 'space-between',
          }}
          >
            <Text style={{ color: opponentInfo.isHome ? tokens.cyan : tokens.text, fontWeight: '900', flex: 1 }} numberOfLines={1}>
              {opponentInfo.home}
            </Text>
            <Text style={{ color: tokens.amber, fontWeight: '900', fontSize: 11, marginHorizontal: 10 }}>VS</Text>
            <Text
              style={{ color: !opponentInfo.isHome ? tokens.cyan : tokens.text, fontWeight: '900', flex: 1, textAlign: 'right' }}
              numberOfLines={1}
            >
              {opponentInfo.away}
            </Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <FutCta label="GAME DAY" icon="flash" primary onPress={() => open('/(tabs)/matches')} />
          {!compact ? (
            <FutCta label="SCHEDULE" icon="calendar-outline" onPress={() => open('/apps/schedule')} />
          ) : null}
        </View>
      </View>
    </PitchAtmosphere>
  );
}

function ClubBlock({ vm, compact = false }) {
  const tokens = useGamerTokens();
  const { club, clubRank, tenure, open } = vm;
  return (
    <SectionCard accent="gold">
      <SectionTitle
        eyebrow="SQUAD"
        right={clubRank?.rank ? (
          <Text style={{ color: tokens.amber, fontSize: 14, fontWeight: '900' }}>#{clubRank.rank}</Text>
        ) : null}
      >
        My Club
      </SectionTitle>
      {club ? (
        <TouchableOpacity
          onPress={() => open({ pathname: '/teams/teamprofilescreen', params: { teamId: String(club.id) } })}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Open ${club.name}`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <ClubCrest club={club} size={compact ? 44 : 52} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }} numberOfLines={1}>
                {club.name}
              </Text>
              <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 3 }}>
                {[club.tag ? `[${club.tag}]` : null, club.region || 'Global'].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tokens.faint} />
          </View>
          {!compact && clubRank?.row ? (
            <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 12 }}>
              {formatNumber(clubRank.row.ranking_points, 1)} pts · {clubRank.row.wins || 0}W {clubRank.row.draws || 0}D {clubRank.row.losses || 0}L
            </Text>
          ) : null}
          {!compact && tenure?.daysAtClub != null ? (
            <Text style={{ color: tokens.faint, fontSize: 12, marginTop: 8 }}>
              {formatDays(tenure.daysAtClub)} at club
            </Text>
          ) : null}
          {tenure?.contractProgress ? (
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: tokens.faint, fontSize: 10, fontWeight: '800' }}>CONTRACT GAMES</Text>
                <Text style={{ color: tokens.faint, fontSize: 10, fontWeight: '800' }}>
                  {tenure.contractProgress.gamesPlayed}/{tenure.contractProgress.maxGames}
                </Text>
              </View>
              <View style={{
                height: 6, borderRadius: 3, backgroundColor: tokens.inputFill, marginTop: 6, overflow: 'hidden',
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
          <Text style={{ color: tokens.muted, fontSize: 13 }}>You’re a free agent — find a club.</Text>
          <TouchableOpacity
            onPress={() => open('/(tabs)/search/searchclubs')}
            accessibilityRole="button"
            accessibilityLabel="Find a club"
            style={{
              marginTop: 12, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: tokens.hairline,
            }}
          >
            <Text style={{ color: tokens.text, fontWeight: '800' }}>Find Club</Text>
          </TouchableOpacity>
        </View>
      )}
    </SectionCard>
  );
}

function FormBlock({ vm, stageOnly = false }) {
  return (
    <SectionCard>
      <SectionTitle eyebrow="FORM">Recent form</SectionTitle>
      <DashboardFormStrip label="Stage form" mode="outcome" items={vm.form?.stage} emptyLabel="No completed Stage matches yet." />
      {!stageOnly ? (
        <>
          <DashboardFormStrip label="Rating form" mode="rating" items={vm.form?.rating} emptyLabel="No match ratings tracked yet." />
          <DashboardFormStrip label="FUT form" mode="outcome" items={vm.form?.fut} emptyLabel="Log FUT matches below." />
        </>
      ) : null}
    </SectionCard>
  );
}

function UpcomingBlock({ vm }) {
  const tokens = useGamerTokens();
  const { upcomingMatches, player, club, open } = vm;
  if (!(upcomingMatches?.length > 1)) return null;
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 18, textTransform: 'uppercase' }}>Upcoming</Text>
        <LinkText label="Schedule" onPress={() => open('/apps/schedule')} />
      </View>
      {upcomingMatches.slice(1, 5).map((m, i) => {
        const opp = getMatchOpponent(m, player, club);
        return (
          <TouchableOpacity
            key={m.id || i}
            onPress={() => open('/(tabs)/matches')}
            activeOpacity={0.85}
            style={{
              borderRadius: 14, borderWidth: 1, borderColor: tokens.hairline,
              backgroundColor: tokens.inputFill, padding: 14, minHeight: 44,
            }}
          >
            <Text style={{ color: CYAN, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>
              {String(m.status).toLowerCase() === 'live' ? 'LIVE' : formatWhen(m.scheduled_date)}
            </Text>
            <Text style={{ color: tokens.text, fontWeight: '800', marginTop: 4 }} numberOfLines={1}>
              {opp.home} <Text style={{ color: tokens.faint, fontWeight: '500' }}>vs</Text> {opp.away}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ActivityBlock({ vm }) {
  const tokens = useGamerTokens();
  return (
    <SectionCard>
      <SectionTitle eyebrow="PERFORMANCE">Activity</SectionTitle>
      <Text style={{ color: tokens.faint, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 }}>
        RATING TREND
      </Text>
      <MiniBarChart
        data={(vm.activity?.timeline || []).map((p) => ({ label: p.label, matches: p.rating }))}
        valueKey="matches"
        color={AMBER}
        emptyLabel="No rating history yet."
      />
      <Text style={{
        color: tokens.faint, fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
        marginTop: 16, marginBottom: 8,
      }}
      >
        WEEKLY MATCHES
      </Text>
      <MiniBarChart
        data={vm.activity?.weekly}
        valueKey="matches"
        color={CYAN}
        emptyLabel="No weekly activity yet."
      />
    </SectionCard>
  );
}

function ObjectivesBlock({ vm }) {
  const tokens = useGamerTokens();
  if (!vm.player?.id) return null;
  return (
    <SectionCard accent="gold">
      <SectionTitle eyebrow="REWARDS">Objectives</SectionTitle>
      <Text style={{ color: tokens.muted, fontSize: 12, marginBottom: 10 }}>
        Daily and weekly rewards for staying active.
      </Text>
      <ObjectivesWidget playerId={vm.player.id} />
    </SectionCard>
  );
}

function TournamentsBlock({ vm }) {
  const tokens = useGamerTokens();
  const { activeTournaments, open } = vm;
  return (
    <SectionCard>
      <SectionTitle
        eyebrow="COMPETE"
        right={<LinkText label="View all" onPress={() => open('/(tabs)/tournaments')} />}
      >
        Active tournaments
      </SectionTitle>
      {!activeTournaments?.length ? (
        <Text style={{ color: tokens.faint, fontSize: 13 }}>No active competitions yet.</Text>
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
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  borderRadius: 12, borderWidth: 1, borderColor: tokens.hairline,
                  backgroundColor: tokens.inputFill, padding: 12, minHeight: 44,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: tokens.text, fontWeight: '800' }} numberOfLines={1}>{tr.name}</Text>
                  <Text style={{ color: tokens.faint, fontSize: 10, marginTop: 3, textTransform: 'uppercase' }}>
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
  );
}

function LeagueBlock({ vm }) {
  const tokens = useGamerTokens();
  return (
    <SectionCard accent="gold">
      <SectionTitle
        eyebrow="TABLE"
        right={<LinkText label="View all" onPress={() => vm.open('/apps/competitions')} />}
      >
        League standings
      </SectionTitle>
      {!vm.leagueStandings?.length ? (
        <Text style={{ color: tokens.faint, fontSize: 13 }}>No league place yet.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {vm.leagueStandings.slice(0, 5).map((row) => (
            <View
              key={row.id || `${row.season_id}-${row.club_id}`}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderRadius: 12, borderWidth: 1, borderColor: tokens.hairline,
                backgroundColor: tokens.inputFill, padding: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: tokens.text, fontWeight: '800' }} numberOfLines={1}>{row.label}</Text>
                <Text style={{ color: tokens.faint, fontSize: 11, marginTop: 3 }}>
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
  );
}

function FutBlock({ vm }) {
  const tokens = useGamerTokens();
  return (
    <SectionCard accent="gold">
      <SectionTitle eyebrow="ULTIMATE TEAM">FUT activity</SectionTitle>
      <MiniBarChart
        data={vm.futActivity?.weekly}
        valueKey="wins"
        color={AMBER}
        emptyLabel="No FUT wins logged this month."
      />
      {vm.futActivity?.summary ? (
        <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 10 }}>
          {vm.futActivity.summary.wins}W {vm.futActivity.summary.draws}D {vm.futActivity.summary.losses}L · {vm.futActivity.summary.total} logged
        </Text>
      ) : null}
    </SectionCard>
  );
}

function BelowFold({ vm }) {
  return (
    <>
      <UpcomingBlock vm={vm} />
      <ActivityBlock vm={vm} />
      <ObjectivesBlock vm={vm} />
      <TournamentsBlock vm={vm} />
      <LeagueBlock vm={vm} />
      <FutBlock vm={vm} />
    </>
  );
}

function KpiGrid({ vm }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
        <DashboardGamerStatCard
          label="Global Rank"
          value={vm.playerRank?.rank ? `#${vm.playerRank.rank}` : '—'}
          sub={vm.rankingPoints ? `${formatNumber(vm.rankingPoints, 1)} pts` : 'Unranked'}
          accent="gold"
          icon="trophy-outline"
        />
        <DashboardGamerStatCard
          label="Record"
          value={`${vm.wins}W ${vm.draws}D ${vm.losses}L`}
          sub={`${formatNumber(vm.winRate, 1)}% win rate`}
          accent="green"
          icon="football-outline"
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
        <DashboardGamerStatCard
          label="Avg rating"
          value={formatNumber(vm.avgRating, 1)}
          sub={vm.activity?.totalRecorded ? `${vm.activity.totalRecorded} tracked` : 'Ranked only'}
          accent="gold"
          icon="trending-up-outline"
        />
        <DashboardGamerStatCard
          label="Contract"
          value={vm.tenure?.contractLabel || '—'}
          sub={
            vm.tenure?.contractProgress
              ? `${vm.tenure.contractProgress.gamesLeft} games left`
              : 'No active contract'
          }
          accent={vm.tenure?.contractLabel ? 'green' : 'rose'}
          icon="shield-outline"
        />
      </View>
    </View>
  );
}

function KpiRow({ icon, label, value, sub }) {
  const tokens = useGamerTokens();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      minHeight: 52, paddingVertical: 8,
      borderBottomWidth: 1, borderBottomColor: tokens.hairline,
    }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: tokens.amberBorder, backgroundColor: hexToRgba(tokens.amber, 0.1),
      }}
      >
        <Ionicons name={icon} size={18} color={tokens.amber} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: tokens.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }}>
          {label}
        </Text>
        {sub ? (
          <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>{sub}</Text>
        ) : null}
      </View>
      <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 18 }}>{value}</Text>
    </View>
  );
}

function LayoutA({ vm }) {
  const tokens = useGamerTokens();
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <DashboardRankRing rank={vm.playerRank?.rank} winRate={vm.winRate} size={72} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: tokens.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 2.4 }}>COMMAND CENTER</Text>
          <GamertagTitle vm={vm} style={{ color: tokens.text, marginTop: 4, fontSize: 22 }} />
          <View style={{ marginTop: 8 }}>
            <IdentityChips player={vm.player} />
          </View>
        </View>
      </View>
      <KickoffCard vm={vm} />
      <KpiGrid vm={vm} />
      <FormBlock vm={vm} stageOnly />
      <ClubBlock vm={vm} compact />
      <DashboardQuickGlance glance={vm.glance} onOpen={vm.open} />
      <BelowFold vm={vm} />
    </>
  );
}

function LayoutB({ vm }) {
  const tokens = useGamerTokens();
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'club', label: 'Club' },
    { id: 'compete', label: 'Compete' },
  ];

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: tokens.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 2.4 }}>COMMAND CENTER</Text>
          <GamertagTitle vm={vm} style={{ color: tokens.text, marginTop: 4 }} />
        </View>
        <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 22 }}>
          {vm.playerRank?.rank ? `#${vm.playerRank.rank}` : '—'}
        </Text>
      </View>

      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row', gap: 6, padding: 4, borderRadius: 14,
          backgroundColor: tokens.inputFill, borderWidth: 1, borderColor: tokens.hairline,
        }}
      >
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setTab(item.id)}
              activeOpacity={0.85}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              style={{
                flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                backgroundColor: active ? tokens.cyan : 'transparent',
              }}
            >
              <Text style={{ color: active ? tokens.primaryText : tokens.muted, fontWeight: '900', fontSize: 12 }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === 'overview' ? (
        <>
          <SectionCard>
            <KpiRow
              icon="trophy-outline"
              label="RANK"
              value={vm.playerRank?.rank ? `#${vm.playerRank.rank}` : '—'}
              sub={vm.rankingPoints ? `${formatNumber(vm.rankingPoints, 1)} pts` : 'Unranked'}
            />
            <KpiRow
              icon="football-outline"
              label="RECORD"
              value={`${vm.wins}-${vm.draws}-${vm.losses}`}
              sub={`${formatNumber(vm.winRate, 1)}% win rate`}
            />
            <KpiRow
              icon="star-outline"
              label="RATING"
              value={formatNumber(vm.avgRating, 1)}
              sub="Avg match rating"
            />
            <KpiRow
              icon="document-text-outline"
              label="CONTRACT"
              value={vm.tenure?.contractProgress ? `${vm.tenure.contractProgress.gamesLeft}` : '—'}
              sub={vm.tenure?.contractProgress ? 'games remaining' : 'No active contract'}
            />
          </SectionCard>
          <KickoffCard vm={vm} />
          <FormBlock vm={vm} stageOnly />
        </>
      ) : null}

      {tab === 'club' ? (
        <>
          <ClubBlock vm={vm} />
          <DashboardQuickGlance glance={vm.glance} onOpen={vm.open} />
          <ObjectivesBlock vm={vm} />
        </>
      ) : null}

      {tab === 'compete' ? (
        <>
          <UpcomingBlock vm={vm} />
          <TournamentsBlock vm={vm} />
          <LeagueBlock vm={vm} />
          <ActivityBlock vm={vm} />
          <FutBlock vm={vm} />
        </>
      ) : null}
    </>
  );
}

function ShortcutTile({ icon, label, onPress, accent = 'cyan' }) {
  const tokens = useGamerTokens();
  const color = accent === 'gold' ? tokens.amber : tokens.cyan;
  return (
    <LiveGlass
      intensity={22}
      style={{
        flex: 1, minHeight: 72, borderRadius: 14,
        borderWidth: 1.5, borderColor: accent === 'gold' ? tokens.amberBorder : tokens.cyanBorder,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          minHeight: 72, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12,
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
        <Text style={{ color: tokens.text, fontWeight: '800', fontSize: 12 }}>{label}</Text>
      </TouchableOpacity>
    </LiveGlass>
  );
}

function LayoutC({ vm }) {
  const tokens = useGamerTokens();
  return (
    <>
      <PitchAtmosphere style={{
        borderWidth: 1.5,
        borderColor: tokens.amberBorder,
        shadowColor: tokens.amber,
        shadowOpacity: tokens.isDark ? 0.3 : 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
      }}
      >
        <View style={{ padding: 18, alignItems: 'center' }}>
          <DashboardRankRing rank={vm.playerRank?.rank} winRate={vm.winRate} size={104} />
          <GamertagTitle vm={vm} centered style={{ color: tokens.text, marginTop: 12 }} />
          <View style={{ marginTop: 10 }}>
            <IdentityChips player={vm.player} />
          </View>
          <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 16, marginTop: 14 }}>
            {vm.wins}W · {vm.draws}D · {vm.losses}L
          </Text>
        </View>
      </PitchAtmosphere>

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
          <ShortcutTile icon="flash" label="Game Day" onPress={() => vm.open('/(tabs)/matches')} />
          <ShortcutTile icon="trophy-outline" label="Rankings" accent="gold" onPress={() => vm.open('/apps/rankings')} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
          <ShortcutTile
            icon="shield-outline"
            label="Club"
            accent="gold"
            onPress={() => (vm.club
              ? vm.open({ pathname: '/teams/teamprofilescreen', params: { teamId: String(vm.club.id) } })
              : vm.open('/(tabs)/search/searchclubs'))}
          />
          <ShortcutTile icon="mail-outline" label="Inbox" onPress={() => vm.open('/apps/inbox')} />
        </View>
      </View>

      <TouchableOpacity
        onPress={() => vm.open('/(tabs)/matches')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={vm.nextMatch ? `Next match ${vm.opponentInfo.opponent}` : 'Open Game Day'}
        style={{
          minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: tokens.cyanBorder,
          backgroundColor: hexToRgba(tokens.cyan, 0.1), paddingHorizontal: 14,
          flexDirection: 'row', alignItems: 'center', gap: 10,
        }}
      >
        <Ionicons name="football-outline" size={18} color={tokens.cyan} />
        <Text style={{ color: tokens.cyan, fontWeight: '800', flex: 1 }} numberOfLines={1}>
          {vm.nextMatch
            ? `${vm.opponentInfo.opponent} · ${formatWhen(vm.nextMatch.scheduled_date)}`
            : 'No match lined up'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={tokens.cyan} />
      </TouchableOpacity>

      <FormBlock vm={vm} stageOnly />
      <ClubBlock vm={vm} compact />
      <DashboardQuickGlance glance={vm.glance} onOpen={vm.open} />
      <BelowFold vm={vm} />
    </>
  );
}

function BentoTile({ label, value, sub, gold, onPress }) {
  const tokens = useGamerTokens();
  const inner = (
    <LiveGlass
        intensity={24}
      style={{
        flex: 1, minHeight: 88, borderRadius: 16, padding: 12, justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: gold ? tokens.amberBorder : tokens.cyanBorder,
        backgroundColor: tokens.live ? 'transparent' : tokens.cardSolid,
        shadowColor: tokens.cyan,
        shadowOpacity: tokens.live ? 0.35 : 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
      }}
    >
      <Text style={{ color: tokens.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }}>
        {label}
      </Text>
      <Text style={{ color: gold ? tokens.amber : tokens.text, fontWeight: '900', fontSize: 26 }}>{value}</Text>
      {sub ? <Text style={{ color: tokens.muted, fontSize: 11 }}>{sub}</Text> : null}
    </LiveGlass>
  );
  if (!onPress) return inner;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ flex: 1 }} accessibilityRole="button">
      {inner}
    </TouchableOpacity>
  );
}

function LayoutD({ vm }) {
  const tokens = useGamerTokens();
  const liveTournament = vm.activeTournaments?.[0];
  const badge = liveTournament ? tournamentBadge(liveTournament.status) : null;

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <GamertagTitle vm={vm} style={{ color: tokens.text, fontSize: 22 }} />
          <View style={{ marginTop: 8 }}>
            <IdentityChips player={vm.player} />
          </View>
        </View>
        <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 22 }}>
          {vm.playerRank?.rank ? `#${vm.playerRank.rank}` : '—'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>
        <View style={{ flex: 1.25 }}>
          <KickoffCard vm={vm} compact />
        </View>
        <View style={{ flex: 0.75, gap: 10 }}>
          <BentoTile
            label="RANK"
            value={vm.playerRank?.rank ? `#${vm.playerRank.rank}` : '—'}
            sub={vm.rankingPoints ? `${formatNumber(vm.rankingPoints, 1)} pts` : 'Unranked'}
            gold
            onPress={() => vm.open('/apps/rankings')}
          />
          <BentoTile
            label="RATING"
            value={formatNumber(vm.avgRating, 1)}
            sub={`${formatNumber(vm.winRate, 1)}% WR`}
          />
        </View>
      </View>

      <FormBlock vm={vm} stageOnly />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <LiveGlass
          intensity={24}
          style={{
            flex: 1, minHeight: 120, borderRadius: 20,
            borderWidth: 1.5, borderColor: tokens.amberBorder,
          }}
        >
        <TouchableOpacity
          onPress={() => (vm.club
            ? vm.open({ pathname: '/teams/teamprofilescreen', params: { teamId: String(vm.club.id) } })
            : vm.open('/(tabs)/search/searchclubs'))}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={vm.club ? vm.club.name : 'Find a club'}
          style={{
            flex: 1, minHeight: 120, padding: 16, justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: tokens.amber, fontSize: 9, fontWeight: '900', letterSpacing: 2 }}>CLUB</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {vm.club ? <ClubCrest club={vm.club} size={36} /> : null}
            <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 15, flex: 1 }} numberOfLines={2}>
              {vm.club?.name || 'Free agent'}
            </Text>
          </View>
          <Text style={{ color: tokens.muted, fontSize: 12 }}>
            {vm.clubRank?.rank ? `Rank #${vm.clubRank.rank}` : 'Find a club'}
          </Text>
        </TouchableOpacity>
        </LiveGlass>
        <LiveGlass
          intensity={24}
          style={{
            flex: 1, minHeight: 120, borderRadius: 20,
            borderWidth: 1.5, borderColor: tokens.cyanBorder,
          }}
        >
        <TouchableOpacity
          onPress={() => (liveTournament
            ? vm.open({
              pathname: '/(tabs)/tournaments/tournamentdetailscreen',
              params: { tournamentId: String(liveTournament.id) },
            })
            : vm.open('/(tabs)/tournaments'))}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={liveTournament ? liveTournament.name : 'Open tournaments'}
          style={{
            flex: 1, minHeight: 120, padding: 16, justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: tokens.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 2 }}>COMPETE</Text>
          <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 16 }} numberOfLines={2}>
            {liveTournament?.name || 'No active cup'}
          </Text>
          {badge ? (
            <View style={{
              alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
              borderWidth: 1, borderColor: badge.border, backgroundColor: badge.bg,
            }}
            >
              <Text style={{ color: badge.color, fontSize: 9, fontWeight: '900' }}>{badge.text}</Text>
            </View>
          ) : (
            <Text style={{ color: tokens.faint, fontSize: 12 }}>Browse tournaments</Text>
          )}
        </TouchableOpacity>
        </LiveGlass>
      </View>

      <LiveGlass
        intensity={22}
        style={{
          borderRadius: 14, borderWidth: 1, borderColor: tokens.hairline,
          paddingVertical: 12, paddingHorizontal: 14,
          flexDirection: 'row', justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: tokens.cyan, fontWeight: '900' }}>{vm.wins}W</Text>
        <Text style={{ color: tokens.muted, fontWeight: '900' }}>{vm.draws}D</Text>
        <Text style={{ color: tokens.amber, fontWeight: '900' }}>{vm.losses}L</Text>
        <Text style={{ color: tokens.text, fontWeight: '900' }}>{formatNumber(vm.winRate, 1)}% WR</Text>
      </LiveGlass>

      <DashboardQuickGlance glance={vm.glance} onOpen={vm.open} />
      <BelowFold vm={vm} />
    </>
  );
}

export function DashboardLayoutBody({ layout, vm }) {
  if (layout === 'B') return <LayoutB vm={vm} />;
  if (layout === 'C') return <LayoutC vm={vm} />;
  if (layout === 'D') return <LayoutD vm={vm} />;
  return <LayoutA vm={vm} />;
}
