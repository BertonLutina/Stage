import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hexToRgba } from '@/lib/stageTheme';
import { FutIdentityCard, useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { getMatchOpponent } from '@/lib/dashboardData';
import { DASHBOARD_LAYOUTS } from '@/lib/dashboardLayouts';
import TransferWindowHomeIcon from '@/components/dashboard/TransferWindowHomeIcon';
import { Avatar, BrandLogo, Card, Chip, FormBadge, IconButton, SectionLabel, SegmentedControl } from '@/components/ui';
import {
  DashboardGamerStatCard,
  DashboardQuickGlance,
  DashboardFormStrip,
  DASHBOARD_CARD_RADIUS,
  SectionCard,
  LinkText,
  MiniBarChart,
  ObjectivesWidget,
  ClubCrest,
  formatNumber,
  formatDays,
  formatWhen,
  innerTileChrome,
  sectionLabelStyle,
  tileChrome,
} from '@/components/dashboard/CommandCenterUI';
import PageTile from '@/components/theme/PageTile';

export { DASHBOARD_LAYOUTS };

function DashCard(props) {
  return <SectionCard radius={DASHBOARD_CARD_RADIUS} {...props} />;
}

function HomePageTile({ vm, children }) {
  return (
    <PageTile
      tileKey="home"
      tileTitle="HOME"
      player={vm.player}
      onPlayerChanged={vm.patchPlayer}
      contentStyle={{ paddingHorizontal: 12, gap: 14 }}
    >
      {children}
    </PageTile>
  );
}

/** Status pill colours for a tournament, from tokens only. */
function tournamentBadge(status, tokens) {
  const s = String(status || '').toLowerCase();
  if (['open', 'registration'].includes(s)) {
    return {
      text: 'OPEN', color: tokens.success, bg: tokens.successBg, border: hexToRgba(tokens.success, 0.35),
    };
  }
  if (['league_phase', 'in_progress', 'group_stage', 'knockout', 'playoffs'].includes(s)) {
    return {
      text: 'LIVE', color: tokens.cyan, bg: hexToRgba(tokens.cyan, 0.12), border: tokens.cyanBorder,
    };
  }
  return {
    text: s.replace(/_/g, ' ').toUpperCase() || '—',
    color: tokens.muted,
    bg: tokens.border,
    border: tokens.borderStrong,
  };
}

function StatusPill({ badge, style }) {
  return (
    <View style={[{
      paddingHorizontal: 10, height: 24, justifyContent: 'center', borderRadius: 999,
      borderWidth: 1, borderColor: badge.border, backgroundColor: badge.bg,
    }, style]}
    >
      <Text numberOfLines={1} style={{ color: badge.color, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 }}>
        {badge.text}
      </Text>
    </View>
  );
}

function initialsOf(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '—';
  if (words.length === 1) return words[0].slice(0, 3);
  return words.slice(0, 3).map((w) => w[0]).join('');
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
        style={[{ fontFamily: FONT_EA_SPORTS, textTransform: 'uppercase', flexShrink: 1 }, style]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
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
      <Text style={{ color: tokens.muted, fontSize: 12 }}>No recent form</Text>
    );
  }
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {recent.map((item, i) => {
        const key = String(item || 'draw').toLowerCase();
        const letter = key === 'win' ? 'W' : key === 'loss' ? 'L' : 'D';
        return <FormBadge key={`${letter}-${i}`} result={letter} />;
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
        <GamertagTitle vm={vm} style={{ color: tokens.text, fontSize: 28, letterSpacing: 28 * 0.03 }} />
        <TouchableOpacity
          onPress={openClub}
          activeOpacity={vm.club ? 0.85 : 1}
          disabled={!vm.club}
          accessibilityRole={vm.club ? 'button' : 'text'}
          accessibilityLabel={vm.club?.name || 'Free agent'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}
        >
          {vm.club ? <ClubCrest club={vm.club} size={28} /> : null}
          <Text style={{ color: tokens.textSoft, fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={1}>
            {vm.club?.name || 'Free agent'}
          </Text>
        </TouchableOpacity>
        <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
          {rankLabel}
          <Text style={{ color: tokens.muted, fontWeight: '600' }}>
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
  const ownLogo = vm.club?.logo_url || undefined;
  const homeLogo = opponentInfo.isHome ? ownLogo : undefined;
  const awayLogo = opponentInfo.isHome ? undefined : ownLogo;
  const side = nextMatch ? (opponentInfo.isHome ? 'HOME' : 'AWAY') : 'NEXT MATCH';

  return (
    <Card
      highlight
      onPress={() => open('/(tabs)/matches')}
      accessibilityLabel={nextMatch ? `Next match versus ${opponentInfo.opponent}` : 'Open Game Day'}
      style={{ borderRadius: DASHBOARD_CARD_RADIUS, gap: 14 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text
          numberOfLines={1}
          style={[sectionLabelStyle(tokens), { color: tokens.cyan, flex: 1 }]}
        >
          {nextMatch ? `${side} · ${formatWhen(nextMatch.scheduled_date)}` : side}
        </Text>
        {nextMatch?.competition ? (
          <Chip label={String(nextMatch.competition)} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
        )}
      </View>
      {nextMatch ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 }}>
          <View style={{ alignItems: 'center', gap: 6, width: 96 }}>
            <Avatar initials={initialsOf(opponentInfo.home)} uri={homeLogo} size={52} />
            <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 13, fontWeight: '700' }}>
              {opponentInfo.home}
            </Text>
          </View>
          <Text style={{ color: tokens.muted, fontFamily: FONT_EA_SPORTS, fontSize: 30, textTransform: 'uppercase' }}>
            VS
          </Text>
          <View style={{ alignItems: 'center', gap: 6, width: 96 }}>
            <Avatar initials={initialsOf(opponentInfo.away)} uri={awayLogo} size={52} />
            <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 13, fontWeight: '700' }}>
              {opponentInfo.away}
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {vm.club ? <ClubCrest club={vm.club} size={36} /> : (
            <View style={{
              width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
              backgroundColor: tokens.inputFill, borderWidth: 1, borderColor: tokens.border,
            }}
            >
              <Ionicons name="football-outline" size={18} color={tokens.textSoft} />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
              No fixture yet
            </Text>
            <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
              Open Game Day to find a match
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
}

function ClubBlock({ vm, compact = false }) {
  const tokens = useGamerTokens();
  const { club, clubRank, tenure, open } = vm;
  return (
    <DashCard accent="gold">
      <View style={{ marginBottom: 14 }}>
        <SectionLabel
          right={clubRank?.rank ? (
            <Text style={{ color: tokens.cyan, fontSize: 14, fontWeight: '700' }}>#{clubRank.rank}</Text>
          ) : null}
        >
          My Club
        </SectionLabel>
      </View>
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
              <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 16 }} numberOfLines={1}>
                {club.name}
              </Text>
              <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 3 }} numberOfLines={1}>
                {[club.tag ? `[${club.tag}]` : null, club.region || 'Global'].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
          </View>
          {!compact && clubRank?.row ? (
            <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 12 }}>
              {formatNumber(clubRank.row.ranking_points, 1)} pts · {clubRank.row.wins || 0}W {clubRank.row.draws || 0}D {clubRank.row.losses || 0}L
            </Text>
          ) : null}
          {!compact && tenure?.daysAtClub != null ? (
            <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 8 }}>
              {formatDays(tenure.daysAtClub)} at club
            </Text>
          ) : null}
          {tenure?.contractProgress ? (
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={sectionLabelStyle(tokens)}>CONTRACT GAMES</Text>
                <Text style={{ color: tokens.text, fontSize: 12, fontWeight: '700' }}>
                  {tenure.contractProgress.gamesPlayed}/{tenure.contractProgress.maxGames}
                </Text>
              </View>
              <View style={{
                height: 6, borderRadius: 3, backgroundColor: tokens.border, marginTop: 8, overflow: 'hidden',
              }}
              >
                <View style={{
                  width: `${tenure.contractProgress.gamesPercent}%`,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: tokens.cyan,
                }}
                />
              </View>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : (
        <View>
          <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>
            You’re a free agent. Clubs offer contracts — wait for an offer in Inbox.
          </Text>
        </View>
      )}
    </DashCard>
  );
}

