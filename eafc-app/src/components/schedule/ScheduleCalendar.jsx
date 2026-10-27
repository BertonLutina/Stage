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
import { CYAN, AMBER } from '@/components/profile/gamer/GamerProfileUI';
import { FUT, SectionCard } from '@/components/dashboard/CommandCenterUI';
import { headingStyleSm } from '@/lib/fonts';

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

function categoryMeta(event) {
  return CALENDAR_CATEGORIES[event.category] || {
    label: event.category === 'gost' ? 'GOST' : 'Match',
    color: '#94a3b8',
    background: 'rgba(148,163,184,0.12)',
  };
}

function LegacyDayEventRow({ event, onPress }) {
  if (event.type === 'tournament_start') {
    const td = event.tournamentData || {};
    return (
      <View style={styles.row}>
        <View style={[styles.iconBox, { borderColor: 'rgba(255,210,74,0.35)', backgroundColor: 'rgba(255,210,74,0.1)' }]}>
          <Ionicons name="trophy" size={16} color={AMBER} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{td.name || event.competition}</Text>
          <Text style={styles.rowMeta}>Tournament start{fmtTime(event.date) ? ` · ${fmtTime(event.date)}` : ''}</Text>
        </View>
      </View>
    );
  }

  if (event.type === 'contract_end') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.row}>
        <View style={[styles.iconBox, { borderColor: 'rgba(255,210,74,0.35)', backgroundColor: 'rgba(255,210,74,0.1)' }]}>
          <Ionicons name="document-text" size={16} color={AMBER} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Contract End · {event.contractData?.contract_type || 'squad'}</Text>
          <Text style={styles.rowMeta}>Contract</Text>
        </View>
        <Text style={{ color: AMBER, fontSize: 10, fontWeight: '800' }}>END</Text>
      </TouchableOpacity>
    );
  }

  const resultColor = event.result?.outcome === 'W'
    ? FUT.lime
    : event.result?.outcome === 'L'
      ? FUT.rose
      : event.result
        ? AMBER
        : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.row}>
      <View style={[styles.iconBox, { borderColor: 'rgba(0,232,255,0.35)', backgroundColor: 'rgba(0,232,255,0.1)' }]}>
        <Ionicons name="shield" size={16} color={CYAN} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{event.opposition || 'TBD'}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {[fmtTime(event.date), event.venue, event.competition].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {event.result ? (
        <Text style={{ color: resultColor, fontWeight: '900', fontSize: 13 }}>{event.result.display}</Text>
      ) : (
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
          {event.status || '—'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function ApiDayEventRow({ event, timezone, conflict, onPress }) {
  const category = categoryMeta(event);
  const pens = penaltyOutcome(event.match || event);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.row}>
      <View style={[styles.iconBox, { borderColor: category.color, backgroundColor: category.background }]}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: category.color }} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {event.homeName || 'TBD'} v {event.awayName || 'TBD'}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={2}>
          {[
            category.label,
            calendarTime(event.startsAt, timezone),
            event.score || null,
            conflict ? 'Kickoff conflict' : null,
          ].filter(Boolean).join(' · ')}
        </Text>
        {pens ? <Text style={{ color: CYAN, fontSize: 11, marginTop: 2 }}>{pens}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
    </TouchableOpacity>
  );
}

function LegacyCalendar({ events, onOpenMatch }) {
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
      <SectionCard>
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
                  ev.type === 'contract_end' ? AMBER : ev.type === 'tournament_start' ? '#A78BFA' : CYAN
                ))}
                onPress={() => setSelectedDate(day)}
              />
            );
          })}
        </View>
        <LegendRow items={[
          { color: CYAN, label: 'Match' },
          { color: AMBER, label: 'Contract' },
          { color: '#A78BFA', label: 'Tournament' },
        ]}
        />
      </SectionCard>
      <DaySheet
        visible={!!selectedDate}
        title={selectedDate ? dayHeading(selectedDate) : ''}
        onClose={() => setSelectedDate(null)}
      >
        {selectedEvents.length === 0 ? (
          <Text style={styles.empty}>No events on this day</Text>
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
      <SectionCard>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
        >
          {CALENDAR_SCOPES.map((option) => {
            const active = scope === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => setScope(option.id)}
                style={[styles.scopePill, active && styles.scopePillActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.scopeText, active && { color: CYAN }]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <CalendarChrome
          title={calendarDate(`${month}-01`, { month: 'long', year: 'numeric' }).toUpperCase()}
          onPrev={() => navigateMonth(-1)}
          onNext={() => navigateMonth(1)}
          onToday={() => { setMonth(today.slice(0, 7)); setSelected(today); }}
        />

        {error ? (
          <TouchableOpacity onPress={() => setRevision((r) => r + 1)} style={styles.alert}>
            <Text style={{ color: FUT.rose, fontSize: 12, flex: 1 }}>{error}</Text>
            <Text style={{ color: CYAN, fontSize: 12, fontWeight: '800' }}>Retry</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.status}>
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
                dots={items.slice(0, 3).map((ev) => categoryMeta(ev).color)}
                onPress={() => setSelected(day)}
              />
            );
          })}
        </View>
        <LegendRow
          items={Object.entries(CALENDAR_CATEGORIES).map(([id, cat]) => ({
            color: cat.color,
            label: cat.label,
            key: id,
          }))}
        />
      </SectionCard>

      <DaySheet
        visible
        embedded
        title={calendarDate(selected, { weekday: 'long', day: 'numeric', month: 'long' })}
        onClose={null}
      >
        {loading && !current ? (
          <ActivityIndicator color={CYAN} style={{ marginVertical: 24 }} />
        ) : selectedEvents.length === 0 ? (
          <Text style={styles.empty}>No confirmed games on this day</Text>
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
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
      <TouchableOpacity onPress={onPrev} accessibilityLabel="Previous month" style={styles.navBtn}>
        <Ionicons name="chevron-back" size={18} color={CYAN} />
      </TouchableOpacity>
      <Text style={[headingStyleSm, { color: '#fff', fontSize: 14, letterSpacing: 2, flex: 1, textAlign: 'center' }]}>
        {title}
      </Text>
      {onToday ? (
        <TouchableOpacity onPress={onToday} style={[styles.navBtn, { width: 'auto', paddingHorizontal: 12 }]}>
          <Text style={{ color: CYAN, fontSize: 11, fontWeight: '800' }}>Today</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity onPress={onNext} accessibilityLabel="Next month" style={styles.navBtn}>
        <Ionicons name="chevron-forward" size={18} color={CYAN} />
      </TouchableOpacity>
    </View>
  );
}

function WeekHeaders() {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
      {DAY_NAMES.map((d) => (
        <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 6, minHeight: 28 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
            {d[0]}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DayCell({ dayNumber, inMonth, selected, today, dots = [], onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: `${100 / 7}%`,
        minHeight: TAP,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 6,
        paddingBottom: 8,
        borderRadius: 10,
        backgroundColor: selected ? 'rgba(0,232,255,0.16)' : 'transparent',
        borderWidth: selected ? 1 : 0,
        borderColor: 'rgba(0,232,255,0.4)',
        opacity: inMonth ? 1 : 0.28,
      }}
    >
      <View style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: today && !selected ? CYAN : 'transparent',
      }}
      >
        <Text style={{
          color: today && !selected ? '#031018' : selected ? CYAN : '#fff',
          fontSize: 13,
          fontWeight: '800',
        }}
        >
          {dayNumber}
        </Text>
      </View>
      {dots.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: 3, marginTop: 4 }}>
          {dots.map((color, index) => (
            <View key={`${color}-${index}`} style={[styles.dot, { backgroundColor: color }]} />
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function LegendRow({ items }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
      {items.map((item) => (
        <View key={item.key || item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.dot, { backgroundColor: item.color, width: 8, height: 8 }]} />
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DaySheet({ visible, title, onClose, children, embedded = false }) {
  if (embedded) {
    return (
      <SectionCard>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, marginBottom: 8 }}>{title}</Text>
        {children}
      </SectionCard>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={{ minWidth: TAP, minHeight: TAP, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingBottom: 24 }}>
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

const styles = {
  navBtn: {
    width: TAP,
    height: TAP,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,232,255,0.25)',
    backgroundColor: 'rgba(0,232,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopePill: {
    minHeight: TAP,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
  },
  scopePillActive: {
    borderColor: 'rgba(0,232,255,0.45)',
    backgroundColor: 'rgba(0,232,255,0.12)',
  },
  scopeText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '800' },
  status: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 10 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.35)',
    borderRadius: 10,
  },
  empty: { color: 'rgba(255,255,255,0.45)', textAlign: 'center', paddingVertical: 28 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: TAP,
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  rowMeta: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#0A1222',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0,232,255,0.25)',
    paddingBottom: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
};
