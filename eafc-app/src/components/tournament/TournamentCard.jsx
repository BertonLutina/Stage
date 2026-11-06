import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import TournamentCountdown from './TournamentCountdown';
import useThemeStore from '@/store/themeStore';
import { Card } from '@/components/ui';
import { hexToRgba } from '@/lib/stageTheme';

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
    return { label: 'Live', live: true };
  }
  if (status === 'completed') {
    return { label: 'Done' };
  }
  return { label: String(status || 'Draft') };
}

function MetaItem({ tokens, label, value, strong }) {
  return (
    <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, flexShrink: 1 }}>
      {label}{' '}
      <Text style={{ color: strong ? tokens.cyanHi : tokens.text, fontWeight: '600' }}>{value}</Text>
    </Text>
  );
}

export default function TournamentCard({ tournament: t, trophyItems = [], onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
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

  const participants = t.participant_type === 'player' ? 'Players' : 'Clubs';
  const badgeLabel = isFull ? 'Full' : status.label;
  const badgeStrong = status.live && !isFull;

  const entryLabel = hasFee ? `${Number(t.entry_fee_stc).toLocaleString()} STC` : 'Free';
  const spokenLabel = `${t.name}, ${badgeLabel}, ${registered} of ${maxTeams} registered, entry ${entryLabel}`;

  return (
    <Card
      highlight={Boolean(status.live)}
      onPress={onPress}
      accessibilityLabel={spokenLabel}
      style={{ gap: 12 }}
    >
      {t.banner_url ? (
        <View style={{ height: 84, borderRadius: 12, overflow: 'hidden', backgroundColor: tokens.bgDeep }}>
          <Image source={{ uri: t.banner_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient
            colors={[hexToRgba(tokens.bgDeep, 0.1), hexToRgba(tokens.bgDeep, 0.7)]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View
          style={{
            height: 24,
            borderRadius: 999,
            borderWidth: 1,
            paddingHorizontal: 10,
            justifyContent: 'center',
            borderColor: badgeStrong ? tokens.cyan : tokens.border,
            backgroundColor: badgeStrong ? tokens.cyan : tokens.card,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: badgeStrong ? tokens.onCyan : tokens.textSoft,
            }}
          >
            {badgeLabel}
          </Text>
        </View>
        <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12 }}>
          {registered} / {maxTeams}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor: tokens.border,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {trophyUrl ? (
            <Image source={{ uri: trophyUrl }} style={{ width: 40, height: 40 }} resizeMode="contain" />
          ) : (
            <Ionicons name="trophy-outline" size={22} color={tokens.cyanHi} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 17, fontWeight: '700' }}>
            {t.name}
          </Text>
          <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>
            {typeLbl} · {participants}
          </Text>
          {t.creator_gamertag ? (
            <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 11, marginTop: 2 }}>
              By {t.creator_gamertag}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: maxTeams, now: Math.min(registered, maxTeams) }}
        style={{ height: 4, borderRadius: 2, backgroundColor: tokens.border, overflow: 'hidden' }}
      >
        <View style={{ height: '100%', width: `${fillPct}%`, backgroundColor: tokens.cyan }} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 }}>
        {dateLabel ? <MetaItem tokens={tokens} label="Starts" value={dateLabel} /> : null}
        {hasFee ? (
          <>
            <MetaItem tokens={tokens} label="Entry" value={entryLabel} />
            <MetaItem tokens={tokens} label="Prize" value={`${pool.toLocaleString()} STC`} strong />
          </>
        ) : (
          <MetaItem tokens={tokens} label="Entry" value={entryLabel} />
        )}
      </View>

      {showCountdown ? <TournamentCountdown startDate={startDate} compact /> : null}
    </Card>
  );
}