function FormBlock({ vm, stageOnly = false }) {
  return (
    <DashCard>
      <View style={{ marginBottom: 14 }}>
        <SectionLabel>Recent form</SectionLabel>
      </View>
      <DashboardFormStrip label="Stage form" mode="outcome" items={vm.form?.stage} emptyLabel="No completed Stage matches yet." />
      {!stageOnly ? (
        <DashboardFormStrip label="Rating form" mode="rating" items={vm.form?.rating} emptyLabel="No match ratings tracked yet." />
      ) : null}
    </DashCard>
  );
}

function UpcomingBlock({ vm }) {
  const tokens = useGamerTokens();
  const { upcomingMatches, player, club, open } = vm;
  if (!(upcomingMatches?.length > 1)) return null;
  return (
    <View style={{ gap: 12 }}>
      <SectionLabel right={<LinkText label="Game Day" onPress={() => open('/(tabs)/matches')} />}>
        Upcoming
      </SectionLabel>
      {upcomingMatches.slice(1, 5).map((m, i) => {
        const opp = getMatchOpponent(m, player, club);
        return (
          <Card
            key={m.id || i}
            onPress={() => open('/(tabs)/matches')}
            accessibilityLabel={`${opp.home} versus ${opp.away}`}
            style={{ gap: 4 }}
          >
            <Text numberOfLines={1} style={[sectionLabelStyle(tokens), { color: tokens.cyan }]}>
              {String(m.status).toLowerCase() === 'live' ? 'LIVE' : formatWhen(m.scheduled_date)}
            </Text>
            <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
              {opp.home} <Text style={{ color: tokens.muted, fontWeight: '500' }}>vs</Text> {opp.away}
            </Text>
          </Card>
        );
      })}
    </View>
  );
}

