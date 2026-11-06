import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  buildTournamentStages,
  isStageResult,
  stageMatchSections,
  stageAggregate,
} from '@/lib/tournamentStages';
import { canOpenTournamentGameDay, tournamentGameDayPath } from '@/lib/tournamentGameDay';
import StandingsTable from '@/components/tournament/StandingsTable';
import { calculateLeagueStandings, calculateGroupStandings } from '@/lib/tournamentEngine';
import useThemeStore from '@/store/themeStore';
import { Card, SelectField } from '@/components/ui';
import { hexToRgba } from '@/lib/stageTheme';

function sideName(match, side, isPlayer) {
  if (isPlayer) return match[`${side}_player_name`] || match[`${side}_club_name`] || 'TBD';
  return match[`${side}_club_name`] || match[`${side}_player_name`] || 'TBD';
}

function scoreLabel(match) {
  if (isStageResult(match) && match.home_score != null && match.away_score != null) {
    return `${match.home_score} – ${match.away_score}`;
  }
  if (match.status === 'bye') return 'Bye';
  return 'vs';
}

function MatchRow({ match, stage, isPlayer, onOpen, styles }) {
  const aggregate = stageAggregate(stage, match);
  return (
    <TouchableOpacity onPress={() => onOpen?.(match)} style={styles.matchRow} activeOpacity={0.85}>
      <View style={styles.matchGrid}>
        <Text style={styles.side} numberOfLines={2}>{sideName(match, 'home', isPlayer)}</Text>
        <Text style={styles.score}>{scoreLabel(match)}</Text>
        <Text style={[styles.side, styles.sideAway]} numberOfLines={2}>{sideName(match, 'away', isPlayer)}</Text>
      </View>
      <View style={styles.metaRow}>
        {match.status === 'forfeit' ? <Text style={styles.meta}>Forfeit</Text> : null}
        {String(match.result_state || '').toLowerCase() === 'disputed' || match.status === 'disputed'
          ? <Text style={styles.metaWarn}>Disputed</Text> : null}
        {match.status === 'completed' && !isStageResult(match)
          ? <Text style={styles.meta}>Awaiting confirmation</Text> : null}
        {aggregate ? <Text style={styles.meta}>Agg {aggregate.join(' – ')}</Text> : null}
        {canOpenTournamentGameDay(match) ? <Text style={styles.metaLink}>Game Day</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function TournamentStages({
  tournament,
  matches = [],
  showStandings = true,
}) {
  const router = useRouter();
  const tokens = useThemeStore((st) => st.tokens);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const stages = useMemo(() => buildTournamentStages(tournament, matches), [tournament, matches]);
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [matchday, setMatchday] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const fullStage = stages.find((s) => s.id === selectedId)
    || stages.find((s) => s.matches.some((m) => !isStageResult(m)))
    || stages.find((s) => !s.matches.length)
    || stages[stages.length - 1];

  const matchdays = useMemo(() => {
    if (!fullStage || !['league', 'group'].includes(fullStage.id)) return [];
    return [...new Set(fullStage.matches.map((m) => Number(m.round || 1)))].sort((a, b) => a - b);
  }, [fullStage]);

  const activeDay = matchdays.includes(matchday) ? matchday : matchdays[0];
  const stage = fullStage && matchdays.length
    ? { ...fullStage, matches: fullStage.matches.filter((m) => Number(m.round || 1) === activeDay) }
    : fullStage;

  const isPlayer = tournament?.participant_type === 'player';
  const fixtures = (stage?.matches || []).filter((m) => !isStageResult(m) && !['cancelled', 'canceled'].includes(m.status));
  const results = (stage?.matches || []).filter(isStageResult);

  const standingsRows = useMemo(() => {
    if (!showStandings || !fullStage) return [];
    if (fullStage.id === 'league') {
      return calculateLeagueStandings(matches, { participant_type: isPlayer ? 'player' : 'club' });
    }
    if (fullStage.id === 'group') {
      const groups = calculateGroupStandings(
        matches,
        Math.max(1, Number(tournament?.num_groups) || 2),
        isPlayer ? 'player' : 'club',
      );
      return groups.flatMap((rows, index) => rows.map((row) => ({
        ...row,
        name: `${String.fromCharCode(65 + index)} · ${row.name}`,
      })));
    }
    return [];
  }, [fullStage, matches, tournament?.num_groups, isPlayer, showStandings]);

  const openMatch = (match) => {
    if (!match?.id) return;
    if (canOpenTournamentGameDay(match)) {
      router.push(tournamentGameDayPath(match.id));
      return;
    }
    router.push({ pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId: match.id } });
  };

  if (!stage) {
    return (
      <Card>
        <Text style={styles.empty}>No stages yet.</Text>
      </Card>
    );
  }

  const renderList = (rows, empty) => {
    if (!rows.length) return <Text style={styles.empty}>{empty}</Text>;
    return stageMatchSections(stage, rows).map((section) => (
      <View key={section.label} style={styles.section}>
        <Text style={styles.sectionLabel}>{section.label}</Text>
        {section.matches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            stage={stage}
            isPlayer={isPlayer}
            onOpen={openMatch}
            styles={styles}
          />
        ))}
      </View>
    ));
  };

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 10 }}>
        <SelectField label="Stage" value={stage.label} onPress={() => setPickerOpen(true)} />

        {matchdays.length > 1 ? (
          <View style={styles.dayNav}>
            <TouchableOpacity
              disabled={matchdays.indexOf(activeDay) <= 0}
              onPress={() => setMatchday(matchdays[matchdays.indexOf(activeDay) - 1])}
              accessibilityRole="button"
              accessibilityLabel="Previous matchday"
              style={[styles.dayBtn, matchdays.indexOf(activeDay) <= 0 && { opacity: 0.4 }]}
            >
              <Ionicons name="chevron-back" size={18} color={tokens.text} />
            </TouchableOpacity>
            <Text style={styles.dayLabel}>Matchday {activeDay}</Text>
            <TouchableOpacity
              disabled={matchdays.indexOf(activeDay) >= matchdays.length - 1}
              onPress={() => setMatchday(matchdays[matchdays.indexOf(activeDay) + 1])}
              accessibilityRole="button"
              accessibilityLabel="Next matchday"
              style={[styles.dayBtn, matchdays.indexOf(activeDay) >= matchdays.length - 1 && { opacity: 0.4 }]}
            >
              <Ionicons name="chevron-forward" size={18} color={tokens.text} />
            </TouchableOpacity>
          </View>
        ) : null}

        {tournament?.status === 'registration' && stage.matches.length > 0 ? (
          <Text style={styles.preview}>Draw preview — tournament has not started yet.</Text>
        ) : null}

        {stage.matches.length
          ? renderList(stage.matches, '')
          : (
            <Text style={styles.empty}>
              {stages[0]?.id === stage.id
                ? 'Draw not made yet.'
                : 'Awaiting qualification from the previous stage.'}
            </Text>
          )}

        {showStandings && ['group', 'league'].includes(fullStage.id) ? (
          <View style={{ marginTop: 12 }}>
            <StandingsTable
              title={fullStage.id === 'group' ? 'Group tables' : 'League table'}
              rows={standingsRows}
              compact
            />
          </View>
        ) : null}
      </Card>

      <View style={styles.tiles}>
        <Card
          style={{ flex: 1 }}
          onPress={() => setModal({ category: 'Fixtures', rows: fixtures })}
          accessibilityLabel={`Fixtures, ${fixtures.length}`}
        >
          <View style={styles.tileHead}>
            <Text style={styles.tileTitle}>Fixtures</Text>
            <Text style={styles.tileCount}>{fixtures.length}</Text>
          </View>
          <Text numberOfLines={1} style={styles.tileStage}>{stage.label}</Text>
        </Card>
        <Card
          style={{ flex: 1 }}
          onPress={() => setModal({ category: 'Results', rows: results })}
          accessibilityLabel={`Results, ${results.length}`}
        >
          <View style={styles.tileHead}>
            <Text style={styles.tileTitle}>Results</Text>
            <Text style={styles.tileCount}>{results.length}</Text>
          </View>
          <Text numberOfLines={1} style={styles.tileStage}>{stage.label}</Text>
        </Card>
      </View>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPickerOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select stage</Text>
            {stages.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.sheetRow, item.id === stage.id && styles.sheetRowActive]}
                onPress={() => {
                  setSelectedId(item.id);
                  setMatchday(null);
                  setPickerOpen(false);
                }}
              >
                <Text numberOfLines={1} style={styles.sheetRowText}>{item.label}</Text>
                <Text style={styles.sheetMeta}>{item.matches.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={Boolean(modal)} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, styles.sheetTall]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{modal?.category}</Text>
              <TouchableOpacity
                onPress={() => setModal(null)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={tokens.text} />
              </TouchableOpacity>
            </View>
            <Text numberOfLines={1} style={styles.tileStage}>{stage.label}</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {modal ? renderList(
                modal.rows,
                modal.category === 'Fixtures' ? 'No upcoming fixtures in this stage.' : 'No results yet.',
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(tokens) {
  return StyleSheet.create({
    dayNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    dayBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    dayLabel: { color: tokens.text, fontWeight: '600', fontSize: 14 },
    preview: {
      color: tokens.cyan,
      fontSize: 12,
      fontWeight: '600',
    },
    section: { marginTop: 4 },
    sectionLabel: {
      color: tokens.muted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 11 * 0.12,
      textTransform: 'uppercase',
      marginBottom: 4,
      marginTop: 8,
    },
    matchRow: {
      minHeight: 44,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    matchGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    side: { flex: 1, color: tokens.text, fontWeight: '600', fontSize: 14 },
    sideAway: { textAlign: 'right' },
    score: {
      minWidth: 48,
      textAlign: 'center',
      color: tokens.cyan,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, justifyContent: 'flex-end' },
    meta: { color: tokens.muted, fontSize: 12 },
    metaWarn: { color: tokens.warning, fontSize: 12, fontWeight: '600' },
    metaLink: { color: tokens.cyan, fontSize: 12, fontWeight: '600' },
    empty: {
      color: tokens.muted,
      textAlign: 'center',
      paddingVertical: 20,
      fontSize: 14,
    },
    tiles: { flexDirection: 'row', gap: 12 },
    tileHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tileTitle: { color: tokens.text, fontWeight: '700', fontSize: 15 },
    tileCount: { color: tokens.muted, fontSize: 13, fontWeight: '600' },
    tileStage: { color: tokens.cyan, fontSize: 12, fontWeight: '600', marginTop: 6 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: hexToRgba(tokens.bgDeep, 0.7),
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: tokens.bgDeep,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: tokens.border,
      padding: 16,
      gap: 8,
    },
    sheetTall: { maxHeight: '80%' },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sheetTitle: { color: tokens.text, fontWeight: '700', fontSize: 17 },
    closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    sheetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      minHeight: 48,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    sheetRowActive: { backgroundColor: tokens.card },
    sheetRowText: { flex: 1, color: tokens.text, fontWeight: '600', fontSize: 15 },
    sheetMeta: { color: tokens.muted, fontWeight: '600' },
  });
}
