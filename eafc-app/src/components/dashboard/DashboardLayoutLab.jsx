import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hexToRgba } from '@/lib/stageTheme';
import LiveGlass from '@/components/theme/LiveGlass';
import { CYAN, AMBER, FutIdentityCard, useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleLg } from '@/lib/fonts';
import { getMatchOpponent } from '@/lib/dashboardData';
import { DASHBOARD_LAYOUTS } from '@/lib/dashboardLayouts';
import TransferWindowHomeIcon from '@/components/dashboard/TransferWindowHomeIcon';
import {
  DashboardGamerStatCard,
  DashboardQuickGlance,
  DashboardFormStrip,
  SectionCard,
  SectionTitle,
  LinkText,
  MiniBarChart,
  ObjectivesWidget,
  ClubCrest,
  formatNumber,
  formatDays,
  formatWhen,
} from '@/components/dashboard/CommandCenterUI';

export { DASHBOARD_LAYOUTS };

function tournamentBadge(status) {
  const s = String(status || '').toLowerCase();
  if (['open', 'registration'].includes(s)) {
    return { text: 'OPEN', color: '#34D399', bg: 'rgba(124,255,107,0.12)', border: 'rgba(124,255,107,0.35)' };
  }
  if (['league_phase', 'in_progress', 'group_stage', 'knockout', 'playoffs'].includes(s)) {
    return { text: 'LIVE', color: CYAN, bg: 'rgba(0,232,255,0.12)', border: 'rgba(0,232,255,0.35)' };
  }
  return {
    text: s.replace(/_/g, ' ').toUpperCase() || '—',
    color: '#94A3B8',
    bg: 'rgba(148,163,184,0.12)',
    border: 'rgba(148,163,184,0.28)',
  };
}

function GamertagTitle({ vm, style }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
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

function FormPips({ items }) {
  const tokens = useGamerTokens();
  const recent = (items || []).slice(-5);
  if (!recent.length) {
    return (
      <Text style={{ color: tokens.faint, fontSize: 12 }}>No recent form</Text>
    );
  }
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {recent.map((item, i) => {
        const key = String(item || 'draw').toLowerCase();
        const win = key === 'win';
        const loss = key === 'loss';
        const color = win ? '#34D399' : loss ? '#FB7185' : tokens.muted;
        const letter = win ? 'W' : loss ? 'L' : 'D';
        return (
          <View
            key={`${letter}-${i}`}
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: hexToRgba(color, 0.16),
              borderWidth: 1,
              borderColor: hexToRgba(color, 0.4),
            }}
          >
            <Text style={{ color, fontSize: 10, fontWeight: '900' }}>{letter}</Text>
          </View>
        );
      })}
    </View>
  );
}

function PlayerIdentityHero({ vm }) {
  const tokens = useGamerTokens();
  const player = vm.player;
  const rankLabel = vm.playerRank?.rank ? `#${vm.playerRank.rank}` : 'Unranked';
  const openProfile = () => vm.open('/(tabs)/profile/profilescreen');
  const openClub = () => {
    if (!vm.club?.id) return;
    vm.open({ pathname: '/teams/teamprofilescreen', params: { teamId: String(vm.club.id) } });
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
      <FutIdentityCard
        imageUrl={player?.avatar_url}
        accent="cyan"
        variant="overlay"
        overall={player?.overall_rating ?? vm.avgRating}
        position={player?.position}
        onPress={openProfile}
        width={148}
      />
      <View style={{ flex: 1, minWidth: 0, paddingBottom: 2, gap: 8 }}>
        <GamertagTitle vm={vm} style={{ color: tokens.text, fontSize: 22 }} />
        <TouchableOpacity
          onPress={openClub}
          activeOpacity={vm.club ? 0.85 : 1}
          disabled={!vm.club}
          accessibilityRole={vm.club ? 'button' : 'text'}
          accessibilityLabel={vm.club?.name || 'Free agent'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          {vm.club ? <ClubCrest club={vm.club} size={28} /> : null}
          <Text style={{ color: tokens.muted, fontSize: 13, fontWeight: '700', flex: 1 }} numberOfLines={1}>
            {vm.club?.name || 'Free agent'}
          </Text>
        </TouchableOpacity>
        <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 15 }}>
          {rankLabel}
          <Text style={{ color: tokens.muted, fontWeight: '700' }}>
            {`  ·  ${vm.wins}W ${vm.draws}D ${vm.losses}L`}
          </Text>
        </Text>
        <FormPips items={vm.form?.stage} />
      </View>
    </View>
  );
}