function ActivityBlock({ vm }) {
  const tokens = useGamerTokens();
  return (
    <DashCard>
      <View style={{ marginBottom: 14 }}>
        <SectionLabel>Activity</SectionLabel>
      </View>
      <Text style={[sectionLabelStyle(tokens), { marginBottom: 8 }]}>
        RATING TREND
      </Text>
      <MiniBarChart
        data={(vm.activity?.timeline || []).map((p) => ({ label: p.label, matches: p.rating }))}
        valueKey="matches"
        color={tokens.warning}
        emptyLabel="No rating history yet."
      />
      <Text style={[sectionLabelStyle(tokens), { marginTop: 16, marginBottom: 8 }]}>
        WEEKLY MATCHES
      </Text>
      <MiniBarChart
        data={vm.activity?.weekly}
        valueKey="matches"
        color={tokens.cyan}
        emptyLabel="No weekly activity yet."
      />
    </DashCard>
  );
}

function ObjectivesBlock({ vm }) {
  const tokens = useGamerTokens();
  if (!vm.player?.id) return null;
  return (
    <DashCard accent="gold">
      <View style={{ marginBottom: 10 }}>
        <SectionLabel>Objectives</SectionLabel>
      </View>
      <Text style={{ color: tokens.muted, fontSize: 12, marginBottom: 14 }}>
        Daily and weekly rewards for staying active.
      </Text>
      <ObjectivesWidget playerId={vm.player.id} />
    </DashCard>
  );
}

