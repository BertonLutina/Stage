import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import TournamentCountdown from './TournamentCountdown';
import { GAME_DAY_SILVER, TILE_BORDER, TILE_FILL } from '@/components/dashboard/CommandCenterUI';
import { CARD_RADIUS } from '@/lib/stageTheme';

const TYPE_LABEL = {
  knockout: 'Knockout',
  league: 'League',
  group_stage: 'Groups',
  double_elimination: 'Double Elim',
  swiss: 'Swiss',
  swiss_ucl: 'Swiss UCL',
  group_knockout: 'Group + KO',
  single_elim: 'Single Elim',
  double_elim: 'Double Elim',
  classic_league: 'League',
  league_playoffs: 'League + PO',
};

function statusMeta(status) {
  if (status === 'registration') {
    return { label: 'Open' };
  }
  if (status === 'in_progress' || status === 'active') {
    return { label: 'Live' };
  }
  if (status === 'completed') {
    return { label: 'Done' };
  }
  return { label: String(status || 'Draft') };
}

export default function TournamentCard({ tournament: t, trophyItems = [], onPress }) {
  const registered = t.registered_clubs?.length || t.teams?.length || t.registered_count || 0;
  const maxTeams = Math.max(Number(t.max_teams) || 8, 1);
  const fillPct = Math.min(100, Math.round((registered / maxTeams) * 100));
  const isFull = registered >= maxTeams;
  const typeKey = t.type || t.format;
  const typeLbl = TYPE_LABEL[typeKey] || String(typeKey || 'Tournament').toUpperCase();
  const status = statusMeta(t.status);
  const trophyUrl =
    t.trophy_url || trophyItems.find((i) => String(i.id) === String(t.trophy_item_id))?.image_url;
  const hasFee = Number(t.entry_fee_stc || 0) > 0;
  const pool = Number(t.entry_fee_stc || 0) * maxTeams;
  const startDate = t.start_date;
  const showCountdown =
    t.status === 'registration' && startDate && new Date(startDate) > new Date();

  const dateLabel = startDate
    ? new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardClip}>
        <View style={[styles.banner, !t.banner_url && { backgroundColor: t.banner_color || '#0A1222' }]}>
          {t.banner_url ? (
            <Image source={{ uri: t.banner_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : null}
          <LinearGradient
            colors={['rgba(3,6,13,0.2)', 'rgba(3,6,13,0.85)']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{typeLbl}</Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{isFull ? 'Full' : status.label}</Text>
          </View>

          <Text style={styles.participantHint}>
            {t.participant_type === 'player' ? 'Players' : 'Clubs'}
          </Text>

          {trophyUrl ? (
            <Image source={{ uri: trophyUrl }} style={styles.trophy} resizeMode="contain" />
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {t.name}
          </Text>
          {t.creator_gamertag ? (
            <Text style={styles.creator} numberOfLines={1}>
              By {t.creator_gamertag}
            </Text>
          ) : null}

          <View style={styles.fillRow}>
            <Text style={styles.fillMeta}>
              {registered}/{maxTeams}
              {dateLabel ? ` · ${dateLabel}` : ''}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${fillPct}%` }]} />
          </View>

          <View style={styles.feeRow}>
            {hasFee ? (
              <>
                <Text style={styles.feeText}>Entry {Number(t.entry_fee_stc).toLocaleString()} STC</Text>
                <Text style={styles.prizeText}>Prize {pool.toLocaleString()} STC</Text>
              </>
            ) : (
              <Text style={styles.freeText}>FREE</Text>
            )}
          </View>

          {showCountdown ? <TournamentCountdown startDate={startDate} compact /> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardClip: {
    borderWidth: 1,
    borderColor: TILE_BORDER,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: TILE_FILL,
  },
  banner: {
    height: 100,
    position: 'relative',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: TILE_BORDER,
    backgroundColor: 'rgba(3,6,13,0.65)',
  },
  typeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: GAME_DAY_SILVER,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: TILE_BORDER,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: GAME_DAY_SILVER,
  },
  participantHint: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  trophy: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    width: 42,
    height: 42,
  },
  body: {
    padding: 14,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  creator: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  fillRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fillMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  progressTrack: {
    marginTop: 6,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GAME_DAY_SILVER,
  },
  feeRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '600',
  },
  prizeText: {
    color: GAME_DAY_SILVER,
    fontSize: 11,
    fontWeight: '800',
  },
  freeText: {
    color: GAME_DAY_SILVER,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
