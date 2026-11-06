import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { hexToRgba } from '@/lib/stageTheme';
import { Card } from '@/components/ui';
import GameDayCrest from './GameDayCrest';

function parseDate(d) {
  if (!d) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Status pill colours come from the Stage tokens: cyan scheduled, green live, amber pending, red problem, muted full time. */
function statusMeta(status, tokens) {
  const make = (label, color) => ({
    label,
    color,
    bg: hexToRgba(color, 0.14),
    border: hexToRgba(color, 0.4),
  });
  if (status === 'scheduled') return make('Scheduled', tokens.cyan);
  if (status === 'in_progress') return make('Live', tokens.success);
  if (status === 'awaiting_confirmation') return make('Pending', tokens.warning);
  if (status === 'disputed') return make('Disputed', tokens.danger);
  if (status === 'completed') return make('FT', tokens.muted);
  if (status === 'forfeit') return make('Forfeit', tokens.danger);
  return make(String(status || ''), tokens.muted);
}

function dateLabel(date, options) {
  return date ? date.toLocaleDateString(undefined, options) : null;
}

function timeLabel(date) {
  return date ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : null;
}

/** Score text for a finished or live fixture, or null when there is none to read. */
function scoreLabel(event) {
  const m = event.matchData || {};
  return m.home_score != null && m.away_score != null && event.status !== 'scheduled'
    ? `${m.home_score} - ${m.away_score}`
    : null;
}

/**
 * Pressable cards replace their text for screen readers with this label, so it has to carry
 * everything the card shows: who, when, status and the result when there is one.
 */
export function fixtureAccessibilityLabel({ title, parts = [] }) {
  return [title, ...parts].filter(Boolean).join(', ');
}

function StatusPill({ status }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        height: 26,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: status.border,
        backgroundColor: status.bg,
        justifyContent: 'center',
      }}
    >
      <Text numberOfLines={1} style={{ color: status.color, fontSize: 11, fontWeight: '600' }}>
        {status.label}
      </Text>
    </View>
  );
}

/** Compact fixture chip for the Game Day ticker — matches web GameDayCard */
export function GameDayFixtureChip({ event, selected, onPress, myClub }) {
  const tokens = useThemeStore((s) => s.tokens);
  const date = parseDate(event.date);
  const status = statusMeta(event.status, tokens);
  const live = event.status === 'in_progress';
  const homeLogo = myClub && event.matchData?.home_club_id === myClub.id ? myClub.logo_url : null;
  const awayLogo = myClub && event.matchData?.away_club_id === myClub.id ? myClub.logo_url : null;

  return (
    <Card
      highlight={Boolean(selected)}
      onPress={onPress}
      accessibilityLabel={fixtureAccessibilityLabel({
        title: `${event.homeName} versus ${event.awayName}`,
        parts: [
          dateLabel(date, { weekday: 'long', day: 'numeric', month: 'long' }),
          timeLabel(date),
          status.label,
          scoreLabel(event),
        ],
      })}
      style={{
        minWidth: 260,
        maxWidth: 320,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <GameDayCrest name={event.homeName} imageUrl={homeLogo} size="sm" />
        <View style={{ marginLeft: -10 }}>
          <GameDayCrest name={event.awayName} imageUrl={awayLogo} size="sm" />
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 14, fontWeight: '700' }}>
          {event.homeName} <Text style={{ color: tokens.cyan }}>vs</Text> {event.awayName}
        </Text>
        <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>
          {date
            ? `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · `
            : ''}
          {status.label}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4, maxWidth: 80 }}>
        {live || event.hasStream ? <Ionicons name="radio" size={14} color={tokens.cyanHi} /> : null}
        {event.isMyClub ? (
          <Text numberOfLines={1} style={{ color: tokens.cyan, fontSize: 11, fontWeight: '600' }}>
            Your Club
          </Text>
        ) : (
          <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 11 }}>
            {event.competition}
          </Text>
        )}
      </View>
    </Card>
  );
}