function TournamentsBlock({ vm }) {
  const tokens = useGamerTokens();
  const { activeTournaments, open } = vm;
  return (
    <DashCard>
      <View style={{ marginBottom: 14 }}>
        <SectionLabel right={<LinkText label="View all" onPress={() => open('/(tabs)/tournaments')} />}>
          Active tournaments
        </SectionLabel>
      </View>
      {!activeTournaments?.length ? (
        <Text style={{ color: tokens.muted, fontSize: 14 }}>No active competitions yet.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {activeTournaments.slice(0, 5).map((tr) => {
            const badge = tournamentBadge(tr.status, tokens);
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
                  ...innerTileChrome(tokens, { padding: 12, minHeight: 44 }),
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: tokens.text, fontWeight: '700' }} numberOfLines={1}>{tr.name}</Text>
                  <Text style={[sectionLabelStyle(tokens), { marginTop: 3 }]} numberOfLines={1}>
                    {String(tr.type || 'tournament').replace(/_/g, ' ')}
                  </Text>
                </View>
                <StatusPill badge={badge} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </DashCard>
  );
}

function LeagueBlock({ vm }) {
  const tokens = useGamerTokens();
  return (
    <DashCard accent="gold">
      <View style={{ marginBottom: 14 }}>
        <SectionLabel right={<LinkText label="View all" onPress={() => vm.open('/apps/competitions')} />}>
          League standings
        </SectionLabel>
      </View>
      {!vm.leagueStandings?.length ? (
        <Text style={{ color: tokens.muted, fontSize: 14 }}>No league place yet.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {vm.leagueStandings.slice(0, 5).map((row) => (
            <View
              key={row.id || `${row.season_id}-${row.club_id}`}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                ...innerTileChrome(tokens, { padding: 12 }),
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: tokens.text, fontWeight: '700' }} numberOfLines={1}>{row.label}</Text>
                <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 3 }}>
                  {row.points ?? 0} pts · {row.played ?? 0} played
                </Text>
              </View>
              <Text style={{
                color: tokens.cyan, fontFamily: FONT_EA_SPORTS, fontSize: 22, textTransform: 'uppercase',
              }}
              >
                {row.position ? `#${row.position}` : '—'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </DashCard>
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
    <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 12 }}>
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
      borderBottomWidth: 1, borderBottomColor: tokens.border,
    }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: tokens.border, backgroundColor: tokens.inputFill,
      }}
      >
        <Ionicons name={icon} size={22} color={tokens.textSoft} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={sectionLabelStyle(tokens)}>
          {label}
        </Text>
        {sub ? (
          <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>{sub}</Text>
        ) : null}
      </View>
      <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 18 }}>{value}</Text>
    </View>
  );
}

function LayoutA({ vm }) {
  return (
    <>
      <PlayerIdentityHero vm={vm} />
      <HomePageTile vm={vm}>
        <KickoffCard vm={vm} />
        <KpiGrid vm={vm} />
        <FormBlock vm={vm} stageOnly />
        <ClubBlock vm={vm} compact />
        <DashboardQuickGlance glance={vm.glance} onOpen={vm.open} />
        <BelowFold vm={vm} />
      </HomePageTile>
    </>
  );
}

function LayoutB({ vm }) {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'club', label: 'Club' },
    { key: 'compete', label: 'Compete' },
  ];

  return (
    <>
      <PlayerIdentityHero vm={vm} />
      <HomePageTile vm={vm}>
        <KickoffCard vm={vm} />

        <SegmentedControl options={tabs} value={tab} onChange={setTab} />

        {tab === 'overview' ? (
          <>
            <DashCard>
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
            </DashCard>
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
      </HomePageTile>
    </>
  );
}

function ShortcutTile({ icon, label, onPress }) {
  const tokens = useGamerTokens();
  return (
    <View style={tileChrome(tokens, { flex: 1, minHeight: 72 })}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          minHeight: 72, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12,
        }}
      >
        <Ionicons name={icon} size={22} color={tokens.textSoft} />
        <Text style={[sectionLabelStyle(tokens), { color: tokens.textSoft }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function LayoutC({ vm }) {
  return (
    <>
      <PlayerIdentityHero vm={vm} />
      <HomePageTile vm={vm}>
        <KickoffCard vm={vm} />

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 12 }}>
            <ShortcutTile icon="flash-outline" label="Game Day" onPress={() => vm.open('/(tabs)/matches')} />
            <ShortcutTile icon="trophy-outline" label="GOST" onPress={() => vm.open('/apps/competitions')} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 12 }}>
            <ShortcutTile
              icon="shield-outline"
              label="Club"
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
      </HomePageTile>
    </>
  );
}

