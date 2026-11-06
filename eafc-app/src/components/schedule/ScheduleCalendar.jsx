import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, Pressable, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import {
  buildCalendarDateMap,
  buildMonthGrid,
  toDateKey,
} from '@/lib/scheduleEvents';
import {
  CALENDAR_CATEGORIES,
  CALENDAR_SCOPES,
  calendarDay,
  calendarDate,
  calendarGrid,
  calendarRange,
  calendarTime,
  groupCalendarEvents,
  identicalKickoffs,
  shiftCalendarMonth,
} from '@/lib/scheduleCalendar';
import { penaltyOutcome } from '@/lib/penaltyOutcome';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { hexToRgba } from '@/lib/stageTheme';
import { Card, Chip, IconButton } from '@/components/ui';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TAP = 44;

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b);
}

function isToday(d) {
  return isSameDay(d, new Date());
}

function monthLabel(d) {
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase();
}

function dayHeading(d) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function fmtTime(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/**
 * League-tier colours come from Stage tokens so the calendar stays on-palette (labels stay in the lib).
 * Hue alone is not enough at 6-8px (supreme cyan, tournament aqua and friendly muted read alike),
 * so every tier also has its own marker SHAPE, see `categoryShape`.
 */
export const CATEGORY_TOKEN = {
  supreme: 'cyan',
  elite: 'warning',
  challenger: 'success',
  regional: 'danger',
  friendly: 'muted',
  tournament: 'aqua',
};

/** Marker shape per tier. Unknown tiers (e.g. GOST) are a hollow ring. */
export const CATEGORY_SHAPE = {
  supreme: 'large',
  elite: 'dot',
  challenger: 'dot',
  regional: 'dot',
  friendly: 'small',
  tournament: 'diamond',
};
export const UNKNOWN_SHAPE = 'ring';

/** Unknown tiers fall back to a token no tier uses. */
export const UNKNOWN_CATEGORY_TOKEN = 'borderStrong';

export function isKnownCategory(id) {
  return Object.prototype.hasOwnProperty.call(CATEGORY_TOKEN, id);
}

export function categoryColor(id, tokens) {
  return tokens[isKnownCategory(id) ? CATEGORY_TOKEN[id] : UNKNOWN_CATEGORY_TOKEN] || tokens.muted;
}

export function categoryShape(id) {
  return isKnownCategory(id) ? CATEGORY_SHAPE[id] : UNKNOWN_SHAPE;
}

function categoryMeta(event, tokens) {
  const known = CALENDAR_CATEGORIES[event.category];
  const color = categoryColor(event.category, tokens);
  return {
    label: known ? known.label : (event.category === 'gost' ? 'GOST' : 'Match'),
    color,
    background: hexToRgba(color, 0.12),
    shape: categoryShape(event.category),
  };
}

/** Style of the marker inside its (size + 4) box. `size` is the base dot size. */
export function markerStyle(shape, color, size = 8) {
  switch (shape) {
    case 'large':
      return { width: size + 3, height: size + 3, borderRadius: (size + 3) / 2, borderWidth: 0, backgroundColor: color };
    case 'small':
      return { width: size - 3, height: size - 3, borderRadius: (size - 3) / 2, borderWidth: 0, backgroundColor: color };
    case 'diamond': {
      const side = Math.round(size * 0.85);
      return { width: side, height: side, borderRadius: 1, borderWidth: 0, backgroundColor: color, transform: [{ rotate: '45deg' }] };
    }
    case 'ring':
      return { width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: color, backgroundColor: 'transparent' };
    default:
      return { width: size, height: size, borderRadius: size / 2, borderWidth: 0, backgroundColor: color };
  }
}

/** The one category marker used by day cells, event rows and the legend, so they cannot drift. */
export function CategoryDot({ color, shape = 'dot', size = 8 }) {
  const box = size + 4;
  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      <View style={markerStyle(shape, color, size)} />
    </View>
  );
}

/** 36px tinted tile that leads an event row. */
function IconBox({ color, background, children }) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: color,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

function rowStyle(tokens) {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: TAP,
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.border,
  };
}

const rowTitle = (tokens) => ({ color: tokens.text, fontSize: 15, fontWeight: '700' });
const rowMeta = (tokens) => ({ color: tokens.muted, fontSize: 12, marginTop: 2 });
const emptyStyle = (tokens) => ({ color: tokens.muted, textAlign: 'center', paddingVertical: 28, fontSize: 14 });

