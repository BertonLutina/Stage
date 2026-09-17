import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CYAN, AMBER } from '@/components/profile/gamer/GamerProfileUI';
import { FUT } from '@/components/dashboard/CommandCenterUI';
import LiveGlass from '@/components/theme/LiveGlass';
import useThemeStore from '@/store/themeStore';
import { CARD_RADIUS } from '@/lib/stageTheme';
import GameDayCrest from './GameDayCrest';
import { parseKickoffDate, formatKickoffClock } from '@/lib/momentDate';
import { DEFAULT_TIMEZONE, resolveUserTimezone } from '@/lib/timezones';
import useAuthStore from '@/store/authStore';

function sourceZone(event) {
  return event?.matchData?.timezone || event?.timezone || DEFAULT_TIMEZONE;
}

function KickoffStamp({ value, sourceTimeZone, style, dateStyle = 'short' }) {
  const viewerTimeZone = resolveUserTimezone(useAuthStore((s) => s.user));
  const date = parseKickoffDate(value, sourceTimeZone);
  if (!date) return null;
  const clock = formatKickoffClock(value, { sourceTimeZone, displayTimeZone: viewerTimeZone });
  if (dateStyle === 'clock') {
    return <Text style={style}>{clock}</Text>;
  }
  const day = date.toLocaleDateString('en-GB', {
    timeZone: viewerTimeZone,
    weekday: 'short',
    day: dateStyle === 'long' ? 'numeric' : undefined,
    month: dateStyle === 'long' ? 'short' : undefined,
    year: dateStyle === 'long' ? 'numeric' : undefined,
  });
  return (
    <Text style={style}>
      {dateStyle === 'long' ? `${day} · ${clock}` : `${day} ${clock}`}
    </Text>
  );
}

function statusMeta(status) {
  if (status === 'scheduled') return { label: 'Scheduled', bg: 'rgba(0,232,255,0.14)', color: FUT.cyan, border: 'rgba(0,232,255,0.35)' };
  if (status === 'in_progress') return { label: 'Live', bg: 'rgba(124,255,107,0.14)', color: FUT.lime, border: 'rgba(124,255,107,0.4)' };
  if (status === 'awaiting_confirmation') return { label: 'Pending', bg: 'rgba(255,210,74,0.14)', color: FUT.gold, border: 'rgba(255,210,74,0.35)' };
  if (status === 'disputed') return { label: 'Disputed', bg: 'rgba(255,77,109,0.14)', color: FUT.rose, border: 'rgba(255,77,109,0.35)' };
  if (status === 'completed') return { label: 'FT', bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.14)' };
  if (status === 'forfeit') return { label: 'Forfeit', bg: 'rgba(255,77,109,0.14)', color: FUT.rose, border: 'rgba(255,77,109,0.35)' };
  return { label: String(status || ''), bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.14)' };
}

