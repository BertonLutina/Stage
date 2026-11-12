import React from 'react';
import { View, Image, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import TournamentCountdown from './TournamentCountdown';
import useThemeStore from '@/store/themeStore';
import { Card } from '@/components/ui';

const TYPE_LABEL = {
  knockout: 'Knockout',
  league: 'League',
  group_stage: 'Groups + knockout',
  double_elimination: 'Double Elim',
  swiss: 'Swiss',
  swiss_ucl: 'Swiss UCL',
  group_knockout: 'Groups + knockout',
  single_elim: 'Knockout',
  double_elim: 'Double Elim',
  classic_league: 'League',
  league_playoffs: 'League + PO',
};

function statusMeta(status) {
  if (status === 'registration') {
    return { label: 'Registration open' };
  }
  if (status === 'in_progress' || status === 'active') {
    return { label: 'Live', live: true };
  }
  if (status === 'completed') {
    return { label: 'Finished' };
  }
  return { label: String(status || 'Draft').replace(/_/g, ' ') };
}

function MetaItem({ tokens, label, value, strong }) {
  return (
    <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, flexShrink: 1 }}>
      {label}{' '}
      <Text style={{ color: strong ? tokens.cyanHi : tokens.text, fontWeight: '700' }}>{value}</Text>
    </Text>
  );
}

export default function TournamentCard({ tournament: t, trophyItems = [], onPress, joined = false }) {
  const tokens = useThemeStore((s) => s.tokens);
  const registered = t.registered_clubs?.length || t.teams?.length || t.registered_count || 0;
  const maxTeams = Math.max(Number(t.max_teams) || 8, 1);
  const isFull = registered >= maxTeams;
  const typeKey = t.type || t.format;
  const typeLbl = TYPE_LABEL[typeKey] || String(typeKey || 'Tournament');
  const status = statusMeta(t.status);
  const trophyUrl =
    t.trophy_url || trophyItems.find((i) => String(i.id) === String(t.trophy_item_id))?.image_url;
  const hasFee = Number(t.entry_fee_stc || 0) > 0;
  const pool = Number(t.prize_pool_stc) > 0
    ? Number(t.prize_pool_stc)
    : Number(t.entry_fee_stc || 0) * maxTeams;
  const startDate = t.start_date;
  const showCountdown =
    t.status === 'registration' && startDate && new Date(startDate) > new Date();

  const dateLabel = startDate
    ? new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null;
  const nextLabel = t.next_match_label
    || (t.next_match_at && !Number.isNaN(new Date(t.next_match_at).getTime())
      ? new Date(t.next_match_at).toLocaleDateString('en-GB', { weekday: 'short' })
      : null);
  const stageLabel = t.current_stage || t.stage_label || t.my_group_name || null;
  const platform = t.platform ? String(t.platform) : null;
  const participants = t.participant_type === 'player' ? 'players' : 'clubs';

  const isJoined = joined || Boolean(t.is_registered || t.joined || t.my_registration);
  const badgeLabel = isJoined ? 'Registered' : (isFull ? 'Full' : (status.live ? 'Live' : status.label));
  // Keep accessibility vocabulary from prior cards (Open/Live/Full) for screen readers + tests.
  const a11yStatus = isFull ? 'Full' : (status.live ? 'Live' : (t.status === 'registration' ? 'Open' : status.label));
  const entryLabel = hasFee ? `${Number(t.entry_fee_stc).toLocaleString()} STC` : 'Free';
  const spokenLabel = `${t.name}, ${a11yStatus}, ${registered} of ${maxTeams} registered, entry ${entryLabel}`;

  const subtitle = [
    typeLbl,
    `${maxTeams} ${participants}`,
    platform,
  ].filter(Boolean).join(' · ');

  return (
    <Card
      highlight={Boolean(status.live) || isJoined}
      onPress={onPress}
      accessibilityLabel={spokenLabel}
      style={{ gap: 12 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View
          style={{
            height: 24,
            borderRadius: 999,
            borderWidth: 1,
            paddingHorizontal: 10,
            justifyContent: 'center',
            borderColor: isJoined || status.live ? tokens.cyan : tokens.border,
            backgroundColor: isJoined ? tokens.cyan : tokens.card,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: isJoined ? tokens.onCyan : tokens.textSoft,
            }}
          >
            {badgeLabel}
          </Text>
        </View>
        {status.live && !isJoined ? (
          <Text numberOfLines={1} style={{ color: tokens.cyan, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase' }}>
            Live
          </Text>
        ) : (
          <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12 }}>
            {registered} / {maxTeams}
          </Text>
        )}
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
            {subtitle}
          </Text>
          {t.creator_gamertag ? (
            <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 11, marginTop: 2 }}>
              By {t.creator_gamertag}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 }}>
        {stageLabel ? <MetaItem tokens={tokens} label="Stage" value={stageLabel} /> : null}
        {pool > 0 ? <MetaItem tokens={tokens} label="Prize" value={`${pool.toLocaleString()} STC`} strong /> : null}
        {nextLabel ? <MetaItem tokens={tokens} label="Next" value={nextLabel} /> : null}
        {!stageLabel && !nextLabel && dateLabel ? <MetaItem tokens={tokens} label="Starts" value={dateLabel} /> : null}
        {!pool ? <MetaItem tokens={tokens} label="Entry" value={entryLabel} /> : null}
      </View>

      {showCountdown ? <TournamentCountdown startDate={startDate} compact /> : null}
    </Card>
  );
}