function LegacyDayEventRow({ event, onPress }) {
  const tokens = useThemeStore((st) => st.tokens);
  const warn = { color: hexToRgba(tokens.warning, 0.5), background: hexToRgba(tokens.warning, 0.12) };
  if (event.type === 'tournament_start') {
    const td = event.tournamentData || {};
    return (
      <View style={rowStyle(tokens)}>
        <IconBox color={warn.color} background={warn.background}>
          <Ionicons name="trophy-outline" size={20} color={tokens.warning} />
        </IconBox>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={rowTitle(tokens)} numberOfLines={1}>{td.name || event.competition}</Text>
          <Text style={rowMeta(tokens)}>Tournament start{fmtTime(event.date) ? ` · ${fmtTime(event.date)}` : ''}</Text>
        </View>
      </View>
    );
  }

  if (event.type === 'contract_end') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityRole="button" style={rowStyle(tokens)}>
        <IconBox color={warn.color} background={warn.background}>
          <Ionicons name="document-text-outline" size={20} color={tokens.warning} />
        </IconBox>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={rowTitle(tokens)} numberOfLines={1}>Contract End · {event.contractData?.contract_type || 'squad'}</Text>
          <Text style={rowMeta(tokens)}>Contract</Text>
        </View>
        <Text style={{ color: tokens.warning, fontSize: 11, fontWeight: '600' }}>END</Text>
      </TouchableOpacity>
    );
  }

  const resultColor = event.result?.outcome === 'W'
    ? tokens.success
    : event.result?.outcome === 'L'
      ? tokens.danger
      : event.result
        ? tokens.warning
        : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityRole="button" style={rowStyle(tokens)}>
      <IconBox color={hexToRgba(tokens.cyan, 0.5)} background={hexToRgba(tokens.cyan, 0.12)}>
        <Ionicons name="shield-outline" size={20} color={tokens.cyan} />
      </IconBox>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={rowTitle(tokens)} numberOfLines={1}>{event.opposition || 'TBD'}</Text>
        <Text style={rowMeta(tokens)} numberOfLines={1}>
          {[fmtTime(event.date), event.venue, event.competition].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {event.result ? (
        <Text style={{ color: resultColor, fontWeight: '700', fontSize: 14 }}>{event.result.display}</Text>
      ) : (
        <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', maxWidth: 80 }}>
          {event.status || '—'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function ApiDayEventRow({ event, timezone, conflict, onPress }) {
  const tokens = useThemeStore((st) => st.tokens);
  const category = categoryMeta(event, tokens);
  const pens = penaltyOutcome(event.match || event);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityRole="button" style={rowStyle(tokens)}>
      <IconBox color={category.color} background={category.background}>
        <CategoryDot color={category.color} shape={category.shape} />
      </IconBox>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={rowTitle(tokens)} numberOfLines={1}>
          {event.homeName || 'TBD'} v {event.awayName || 'TBD'}
        </Text>
        <Text style={rowMeta(tokens)} numberOfLines={2}>
          {[
            category.label,
            calendarTime(event.startsAt, timezone),
            event.score || null,
            conflict ? 'Kickoff conflict' : null,
          ].filter(Boolean).join(' · ')}
        </Text>
        {pens ? <Text style={{ color: tokens.cyan, fontSize: 12, marginTop: 2 }}>{pens}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
    </TouchableOpacity>
  );
}

function LegacyCalendar({ events, onOpenMatch }) {
  const tokens = useThemeStore((st) => st.tokens);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const dateMap = useMemo(() => buildCalendarDateMap(events), [events]);
  const days = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);
  const selectedKey = selectedDate ? toDateKey(selectedDate) : null;
  const selectedEvents = selectedKey ? (dateMap.get(selectedKey) || []) : [];

  const shiftMonth = (delta) => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
    setSelectedDate(null);
  };

  const openEvent = (ev) => {
    if (ev?.type === 'match' && ev.id) onOpenMatch?.(ev);
  };

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <CalendarChrome
          title={monthLabel(currentMonth)}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
        />
        <WeekHeaders />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {days.map((day) => {
            const key = toDateKey(day);
            const dayEvents = dateMap.get(key) || [];
            const inMonth = isSameMonth(day, currentMonth);
            const selected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);
            return (
              <DayCell
                key={key}
                dayNumber={day.getDate()}
                inMonth={inMonth}
                selected={selected}
                today={today}
                dots={dayEvents.slice(0, 3).map((ev) => (
                  ev.type === 'contract_end' ? tokens.warning : ev.type === 'tournament_start' ? tokens.success : tokens.cyan
                ))}
                onPress={() => setSelectedDate(day)}
              />
            );
          })}
        </View>
        <LegendRow items={[
          { color: tokens.cyan, label: 'Match' },
          { color: tokens.warning, label: 'Contract' },
          { color: tokens.success, label: 'Tournament' },
        ]}
        />
      </Card>
      <DaySheet
        visible={!!selectedDate}
        title={selectedDate ? dayHeading(selectedDate) : ''}
        onClose={() => setSelectedDate(null)}
      >
        {selectedEvents.length === 0 ? (
          <Text style={emptyStyle(tokens)}>No events on this day</Text>
        ) : (
          selectedEvents.map((ev) => (
            <LegacyDayEventRow key={ev.id} event={ev} onPress={() => openEvent(ev)} />
          ))
        )}
      </DaySheet>
    </View>
  );
}