/** Compact fixture chip for the Game Day ticker — matches web GameDayCard */
export function GameDayFixtureChip({ event, selected, onPress, myClub }) {
  const status = statusMeta(event.status);
  const live = event.status === 'in_progress';
  const homeLogo = myClub && event.matchData?.home_club_id === myClub.id ? myClub.logo_url : null;
  const awayLogo = myClub && event.matchData?.away_club_id === myClub.id ? myClub.logo_url : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={{
        minWidth: 246,
        maxWidth: 320,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: selected ? '#F8FBFF' : 'rgba(255,255,255,0.12)',
        backgroundColor: selected ? 'rgba(255,255,255,0.14)' : 'rgba(21,27,37,0.76)',
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <GameDayCrest name={event.homeName} imageUrl={homeLogo} size="sm" />
        <View style={{ marginLeft: -10 }}>
          <GameDayCrest name={event.awayName} imageUrl={awayLogo} size="sm" />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>
          {event.homeName} <Text style={{ color: '#F8FBFF' }}>vs</Text> {event.awayName}
        </Text>
        <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {event.date ? (
            <>
              <KickoffStamp value={event.date} sourceTimeZone={sourceZone(event)} />
              {' · '}
            </>
          ) : null}
          {status.label}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        {live || event.hasStream ? <Ionicons name="radio" size={12} color="#8EEEFF" /> : null}
        {event.isMyClub ? (
          <Text style={{ color: '#F8FBFF', fontSize: 8, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Your Club
          </Text>
        ) : (
          <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', maxWidth: 72 }}>
            {event.competition}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
export function GameDayMatchCard({ event, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  const status = statusMeta(event.status);
  const m = event.matchData || {};
  const hasScore = m.home_score != null && m.away_score != null && event.status !== 'scheduled';
  const isLive = event.status === 'in_progress';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.gameCardShadow}>
      <LiveGlass intensity={36} style={styles.gameCardClip}>
      <LinearGradient
        colors={tokens.live
          ? (isLive ? ['rgba(124,255,107,0.16)', 'rgba(10,18,32,0.52)'] : ['rgba(0,232,255,0.12)', 'rgba(10,18,32,0.52)'])
          : (isLive
            ? ['rgba(124,255,107,0.16)', 'rgba(6,12,22,0.95)']
            : ['rgba(0,232,255,0.12)', 'rgba(6,12,22,0.95)'])}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gameInner}
      >
        <View style={styles.gameTop}>
          <View style={{ flex: 1 }}>
            {event.date ? (
              <KickoffStamp
                value={event.date}
                sourceTimeZone={sourceZone(event)}
                dateStyle="long"
                style={styles.dateLine}
              />
            ) : null}
            <View style={styles.matchupRow}>
              <Ionicons name="shield-outline" size={16} color={CYAN} />
              <Text style={styles.matchup} numberOfLines={2}>
                {event.homeName} vs {event.awayName}
              </Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: status.bg, borderColor: status.border }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.gameFooter}>
          <View style={styles.compRow}>
            <Ionicons name="trophy-outline" size={12} color="rgba(255,255,255,0.45)" />
            <Text style={styles.compText} numberOfLines={1}>
              {event.competition}
            </Text>
          </View>
          {hasScore ? (
            <Text style={styles.score}>
              {m.home_score} - {m.away_score}
            </Text>
          ) : null}
        </View>

        {(event.isMyClub || event.hasStream) && (
          <View style={styles.chips}>
            {event.isMyClub ? (
              <View style={styles.chipPrimary}>
                <Text style={styles.chipPrimaryText}>Your Club</Text>
              </View>
            ) : null}
            {event.hasStream ? (
              <View style={styles.chipLive}>
                <Ionicons name="radio" size={10} color={FUT.rose} />
                <Text style={styles.chipLiveText}>Live Stream</Text>
              </View>
            ) : null}
          </View>
        )}
      </LinearGradient>
      </LiveGlass>
    </TouchableOpacity>
  );
}

/** Schedule-style row — Results / archive */
export function ScheduleMatchRow({ event, onPress }) {
  const viewerTimeZone = resolveUserTimezone(useAuthStore((s) => s.user));
  const date = parseKickoffDate(event.date, sourceZone(event));
  const status = statusMeta(event.status);
  const resultColor =
    event.result?.outcome === 'W'
      ? FUT.lime
      : event.result?.outcome === 'L'
        ? FUT.rose
        : event.result
          ? AMBER
          : status.color;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.scheduleRow}>
      <View style={styles.dateBlock}>
        <Text style={styles.month}>
          {date ? date.toLocaleDateString('en-GB', { timeZone: viewerTimeZone, month: 'short' }).toUpperCase() : '—'}
        </Text>
        <Text style={styles.day}>{date ? String(date.toLocaleDateString('en-GB', { timeZone: viewerTimeZone, day: '2-digit' })).padStart(2, '0') : '—'}</Text>
        <Text style={styles.time}>
          {date
            ? formatKickoffClock(event.date, { sourceTimeZone: sourceZone(event), displayTimeZone: viewerTimeZone })
            : '—'}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.opposition} numberOfLines={1}>
          {event.opposition}
        </Text>
        <Text style={styles.metaLine} numberOfLines={1}>
          {event.venue} · {event.competition}
        </Text>
      </View>

      <View style={styles.resultCol}>
        {event.result ? (
          <Text style={[styles.resultText, { color: resultColor }]}>{event.result.display}</Text>
        ) : (
          <View style={[styles.badge, { backgroundColor: status.bg, borderColor: status.border }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gameCardShadow: {
    borderRadius: CARD_RADIUS,
    shadowColor: FUT.cyan,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  gameCardClip: {
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(0,232,255,0.28)',
  },
  gameInner: {
    padding: 14,
  },
  gameTop: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dateLine: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  matchupRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  matchup: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', flex: 1 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  gameFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  compRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  compText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, flex: 1 },
  score: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  chips: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipPrimary: {
    backgroundColor: 'rgba(0,240,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  chipPrimaryText: { color: CYAN, fontSize: 10, fontWeight: '700' },
  chipLive: {
    backgroundColor: 'rgba(255,77,109,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipLiveText: { color: FUT.rose, fontSize: 10, fontWeight: '700' },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dateBlock: { width: 48, alignItems: 'center' },
  month: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' },
  day: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', lineHeight: 22 },
  time: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  opposition: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  metaLine: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  resultCol: { alignItems: 'flex-end', minWidth: 56 },
  resultText: { fontSize: 12, fontWeight: '900' },
});
