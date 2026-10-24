import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { normalizeStandings } from '@/lib/standingsRows';

const COL = {
  rank: 28,
  played: 28,
  result: 28,
  goals: 32,
  gd: 34,
  pts: 36,
};

const STAT_WIDTH = COL.played + COL.result * 3 + COL.goals * 2 + COL.gd + COL.pts;

function Cell({ width, children, bold, accent, muted, align = 'center' }) {
  return (
    <Text
      numberOfLines={1}
      style={[
        styles.cell,
        { width, textAlign: align },
        bold && styles.bold,
        accent && styles.accent,
        muted && styles.muted,
      ]}
    >
      {children}
    </Text>
  );
}

function Header() {
  return (
    <View style={[styles.row, styles.headerRow]}>
      <Cell width={COL.rank} muted align="left">#</Cell>
      <Text style={[styles.teamHeader, styles.muted]} numberOfLines={1}>Team</Text>
      <View style={styles.stats}>
        <Cell width={COL.played} muted>P</Cell>
        <Cell width={COL.result} muted>W</Cell>
        <Cell width={COL.result} muted>D</Cell>
        <Cell width={COL.result} muted>L</Cell>
        <Cell width={COL.goals} muted>GF</Cell>
        <Cell width={COL.goals} muted>GA</Cell>
        <Cell width={COL.gd} muted>GD</Cell>
        <Cell width={COL.pts} muted bold accent>Pts</Cell>
      </View>
    </View>
  );
}

function Row({ row, index }) {
  const leader = index === 0;
  const gdLabel = row.goalDiff > 0 ? `+${row.goalDiff}` : String(row.goalDiff);
  return (
    <View style={[styles.row, index % 2 === 1 && styles.altRow]}>
      <Cell width={COL.rank} bold={leader} accent={leader} align="left">{index + 1}</Cell>
      <Text style={[styles.team, leader && styles.leaderName]} numberOfLines={1}>{row.name}</Text>
      <View style={styles.stats}>
        <Cell width={COL.played}>{row.played}</Cell>
        <Cell width={COL.result}>{row.wins}</Cell>
        <Cell width={COL.result} muted>{row.draws}</Cell>
        <Cell width={COL.result}>{row.losses}</Cell>
        <Cell width={COL.goals}>{row.goalsFor}</Cell>
        <Cell width={COL.goals}>{row.goalsAgainst}</Cell>
        <Cell width={COL.gd} muted={row.goalDiff === 0}>{gdLabel}</Cell>
        <Cell width={COL.pts} bold accent>{row.points}</Cell>
      </View>
    </View>
  );
}

/**
 * Shared standings layout for tournaments, groups, leagues and competitions.
 * Horizontally scrollable so columns never crush the team name on small phones.
 */
export default function StandingsTable({
  rows = [],
  title = null,
  emptyLabel = 'No standings yet',
  compact = false,
}) {
  const normalized = useMemo(() => normalizeStandings(rows), [rows]);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {title ? (
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      {!normalized.length ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
          <View style={styles.table}>
            <Header />
            {normalized.map((row, index) => (
              <Row key={row.id} row={row} index={index} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(8,14,28,0.92)',
    overflow: 'hidden',
  },
  cardCompact: {
    borderRadius: 10,
  },
  titleWrap: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  title: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  table: {
    minWidth: COL.rank + 120 + STAT_WIDTH + 24,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    minWidth: COL.rank + 120 + STAT_WIDTH + 24,
  },
  headerRow: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 9,
  },
  altRow: {
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  teamHeader: {
    flex: 1,
    minWidth: 110,
    fontSize: 11,
    fontWeight: '700',
    paddingRight: 8,
  },
  team: {
    flex: 1,
    minWidth: 110,
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    paddingRight: 8,
  },
  leaderName: {
    color: '#FFE08A',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: STAT_WIDTH,
  },
  cell: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  muted: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bold: {
    fontWeight: '900',
  },
  accent: {
    color: '#00F0FF',
  },
  empty: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingVertical: 28,
    fontSize: 13,
  },
});