export function GameDayMatchCard({ event, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  const date = parseDate(event.date);
  const status = statusMeta(event.status, tokens);
  const m = event.matchData || {};
  const hasScore = m.home_score != null && m.away_score != null && event.status !== 'scheduled';
  const isLive = event.status === 'in_progress';

  return (
    <Card
      highlight={isLive}
      onPress={onPress}
      accessibilityLabel={fixtureAccessibilityLabel({
        title: `${event.homeName} versus ${event.awayName}`,
        parts: [
          dateLabel(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          timeLabel(date),
          event.competition,
          status.label,
          hasScore ? `${m.home_score} - ${m.away_score}` : null,
        ],
      })}
      style={{ gap: 10 }}
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {date ? (
            <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, fontWeight: '600' }}>
              {date.toLocaleDateString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {' '}
              · {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Ionicons name="shield-outline" size={20} color={tokens.cyan} />
            <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700', flex: 1 }} numberOfLines={2}>
              {event.homeName} vs {event.awayName}
            </Text>
          </View>
        </View>
        <StatusPill status={status} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <Ionicons name="trophy-outline" size={16} color={tokens.muted} />
          <Text style={{ color: tokens.muted, fontSize: 12, flex: 1 }} numberOfLines={1}>
            {event.competition}
          </Text>
        </View>
        {hasScore ? (
          <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '700' }}>
            {m.home_score} - {m.away_score}
          </Text>
        ) : null}
      </View>

      {(event.isMyClub || event.hasStream) && (
        <View
          style={{
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: tokens.border,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {event.isMyClub ? (
            <View
              style={{
                height: 26,
                paddingHorizontal: 10,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: hexToRgba(tokens.cyan, 0.4),
                backgroundColor: hexToRgba(tokens.cyan, 0.14),
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: tokens.cyan, fontSize: 11, fontWeight: '600' }}>Your Club</Text>
            </View>
          ) : null}
          {event.hasStream ? (
            <View
              style={{
                height: 26,
                paddingHorizontal: 10,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: hexToRgba(tokens.danger, 0.4),
                backgroundColor: hexToRgba(tokens.danger, 0.14),
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ionicons name="radio" size={12} color={tokens.danger} />
              <Text style={{ color: tokens.danger, fontSize: 11, fontWeight: '600' }}>Live Stream</Text>
            </View>
          ) : null}
        </View>
      )}
    </Card>
  );
}

/** Schedule-style row — Results / archive. One event card: date column, opposition, result or status. */
export function ScheduleMatchRow({ event, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  const date = parseDate(event.date);
  const status = statusMeta(event.status, tokens);
  const resultColor =
    event.result?.outcome === 'W'
      ? tokens.success
      : event.result?.outcome === 'L'
        ? tokens.danger
        : event.result
          ? tokens.warning
          : status.color;

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={fixtureAccessibilityLabel({
        title: `${event.opposition}`,
        parts: [
          event.competition,
          dateLabel(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          timeLabel(date),
          event.result ? `Result ${event.result.display}` : status.label,
        ],
      })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View style={{ width: 48, alignItems: 'center' }}>
        <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>
          {date ? date.toLocaleDateString(undefined, { month: 'short' }) : '—'}
        </Text>
        <Text style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 24, lineHeight: 26 }}>
          {date ? String(date.getDate()).padStart(2, '0') : '—'}
        </Text>
        <Text style={{ color: tokens.muted, fontSize: 11 }}>
          {date
            ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
            : '—'}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
          {event.opposition}
        </Text>
        <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {event.venue} · {event.competition}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end', minWidth: 56 }}>
        {event.result ? (
          <Text style={{ color: resultColor, fontSize: 14, fontWeight: '700' }}>{event.result.display}</Text>
        ) : (
          <StatusPill status={status} />
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
    </Card>
  );
}