function LayoutD({ vm }) {
  const tokens = useGamerTokens();
  const liveTournament = vm.activeTournaments?.[0];
  const badge = liveTournament ? tournamentBadge(liveTournament.status, tokens) : null;

  return (
    <>
      <PlayerIdentityHero vm={vm} />
      <HomePageTile vm={vm}>
        <KickoffCard vm={vm} />

        <FormBlock vm={vm} stageOnly />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={tileChrome(tokens, { flex: 1, minHeight: 120 })}>
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
              <Text style={sectionLabelStyle(tokens)}>CLUB</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {vm.club ? <ClubCrest club={vm.club} size={36} /> : null}
                <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15, flex: 1 }} numberOfLines={2}>
                  {vm.club?.name || 'Free agent'}
                </Text>
              </View>
              <Text style={{ color: tokens.muted, fontSize: 12 }} numberOfLines={2}>
                {vm.clubRank?.rank ? `Rank #${vm.clubRank.rank}` : 'Waiting for a contract offer'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={tileChrome(tokens, { flex: 1, minHeight: 120 })}>
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
              <Text style={sectionLabelStyle(tokens)}>COMPETE</Text>
              <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 16 }} numberOfLines={2}>
                {liveTournament?.name || 'No active cup'}
              </Text>
              {badge ? (
                <StatusPill badge={badge} style={{ alignSelf: 'flex-start' }} />
              ) : (
                <Text style={{ color: tokens.muted, fontSize: 12 }}>Browse tournaments</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <DashboardQuickGlance glance={vm.glance} onOpen={vm.open} />
        <BelowFold vm={vm} />
      </HomePageTile>
    </>
  );
}

function homeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const FORM_LETTER = { win: 'W', won: 'W', w: 'W', draw: 'D', drawn: 'D', d: 'D', loss: 'L', lost: 'L', l: 'L' };
function formLetter(value) {
  const key = String(value || '').toLowerCase();
  return FORM_LETTER[key] || String(value || '').charAt(0).toUpperCase();
}

/**
 * Stage home — a faithful build of docs/design/stage-mockups/2-home-gameday/Home:
 * logo + greeting + gamertag header, highlighted next-match card, Club / Contract
 * games pair, Recent form, and Objectives. Wired to the real dashboard view-model
 * (`loadPlayerDashboard`) and `ObjectivesWidget`. The default layout; A/B/C/D keep
 * the Command Center.
 */
