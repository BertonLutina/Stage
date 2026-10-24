import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import { GAME_DAY_SILVER } from '@/components/dashboard/CommandCenterUI';

const CATEGORIES = {
  participants: [
    { id: 'goals', label: 'Most Goals Scored', value: 'goals' },
    { id: 'conceded', label: 'Most Goals Conceded', value: 'conceded' },
    { id: 'fewest_conceded', label: 'Fewest Goals Conceded', value: 'conceded' },
  ],
  players: [
    { id: 'goals', label: 'Top Scorers', value: 'goals' },
    { id: 'assists', label: 'Top Assists', value: 'assists' },
    { id: 'rating', label: 'Highest Average Rating', value: 'average_rating', rated: 'rated_matches' },
    { id: 'awards', label: 'Most Player of the Match Awards', value: 'awards' },
    { id: 'appearances', label: 'Most Appearances', value: 'appearances' },
  ],
  goalkeepers: [
    { id: 'clean_sheets', label: 'Most Clean Sheets', value: 'clean_sheets' },
    { id: 'conceded_per_match', label: 'Fewest Goals Conceded per Match', value: 'conceded_per_match' },
    { id: 'rating', label: 'Highest Average Goalkeeper Rating', value: 'goalkeeper_average_rating', rated: 'goalkeeper_rated_matches' },
  ],
};

function formatValue(row, category) {
  const value = row?.[category.value];
  if (value == null) return '—';
  if (category.rated || category.id === 'conceded_per_match') return Number(value).toFixed(2);
  return String(value);
}

export default function TournamentLeaderboard({
  tournamentId,
  statisticsUrl,
  title = 'Tournament Statistics',
}) {
  const [stats, setStats] = useState(null);
  const [group, setGroup] = useState('participants');
  const [categoryId, setCategoryId] = useState('goals');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!tournamentId && !statisticsUrl) return;
    try {
      setError('');
      const url = statisticsUrl || `/public/tournaments/${encodeURIComponent(tournamentId)}/statistics`;
      const data = await stageClient.http.get(url);
      setStats(data);
    } catch (err) {
      setError(err?.message || 'Could not load tournament statistics.');
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tournamentId, statisticsUrl]);

  useEffect(() => {
    setStats(null);
    setGroup('participants');
    setCategoryId('goals');
    setLoading(true);
    load();
  }, [load]);

  const effectiveGroup = stats?.participant_type === 'player' ? 'participants' : group;
  const categories = CATEGORIES[effectiveGroup] || CATEGORIES.participants;
  const category = categories.find((c) => c.id === categoryId) || categories[0];
  const rows = useMemo(
    () => stats?.[effectiveGroup]?.[category.id] || [],
    [stats, effectiveGroup, category.id],
  );
  const individual = effectiveGroup !== 'participants';
  const appearancesKey = effectiveGroup === 'goalkeepers' ? 'goalkeeper_appearances' : 'appearances';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="trophy-outline" size={18} color={GAME_DAY_SILVER} />
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); load(); }} hitSlop={8}>
          <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.55)" />
        </TouchableOpacity>
      </View>

      {stats?.participant_type !== 'player' ? (
        <View style={styles.groupRow}>
          {[
            ['participants', 'Clubs'],
            ['players', 'Players'],
            ['goalkeepers', 'Keepers'],
          ].map(([id, label]) => (
            <TouchableOpacity
              key={id}
              onPress={() => {
                setGroup(id);
                setCategoryId(CATEGORIES[id][0].id);
              }}
              style={[styles.chip, effectiveGroup === id && styles.chipActive]}
            >
              <Text style={[styles.chipText, effectiveGroup === id && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.select} onPress={() => setPickerOpen((v) => !v)}>
        <Text style={styles.selectText}>{category.label}</Text>
        <Ionicons name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={16} color={GAME_DAY_SILVER} />
      </TouchableOpacity>
      {pickerOpen ? (
        <View style={styles.picker}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.pickerRow}
              onPress={() => {
                setCategoryId(item.id);
                setPickerOpen(false);
              }}
            >
              <Text style={styles.pickerText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={GAME_DAY_SILVER} style={{ marginVertical: 24 }} />
      ) : (
        <ScrollView
          style={{ maxHeight: 420 }}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={GAME_DAY_SILVER}
            />
          )}
        >
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {stats?.confirmed_matches === 0 ? (
            <Text style={styles.empty}>No confirmed results yet.</Text>
          ) : null}
          {!rows.length && !error ? (
            <Text style={styles.empty}>
              {individual ? 'No player statistics recorded yet.' : 'No confirmed results yet.'}
            </Text>
          ) : rows.map((row, index) => (
            <View key={row.id || index} style={[styles.row, index % 2 === 1 && styles.alt]}>
              <Text style={styles.rank}>{row.rank ?? index + 1}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name} numberOfLines={1}>{row.name}</Text>
                {individual && row.club_name ? (
                  <Text style={styles.sub} numberOfLines={1}>{row.club_name}</Text>
                ) : null}
              </View>
              <Text style={styles.apps}>{row[appearancesKey] ?? 0}</Text>
              <Text style={styles.value}>{formatValue(row, category)}</Text>
            </View>
          ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: { flex: 1, color: '#fff', fontWeight: '900', fontSize: 15 },
  groupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipActive: {
    borderColor: 'rgba(0,240,255,0.45)',
    backgroundColor: 'rgba(0,240,255,0.10)',
  },
  chipText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800' },
  chipTextActive: { color: GAME_DAY_SILVER },
  select: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { color: '#fff', fontWeight: '700', flex: 1, paddingRight: 8, fontSize: 13 },
  picker: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pickerRow: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  pickerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  alt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  rank: { width: 28, color: 'rgba(255,255,255,0.45)', fontWeight: '900' },
  name: { color: '#fff', fontWeight: '800', fontSize: 13 },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  apps: { width: 28, textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontVariant: ['tabular-nums'] },
  value: { width: 52, textAlign: 'right', color: GAME_DAY_SILVER, fontWeight: '900', fontVariant: ['tabular-nums'] },
  empty: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingVertical: 28, fontSize: 13 },
  error: { color: '#FF6B8A', padding: 14, fontSize: 12 },
});