function KickoffCard({ vm }) {
  const tokens = useGamerTokens();
  const { nextMatch, opponentInfo, open } = vm;
  return (
    <TouchableOpacity
      onPress={() => open('/(tabs)/matches')}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={nextMatch ? `Next match versus ${opponentInfo.opponent}` : 'Open Game Day'}
    >
      <LiveGlass
        intensity={28}
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: tokens.hairline,
        }}
      >
        <View style={{
          minHeight: 58,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
        >
          {vm.club ? <ClubCrest club={vm.club} size={36} /> : (
            <View style={{
              width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
              backgroundColor: tokens.inputFill, borderWidth: 1, borderColor: tokens.hairline,
            }}
            >
              <Ionicons name="football-outline" size={18} color={tokens.cyan} />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: tokens.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 }}>
              {nextMatch ? (opponentInfo.isHome ? 'HOME' : 'AWAY') : 'NEXT MATCH'}
            </Text>
            <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 15, marginTop: 2 }} numberOfLines={1}>
              {nextMatch ? opponentInfo.opponent : 'No fixture yet'}
            </Text>
            <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
              {nextMatch
                ? `${formatWhen(nextMatch.scheduled_date)}${nextMatch.competition ? ` · ${nextMatch.competition}` : ''}`
                : 'Open Game Day to find a match'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={tokens.faint} />
        </View>
      </LiveGlass>
    </TouchableOpacity>
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
          <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 19 }}>
            You’re a free agent. Clubs offer contracts — wait for an offer in Inbox.
          </Text>
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
        <DashboardFormStrip label="Rating form" mode="rating" items={vm.form?.rating} emptyLabel="No match ratings tracked yet." />
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

function BelowFold({ vm }) {
  return (
    <>
      <UpcomingBlock vm={vm} />
      <ActivityBlock vm={vm} />
      <ObjectivesBlock vm={vm} />
      <TournamentsBlock vm={vm} />
      <LeagueBlock vm={vm} />
    </>
  );
}

function KpiGrid({ vm }) {
  return (
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
  return (
    <>
      <PlayerIdentityHero vm={vm} />
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
      <PlayerIdentityHero vm={vm} />
      <KickoffCard vm={vm} />

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
  return (
    <>
      <PlayerIdentityHero vm={vm} />
      <KickoffCard vm={vm} />

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
              : vm.open('/apps/inbox'))}
          />
          <ShortcutTile icon="mail-outline" label="Inbox" onPress={() => vm.open('/apps/inbox')} />
        </View>
      </View>

      <FormBlock vm={vm} stageOnly />
      <ClubBlock vm={vm} compact />
      <DashboardQuickGlance glance={vm.glance} onOpen={vm.open} />
      <BelowFold vm={vm} />
    </>
  );
}

function LayoutD({ vm }) {
  const tokens = useGamerTokens();
  const liveTournament = vm.activeTournaments?.[0];
  const badge = liveTournament ? tournamentBadge(liveTournament.status) : null;

  return (
    <>
      <PlayerIdentityHero vm={vm} />
      <KickoffCard vm={vm} />

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
            : vm.open('/apps/inbox'))}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={vm.club ? vm.club.name : 'Inbox for contract offers'}
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
            {vm.clubRank?.rank ? `Rank #${vm.clubRank.rank}` : 'Waiting for a contract offer'}
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
