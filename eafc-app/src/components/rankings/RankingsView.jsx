import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import {
  Avatar, Button, Card, Chip, EmptyState, ErrorState, SkeletonList,
} from '@/components/ui';
import useRankings from '@/hooks/useRankings';
import useT from '@/hooks/useT';
import {
  INITIAL_VISIBLE, PAGE_STEP, buildBoard, filterOptions, filterRankings,
} from '@/lib/rankings';

const TAP = 44;
const RANK_COL = 28;
const RECORD_COL = 62;
const POINTS_COL = 58;

function formatPoints(value) {
  const n = Math.round(Number(value) || 0);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function initialsOf(text) {
  return String(text || '').trim().slice(0, 3);
}

/** Normalises a club or player row to what the table shows. */
function toDisplay(kind, row) {
  if (kind === 'clubs') {
    return {
      name: row.name || '',
      initials: initialsOf(row.tag || row.name),
      uri: row.logo_url || null,
      w: row.wins, d: row.draws, l: row.losses,
      points: row.ranking_points,
    };
  }
  return {
    name: row.gamertag || '',
    initials: initialsOf(row.gamertag),
    uri: row.avatar_url || null,
    w: row.ranking_wins ?? row.wins, d: row.ranking_draws ?? row.draws, l: row.ranking_losses ?? row.losses,
    points: row.ranking_points,
    sub: [row.position, row.club_name].filter(Boolean).join(' · '),
  };
}

function Row({ kind, entry, mine, showPoints, youLabel, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  const d = toDisplay(kind, entry.row);
  const record = `${d.w ?? 0}-${d.d ?? 0}-${d.l ?? 0}`;
  const podium = entry.rank <= 3;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.rank}, ${d.name}, ${record}`}
      onPress={onPress}
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderTopColor: tokens.border,
        borderLeftWidth: 3,
        borderLeftColor: mine ? tokens.cyan : 'transparent',
        backgroundColor: mine ? tokens.cyanBg || tokens.bgDeep : 'transparent',
      }}
    >
      <Text style={{ width: RANK_COL, color: podium ? tokens.success : tokens.textSoft, fontSize: 14, fontWeight: '600' }}>
        {entry.rank}
      </Text>
      <Avatar initials={d.initials} uri={d.uri} size={36} round />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 14, fontWeight: mine || entry.rank === 1 ? '700' : '500' }}>
          {d.name}
        </Text>
        {d.sub ? <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 11 }}>{d.sub}</Text> : null}
        {mine ? <Text style={{ color: tokens.cyan, fontSize: 11, fontWeight: '700' }}>{youLabel}</Text> : null}
      </View>
      <Text style={{ width: RECORD_COL, color: tokens.textSoft, fontSize: 13, textAlign: 'center' }}>{record}</Text>
      {showPoints ? (
        <Text style={{ width: POINTS_COL, color: tokens.cyan, fontSize: 16, fontWeight: '700', textAlign: 'right' }}>
          {d.points == null ? '' : formatPoints(d.points)}
        </Text>
      ) : null}
    </Pressable>
  );
}

function HeaderRow({ nameLabel, showPoints, t }) {
  const tokens = useThemeStore((s) => s.tokens);
  const cell = { color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, paddingLeft: 15 }}>
      <Text style={[cell, { width: RANK_COL }]}>{t('stage.rankings.colRank')}</Text>
      <Text style={[cell, { flex: 1, paddingLeft: 46 }]}>{nameLabel}</Text>
      <Text style={[cell, { width: RECORD_COL, textAlign: 'center' }]}>{t('stage.rankings.colRecord')}</Text>
      {showPoints ? <Text style={[cell, { width: POINTS_COL, textAlign: 'right' }]}>{t('stage.rankings.colPoints')}</Text> : null}
    </View>
  );
}

/**
 * Rankings tab: clubs / players, region and platform filters (Plus), the top rows and my
 * own row always visible. The parent owns the scroll view and hears about refresh state
 * through `onRefreshState({ refreshing, refetch })`.
 */
export default function RankingsView({ onRefreshState }) {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const { data, loading, error, refreshing, refetch } = useRankings();
  const [kind, setKind] = useState('clubs');
  const [region, setRegion] = useState('');
  const [platform, setPlatform] = useState('');
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    if (onRefreshState) onRefreshState({ refreshing, refetch });
  }, [onRefreshState, refreshing, refetch]);

  const fullAccess = data?.fullAccess === true;
  const allRows = kind === 'clubs' ? data?.clubs : data?.players;
  const options = useMemo(() => filterOptions([...(data?.clubs || []), ...(data?.players || [])]), [data]);
  const filtered = Boolean(region || platform);
  const rows = useMemo(() => filterRankings(allRows || [], { region, platform }), [allRows, region, platform]);
  const myRecord = kind === 'clubs' ? data?.club : data?.player;
  const board = useMemo(
    () => buildBoard({ rows, myId: myRecord?.id || null, myRecord, filtered, visible }),
    [rows, myRecord, filtered, visible],
  );

  const selectKind = (next) => { setKind(next); setVisible(INITIAL_VISIBLE); };
  const toggleRegion = (value) => { setRegion((cur) => (cur === value ? '' : value)); setVisible(INITIAL_VISIBLE); };
  const togglePlatform = (value) => { setPlatform((cur) => (cur === value ? '' : value)); setVisible(INITIAL_VISIBLE); };
  const clearFilters = () => { setRegion(''); setPlatform(''); setVisible(INITIAL_VISIBLE); };

  const open = (entry) => {
    if (kind === 'clubs') router.push({ pathname: '/apps/club/[id]', params: { id: String(entry.row.id) } });
    else router.push({ pathname: '/(tabs)/profile/profilescreen', params: { playerId: String(entry.row.id) } });
  };

  if (loading && !data) return <SkeletonList count={5} lines={1} />;
  if (error && !data) return <ErrorState message={error} onRetry={refetch} />;

  const emptyTitle = filtered
    ? t('stage.rankings.emptyFiltered')
    : kind === 'clubs' ? t('stage.rankings.emptyClubs') : t('stage.rankings.emptyPlayers');
  const youLabel = kind === 'clubs' ? t('stage.rankings.youClub') : t('stage.rankings.youPlayer');
  const nameLabel = kind === 'clubs' ? t('stage.rankings.colClub') : t('stage.rankings.colPlayer');

  return (
    <View style={{ gap: 14 }}>
      {error ? <ErrorState message={error} onRetry={refetch} /> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={t('stage.rankings.filters')}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        <Chip label={t('stage.rankings.clubs')} active={kind === 'clubs'} onPress={() => selectKind('clubs')} />
        <Chip label={t('stage.rankings.players')} active={kind === 'players'} onPress={() => selectKind('players')} />
        {fullAccess ? options.regions.map((value) => (
          <Chip key={`r-${value}`} label={value} active={region === value} onPress={() => toggleRegion(value)} />
        )) : null}
        {fullAccess ? options.platforms.map((value) => (
          <Chip key={`p-${value}`} label={value} active={platform === value} onPress={() => togglePlatform(value)} />
        )) : null}
      </ScrollView>

      {!fullAccess ? (
        <Card style={{ gap: 12 }}>
          <Text style={{ color: tokens.textSoft, fontSize: 13, lineHeight: 19 }}>{t('stage.rankings.plusNotice')}</Text>
          <Button
            title={t('stage.rankings.openStore')}
            variant="secondary"
            icon="storefront-outline"
            onPress={() => router.push('/apps/store')}
          />
        </Card>
      ) : null}

      {board.top.length === 0 ? (
        <EmptyState
          icon="podium-outline"
          title={emptyTitle}
          actionLabel={filtered ? t('stage.rankings.clearFilters') : undefined}
          onAction={filtered ? clearFilters : undefined}
        />
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }} testID="rankings-table">
          <HeaderRow nameLabel={nameLabel} showPoints={fullAccess} t={t} />
          {board.top.map((entry) => (
            <Row
              key={entry.row.id}
              kind={kind}
              entry={entry}
              mine={board.mine?.row.id === entry.row.id}
              showPoints={fullAccess}
              youLabel={youLabel}
              onPress={() => open(entry)}
            />
          ))}
          {board.hasMore ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('stage.rankings.showMore')}
              onPress={() => setVisible((v) => v + PAGE_STEP)}
              style={{ minHeight: TAP, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: tokens.border }}
            >
              <Text style={{ color: tokens.cyan, fontSize: 14, fontWeight: '700' }}>{t('stage.rankings.showMore')}</Text>
            </Pressable>
          ) : null}
          {board.mine?.pinned ? (
            <>
              <Text style={{ color: tokens.muted, textAlign: 'center', paddingVertical: 6 }}>…</Text>
              <Row
                kind={kind}
                entry={board.mine}
                mine
                showPoints={fullAccess}
                youLabel={youLabel}
                onPress={() => open(board.mine)}
              />
            </>
          ) : null}
        </Card>
      )}

      <Text style={{ color: tokens.muted, fontSize: 12, lineHeight: 18 }}>{t('stage.rankings.note')}</Text>
    </View>
  );
}
