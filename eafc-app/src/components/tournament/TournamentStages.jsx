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
import { GAME_DAY_SILVER } from '@/components/dashboard/CommandCenterUI';

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

function MatchRow({ match, stage, isPlayer, onOpen }) {
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
      <View style={styles.card}>
        <Text style={styles.empty}>No stages yet.</Text>
      </View>
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
          />
        ))}
      </View>
    ));
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Stage</Text>
        <TouchableOpacity style={styles.select} onPress={() => setPickerOpen(true)}>
          <Text style={styles.selectText}>{stage.label}</Text>
          <Ionicons name="chevron-down" size={16} color={GAME_DAY_SILVER} />
        </TouchableOpacity>

        {matchdays.length > 1 ? (
          <View style={styles.dayNav}>
            <TouchableOpacity
              disabled={matchdays.indexOf(activeDay) <= 0}
              onPress={() => setMatchday(matchdays[matchdays.indexOf(activeDay) - 1])}
              style={styles.dayBtn}
            >
              <Ionicons name="chevron-back" size={16} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.dayLabel}>Matchday {activeDay}</Text>
            <TouchableOpacity
              disabled={matchdays.indexOf(activeDay) >= matchdays.length - 1}
              onPress={() => setMatchday(matchdays[matchdays.indexOf(activeDay) + 1])}
              style={styles.dayBtn}
            >
              <Ionicons name="chevron-forward" size={16} color="#fff" />
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
      </View>

      <View style={styles.tiles}>
        <TouchableOpacity
          style={styles.tile}
          onPress={() => setModal({ category: 'Fixtures', rows: fixtures })}
        >
          <View style={styles.tileHead}>
            <Text style={styles.tileTitle}>Fixtures</Text>
            <Text style={styles.tileCount}>{fixtures.length}</Text>
          </View>
          <Text style={styles.tileStage}>{stage.label}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tile}
          onPress={() => setModal({ category: 'Results', rows: results })}
        >
          <View style={styles.tileHead}>
            <Text style={styles.tileTitle}>Results</Text>
            <Text style={styles.tileCount}>{results.length}</Text>
          </View>
          <Text style={styles.tileStage}>{stage.label}</Text>
        </TouchableOpacity>
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
                <Text style={styles.sheetRowText}>{item.label}</Text>
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
              <TouchableOpacity onPress={() => setModal(null)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.tileStage}>{stage.label}</Text>
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

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(8,14,28,0.92)',
    padding: 12,
    gap: 10,
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectText: { color: '#fff', fontWeight: '800', flex: 1, paddingRight: 8 },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
  },
  dayBtn: { padding: 8 },
  dayLabel: { color: '#fff', fontWeight: '800' },
  preview: {
    color: GAME_DAY_SILVER,
    fontSize: 12,
    fontWeight: '700',
  },
  section: { marginTop: 4 },
  sectionLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 8,
  },
  matchRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  matchGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  side: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 13 },
  sideAway: { textAlign: 'right' },
  score: {
    minWidth: 48,
    textAlign: 'center',
    color: GAME_DAY_SILVER,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, justifyContent: 'flex-end' },
  meta: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  metaWarn: { color: '#F5C542', fontSize: 11, fontWeight: '700' },
  metaLink: { color: GAME_DAY_SILVER, fontSize: 11, fontWeight: '800' },
  empty: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 13,
  },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(8,14,28,0.92)',
    padding: 12,
  },
  tileHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileTitle: { color: '#fff', fontWeight: '900', fontSize: 15 },
  tileCount: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '800' },
  tileStage: { color: GAME_DAY_SILVER, fontSize: 11, fontWeight: '700', marginTop: 6 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0A1220',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    gap: 8,
  },
  sheetTall: { maxHeight: '80%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  sheetRowActive: { backgroundColor: 'rgba(0,240,255,0.08)' },
  sheetRowText: { color: '#fff', fontWeight: '700' },
  sheetMeta: { color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
});
