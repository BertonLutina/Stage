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
import useThemeStore from '@/store/themeStore';
import { Card, Chip, SelectField } from '@/components/ui';
import { hexToRgba } from '@/lib/stageTheme';

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
  const tokens = useThemeStore((st) => st.tokens);
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
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
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <View style={styles.header}>
        <Ionicons name="trophy-outline" size={22} color={tokens.cyan} />
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <TouchableOpacity
          onPress={() => { setRefreshing(true); load(); }}
          accessibilityRole="button"
          accessibilityLabel="Refresh statistics"
          style={styles.refreshBtn}
        >
          <Ionicons name="refresh" size={20} color={tokens.muted} />
        </TouchableOpacity>
      </View>

      {stats?.participant_type !== 'player' ? (
        <View style={styles.groupRow}>
          {[
            ['participants', 'Clubs'],
            ['players', 'Players'],
            ['goalkeepers', 'Keepers'],
          ].map(([id, label]) => (
            <Chip
              key={id}
              label={label}
              active={effectiveGroup === id}
              onPress={() => {
                setGroup(id);
                setCategoryId(CATEGORIES[id][0].id);
              }}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.selectWrap}>
        <SelectField
          label="Category"
          value={category.label}
          open={pickerOpen}
          onPress={() => setPickerOpen((v) => !v)}
        />
      </View>
      {pickerOpen ? (
        <View style={styles.picker}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.pickerRow}
              accessibilityRole="button"
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
        <ActivityIndicator color={tokens.cyan} style={{ marginVertical: 24 }} />
      ) : (
        <ScrollView
          style={{ maxHeight: 420 }}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={tokens.cyan}
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
    </Card>
  );
}

function makeStyles(tokens) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingLeft: 16,
      paddingRight: 4,
      minHeight: 52,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    title: { flex: 1, color: tokens.text, fontWeight: '700', fontSize: 16 },
    refreshBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    groupRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    selectWrap: { marginHorizontal: 16, marginTop: 12, marginBottom: 8 },
    picker: {
      marginHorizontal: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: tokens.bgDeep,
    },
    pickerRow: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    pickerText: { color: tokens.text, fontSize: 14, fontWeight: '600' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 11,
      gap: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
    },
    alt: { backgroundColor: hexToRgba(tokens.bgDeep, 0.4) },
    rank: { width: 28, color: tokens.muted, fontWeight: '700' },
    name: { color: tokens.text, fontWeight: '600', fontSize: 14 },
    sub: { color: tokens.muted, fontSize: 12, marginTop: 2 },
    apps: { width: 28, textAlign: 'center', color: tokens.muted, fontVariant: ['tabular-nums'] },
    value: { width: 52, textAlign: 'right', color: tokens.cyan, fontWeight: '700', fontVariant: ['tabular-nums'] },
    empty: { color: tokens.muted, textAlign: 'center', paddingVertical: 28, fontSize: 14 },
    error: { color: tokens.danger, padding: 16, fontSize: 13 },
  });
}