function LayoutE({ vm }) {
  const tokens = useGamerTokens();
  const opponent = vm.opponentInfo || {};
  const next = vm.nextMatch;
  const contract = vm.tenure?.contractProgress;
  const unread = Number(vm.glance?.unreadNotifications || 0);
  const formItems = Array.isArray(vm.form?.stage) ? vm.form.stage : [];
  const clubMeta = [
    vm.clubRank?.rank ? `Rank #${vm.clubRank.rank}` : null,
    vm.club?.division ? `Div ${vm.club.division}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View>
          <BrandLogo variant="lockup" width={108} style={{ marginBottom: 10 }} />
          <Text style={{ color: tokens.muted, fontSize: 13 }}>{homeGreeting()}</Text>
          <Text
            numberOfLines={1}
            style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 28, letterSpacing: 28 * 0.03, textTransform: 'uppercase' }}
          >
            {vm.gamertag}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton icon="grid-outline" accessibilityLabel="Apps" onPress={() => vm.open('/apps')} />
          <View>
            <IconButton
              icon="notifications-outline"
              accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
              onPress={() => vm.open('/apps/notifications')}
            />
            {unread > 0 ? (
              <View style={{ position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: 5, backgroundColor: tokens.cyan }} />
            ) : null}
          </View>
        </View>
      </View>

      <HomePageTile vm={vm}>
        {next ? (
          <Card
            highlight
            onPress={() => vm.open({ pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId: String(next.id) } })}
            accessibilityLabel={`Next match versus ${opponent.opponent || opponent.away || 'opponent'}`}
            style={{ gap: 14 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: tokens.cyan, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase', flexShrink: 1 }}>
                {`Game Day · ${formatWhen(next.scheduled_date || next.scheduled_at || next.match_date) || 'Scheduled'}`}
              </Text>
              <Chip label={next.competition || next.type || 'Match'} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6 }}>
              <View style={{ alignItems: 'center', gap: 6, width: 90 }}>
                <Avatar initials={initialsOf(opponent.home)} size={52} />
                <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: '700', fontSize: 13 }}>{opponent.home}</Text>
              </View>
              <Text style={{ color: tokens.muted, fontFamily: FONT_EA_SPORTS, fontSize: 30 }}>VS</Text>
              <View style={{ alignItems: 'center', gap: 6, width: 90 }}>
                <Avatar initials={initialsOf(opponent.away)} size={52} />
                <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: '700', fontSize: 13 }}>{opponent.away}</Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card><Text style={{ color: tokens.muted, fontSize: 14 }}>No fixture yet</Text></Card>
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={{ flex: 1, gap: 6 }}>
            <SectionLabel>Club</SectionLabel>
            <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: '700', fontSize: 16 }}>{vm.club?.name || 'Free agent'}</Text>
            {clubMeta ? <Text style={{ color: tokens.muted, fontSize: 12 }}>{clubMeta}</Text> : null}
          </Card>
          <Card style={{ flex: 1, gap: 6 }}>
            <SectionLabel>Contract games</SectionLabel>
            {contract ? (
              <>
                <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 16 }}>
                  {`${contract.gamesPlayed ?? 0} / ${contract.maxGames ?? 0}`}
                </Text>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: tokens.border }}>
                  <View style={{ width: `${Math.min(100, Math.max(0, contract.gamesPercent ?? 0))}%`, height: 6, borderRadius: 3, backgroundColor: tokens.cyan }} />
                </View>
              </>
            ) : (
              <Text style={{ color: tokens.muted, fontSize: 12 }}>No active contract</Text>
            )}
          </Card>
        </View>

        <Card style={{ gap: 12 }}>
          <SectionLabel right={<LinkText label="Match results" onPress={() => vm.open('/(tabs)/matches')} />}>Recent form</SectionLabel>
          {formItems.length ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {formItems.slice(0, 5).map((item, index) => <FormBadge key={index} result={formLetter(item)} />)}
              {vm.avgRating ? (
                <Text style={{ color: tokens.muted, fontSize: 12, marginLeft: 'auto' }}>{`${formatNumber(vm.avgRating, 1)} avg rating`}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={{ color: tokens.muted, fontSize: 12 }}>No matches yet</Text>
          )}
        </Card>

        <Card style={{ gap: 12 }}>
          <SectionLabel>Objectives</SectionLabel>
          {vm.player?.id ? (
            <ObjectivesWidget playerId={vm.player.id} />
          ) : (
            <Text style={{ color: tokens.muted, fontSize: 12 }}>Finish setup to unlock objectives.</Text>
          )}
        </Card>
      </HomePageTile>
    </>
  );
}

export function DashboardLayoutBody({ layout, vm }) {
  if (layout === 'B') return <LayoutB vm={vm} />;
  if (layout === 'C') return <LayoutC vm={vm} />;
  if (layout === 'D') return <LayoutD vm={vm} />;
  if (layout === 'A') return <LayoutA vm={vm} />;
  return <LayoutE vm={vm} />;
}