function ApiCalendar({ tournamentId, timezone = 'Europe/Brussels', onOpenMatch }) {
  const tokens = useThemeStore((st) => st.tokens);
  const [month, setMonth] = useState(() => calendarDay(new Date(), timezone).slice(0, 7));
  const [selected, setSelected] = useState(() => calendarDay(new Date(), timezone));
  const [scope, setScope] = useState('general');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);

  const days = calendarGrid(month);
  const { from, to } = calendarRange(month);
  const requestKey = [from, to, scope, tournamentId || '', timezone].join('|');
  const current = response?.requestKey === requestKey ? response : null;
  const displayTimezone = current?.timezone || timezone;
  const events = current?.events || [];
  const dates = groupCalendarEvents(events, displayTimezone);
  const selectedEvents = dates.get(selected) || [];
  const conflicts = identicalKickoffs(selectedEvents);
  const today = calendarDay(new Date(), displayTimezone);
  const scopeLabel = CALENDAR_SCOPES.find((s) => s.id === scope)?.label;

  useEffect(() => {
    let alive = true;
    const version = ++sequence.current;
    setLoading(true);
    setError('');
    stageClient.http.get('/schedule/calendar', {
      from,
      to,
      scope,
      ...(tournamentId ? { tournament_id: tournamentId } : {}),
    })
      .then((data) => {
        if (alive && version === sequence.current) setResponse({ ...data, requestKey });
      })
      .catch((err) => {
        if (alive && version === sequence.current) {
          setError(err?.status === 404
            ? 'Calendar needs the updated Stage backend.'
            : 'Scheduled games could not be loaded.');
        }
      })
      .finally(() => {
        if (alive && version === sequence.current) setLoading(false);
      });
    return () => { alive = false; };
  }, [requestKey, revision, from, to, scope, tournamentId]);

  const navigateMonth = (amount) => {
    const next = shiftCalendarMonth(month, amount);
    setMonth(next);
    setSelected(`${next}-01`);
  };

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
        >
          {CALENDAR_SCOPES.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              active={scope === option.id}
              onPress={() => setScope(option.id)}
            />
          ))}
        </ScrollView>

        <CalendarChrome
          title={calendarDate(`${month}-01`, { month: 'long', year: 'numeric' }).toUpperCase()}
          onPrev={() => navigateMonth(-1)}
          onNext={() => navigateMonth(1)}
          onToday={() => { setMonth(today.slice(0, 7)); setSelected(today); }}
        />

        {error ? (
          <TouchableOpacity
            onPress={() => setRevision((r) => r + 1)}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10,
              minHeight: 44,
              padding: 12,
              borderWidth: 1,
              borderColor: hexToRgba(tokens.danger, 0.5),
              borderRadius: 12,
            }}
          >
            <Text style={{ color: tokens.danger, fontSize: 13, flex: 1 }}>{error}</Text>
            <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={{ color: tokens.muted, fontSize: 12, marginBottom: 10 }}>
          {loading && !current
            ? 'Loading scheduled games...'
            : loading
              ? 'Refreshing...'
              : `${events.length} games · ${scopeLabel}`}
        </Text>

        <WeekHeaders />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {days.map((day) => {
            const items = dates.get(day) || [];
            return (
              <DayCell
                key={day}
                dayNumber={Number(day.slice(8))}
                inMonth={day.slice(0, 7) === month}
                selected={day === selected}
                today={day === today}
                dots={items.slice(0, 3).map((ev) => {
                  const meta = categoryMeta(ev, tokens);
                  return { color: meta.color, shape: meta.shape };
                })}
                onPress={() => setSelected(day)}
              />
            );
          })}
        </View>
        <LegendRow
          items={[
            ...Object.entries(CALENDAR_CATEGORIES).map(([id, cat]) => ({
              color: categoryColor(id, tokens),
              shape: categoryShape(id),
              label: cat.label,
              key: id,
            })),
            { color: categoryColor(null, tokens), label: 'Other', key: 'other', shape: UNKNOWN_SHAPE },
          ]}
        />
      </Card>

      <DaySheet
        visible
        embedded
        title={calendarDate(selected, { weekday: 'long', day: 'numeric', month: 'long' })}
        onClose={null}
      >
        {loading && !current ? (
          <ActivityIndicator color={tokens.cyan} style={{ marginVertical: 24 }} />
        ) : selectedEvents.length === 0 ? (
          <Text style={emptyStyle(tokens)}>No confirmed games on this day</Text>
        ) : (
          selectedEvents.map((ev) => (
            <ApiDayEventRow
              key={ev.id}
              event={ev}
              timezone={displayTimezone}
              conflict={conflicts.has(ev.id)}
              onPress={() => onOpenMatch?.({
                id: ev.matchId || ev.id,
                type: 'match',
                matchData: ev.match || { id: ev.matchId || ev.id },
              })}
            />
          ))
        )}
      </DaySheet>
    </View>
  );
}

