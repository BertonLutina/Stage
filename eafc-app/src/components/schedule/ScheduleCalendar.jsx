import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  buildCalendarDateMap,
  buildMonthGrid,
  toDateKey,
} from '@/lib/scheduleEvents';
import { CYAN, AMBER } from '@/components/profile/gamer/GamerProfileUI';
import { FUT, SectionCard } from '@/components/dashboard/CommandCenterUI';
import { headingStyleSm } from '@/lib/fonts';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

function DayEventRow({ event, onPress }) {
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

export default function ScheduleCalendar({ events, onOpenMatch }) {
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <TouchableOpacity onPress={() => shiftMonth(-1)} hitSlop={12} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={18} color={CYAN} />
          </TouchableOpacity>
          <Text style={[headingStyleSm, { color: '#fff', fontSize: 14, letterSpacing: 2 }]}>
            {monthLabel(currentMonth)}
          </Text>
          <TouchableOpacity onPress={() => shiftMonth(1)} hitSlop={12} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={18} color={CYAN} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          {DAY_NAMES.map((d) => (
            <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
                {d[0]}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {days.map((day) => {
            const key = toDateKey(day);
            const dayEvents = dateMap.get(key) || [];
            const inMonth = isSameMonth(day, currentMonth);
            const selected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);
            const hasMatch = dayEvents.some((e) => e.type === 'match');
            const hasContract = dayEvents.some((e) => e.type === 'contract_end');
            const hasTournament = dayEvents.some((e) => e.type === 'tournament_start');

            return (
              <TouchableOpacity
                key={key}
                onPress={() => setSelectedDate(day)}
                activeOpacity={0.8}
                style={{
                  width: `${100 / 7}%`,
                  minHeight: 52,
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
                  width: 26,
                  height: 26,
                  borderRadius: 13,
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
                    {day.getDate()}
                  </Text>
                </View>
                {dayEvents.length > 0 ? (
                  <View style={{ flexDirection: 'row', gap: 3, marginTop: 4 }}>
                    {hasMatch ? <View style={[styles.dot, { backgroundColor: CYAN }]} /> : null}
                    {hasContract ? <View style={[styles.dot, { backgroundColor: AMBER }]} /> : null}
                    {hasTournament ? <View style={[styles.dot, { backgroundColor: '#A78BFA' }]} /> : null}
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
          <Legend color={CYAN} label="Match" />
          <Legend color={AMBER} label="Contract" />
          <Legend color="#A78BFA" label="Tournament" />
        </View>
      </SectionCard>

      <Modal
        visible={!!selectedDate}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDate(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelectedDate(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>
              {selectedDate ? dayHeading(selectedDate) : ''}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDate(null)} hitSlop={10}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingBottom: 24 }}>
            {selectedEvents.length === 0 ? (
              <Text style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', paddingVertical: 28 }}>
                No events on this day
              </Text>
            ) : (
              selectedEvents.map((ev) => (
                <DayEventRow key={ev.id} event={ev} onPress={() => openEvent(ev)} />
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function Legend({ color, label }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={[styles.dot, { backgroundColor: color, width: 8, height: 8 }]} />
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = {
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,232,255,0.25)',
    backgroundColor: 'rgba(0,232,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
