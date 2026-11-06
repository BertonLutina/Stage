import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { Card } from '@/components/ui';
import { hexToRgba } from '@/lib/stageTheme';
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

function Cell({ styles, width, children, bold, accent, muted, align = 'center' }) {
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

function Header({ styles }) {
  return (
    <View style={[styles.row, styles.headerRow]}>
      <Cell styles={styles} width={COL.rank} muted align="left">#</Cell>
      <Text style={[styles.teamHeader, styles.muted]} numberOfLines={1}>Team</Text>
      <View style={styles.stats}>
        <Cell styles={styles} width={COL.played} muted>P</Cell>
        <Cell styles={styles} width={COL.result} muted>W</Cell>
        <Cell styles={styles} width={COL.result} muted>D</Cell>
        <Cell styles={styles} width={COL.result} muted>L</Cell>
        <Cell styles={styles} width={COL.goals} muted>GF</Cell>
        <Cell styles={styles} width={COL.goals} muted>GA</Cell>
        <Cell styles={styles} width={COL.gd} muted>GD</Cell>
        <Cell styles={styles} width={COL.pts} muted bold accent>Pts</Cell>
      </View>
    </View>
  );
}

function Row({ row, index, styles }) {
  const leader = index === 0;
  const gdLabel = row.goalDiff > 0 ? `+${row.goalDiff}` : String(row.goalDiff);
  return (
    <View style={[styles.row, index % 2 === 1 && styles.altRow]}>
      <Cell styles={styles} width={COL.rank} bold={leader} accent={leader} align="left">{index + 1}</Cell>
      <Text style={[styles.team, leader && styles.leaderName]} numberOfLines={1}>{row.name}</Text>
      <View style={styles.stats}>
        <Cell styles={styles} width={COL.played}>{row.played}</Cell>
        <Cell styles={styles} width={COL.result}>{row.wins}</Cell>
        <Cell styles={styles} width={COL.result} muted>{row.draws}</Cell>
        <Cell styles={styles} width={COL.result}>{row.losses}</Cell>
        <Cell styles={styles} width={COL.goals}>{row.goalsFor}</Cell>
        <Cell styles={styles} width={COL.goals}>{row.goalsAgainst}</Cell>
        <Cell styles={styles} width={COL.gd} muted={row.goalDiff === 0}>{gdLabel}</Cell>
        <Cell styles={styles} width={COL.pts} bold accent>{row.points}</Cell>
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
  const tokens = useThemeStore((st) => st.tokens);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const normalized = useMemo(() => normalizeStandings(rows), [rows]);

  return (
    <Card style={compact ? { padding: 0, overflow: 'hidden', borderRadius: 12 } : { padding: 0, overflow: 'hidden' }}>
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
            <Header styles={styles} />
            {normalized.map((row, index) => (
              <Row key={row.id} row={row} index={index} styles={styles} />
            ))}
          </View>
        </ScrollView>
      )}
    </Card>
  );
}

function makeStyles(tokens) {
  return StyleSheet.create({
    titleWrap: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      backgroundColor: hexToRgba(tokens.bgDeep, 0.5),
    },
    title: {
      color: tokens.muted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 11 * 0.12,
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
      borderBottomColor: tokens.border,
      minWidth: COL.rank + 120 + STAT_WIDTH + 24,
    },
    headerRow: {
      backgroundColor: hexToRgba(tokens.bgDeep, 0.5),
      paddingVertical: 9,
    },
    altRow: {
      backgroundColor: hexToRgba(tokens.bgDeep, 0.3),
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
      color: tokens.text,
      fontSize: 14,
      fontWeight: '600',
      paddingRight: 8,
    },
    leaderName: {
      color: tokens.cyanHi,
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      width: STAT_WIDTH,
    },
    cell: {
      color: tokens.textSoft,
      fontSize: 13,
      fontVariant: ['tabular-nums'],
    },
    muted: {
      color: tokens.muted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    bold: {
      fontWeight: '700',
    },
    accent: {
      color: tokens.cyan,
    },
    empty: {
      color: tokens.muted,
      textAlign: 'center',
      paddingVertical: 28,
      fontSize: 14,
    },
  });
}