function CalendarChrome({ title, onPrev, onNext, onToday }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
      <IconButton icon="chevron-back" onPress={onPrev} accessibilityLabel="Previous month" />
      <Text
        numberOfLines={1}
        style={{
          color: tokens.text,
          fontFamily: FONT_EA_SPORTS,
          fontSize: 16,
          letterSpacing: 16 * 0.03,
          flex: 1,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      {onToday ? (
        <TouchableOpacity
          onPress={onToday}
          accessibilityRole="button"
          accessibilityLabel="Today"
          style={{
            height: TAP,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: tokens.border,
            backgroundColor: tokens.card,
            paddingHorizontal: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '600' }}>Today</Text>
        </TouchableOpacity>
      ) : null}
      <IconButton icon="chevron-forward" onPress={onNext} accessibilityLabel="Next month" />
    </View>
  );
}

function WeekHeaders() {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
      {DAY_NAMES.map((d) => (
        <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 6, minHeight: 28 }}>
          <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600' }}>
            {d[0]}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DayCell({ dayNumber, inMonth, selected, today, dots = [], onPress }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      style={{
        width: `${100 / 7}%`,
        minHeight: TAP,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 6,
        paddingBottom: 8,
        borderRadius: 12,
        backgroundColor: selected ? tokens.cardHi : 'transparent',
        borderWidth: selected ? 1 : 0,
        borderColor: tokens.aqua,
        opacity: inMonth ? 1 : 0.28,
      }}
    >
      <View style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: today && !selected ? tokens.cyan : 'transparent',
      }}
      >
        <Text style={{
          color: today && !selected ? tokens.onCyan : selected ? tokens.cyan : tokens.text,
          fontSize: 14,
          fontWeight: '700',
        }}
        >
          {dayNumber}
        </Text>
      </View>
      {dots.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: 3, marginTop: 4 }}>
          {dots.map((dot, index) => {
            const color = typeof dot === 'string' ? dot : dot.color;
            return (
              <CategoryDot key={`${color}-${index}`} color={color} shape={typeof dot === 'string' ? 'dot' : dot.shape} size={6} />
            );
          })}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function LegendRow({ items }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: tokens.border }}>
      {items.map((item) => (
        <View key={item.key || item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <CategoryDot color={item.color} shape={item.shape} />
          <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600' }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DaySheet({ visible, title, onClose, children, embedded = false }) {
  const tokens = useThemeStore((st) => st.tokens);
  if (embedded) {
    return (
      <Card>
        <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>{title}</Text>
        {children}
      </Card>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: tokens.overlay }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close day"
      />
      <View
        style={{
          backgroundColor: tokens.bgDeep,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderWidth: 1,
          borderColor: tokens.border,
          paddingBottom: 8,
        }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: tokens.border, marginTop: 10, marginBottom: 4 }} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: tokens.border,
            gap: 12,
          }}
        >
          <Text numberOfLines={1} style={{ flex: 1, color: tokens.text, fontWeight: '700', fontSize: 16 }}>{title}</Text>
          <IconButton icon="close" onPress={onClose} accessibilityLabel="Close" />
        </View>
        <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * API-backed calendar when `useApi` is true (Stage `/schedule/calendar`).
 * Falls back to client-side `events` for offline / legacy schedule screens.
 */
export default function ScheduleCalendar({
  events,
  onOpenMatch,
  useApi = true,
  tournamentId,
  timezone,
}) {
  if (useApi) {
    return (
      <ApiCalendar
        tournamentId={tournamentId}
        timezone={timezone}
        onOpenMatch={onOpenMatch}
      />
    );
  }
  return <LegacyCalendar events={events || []} onOpenMatch={onOpenMatch} />;
}
