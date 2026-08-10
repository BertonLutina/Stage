import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CYAN, AMBER } from '@/components/profile/gamer/GamerProfileUI';
import { FUT, SectionCard } from '@/components/dashboard/CommandCenterUI';
import { fixturesListEvents } from '@/lib/scheduleEvents';

function fmtMonth(date) {
  const d = date ? new Date(date) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
}

function fmtDay(date) {
  const d = date ? new Date(date) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return String(d.getDate()).padStart(2, '0');
}

function fmtTime(date) {
  const d = date ? new Date(date) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function MatchRow({ event, onPress }) {
  const resultColor = event.result?.outcome === 'W'
    ? FUT.lime
    : event.result?.outcome === 'L'
      ? FUT.rose
      : event.result
        ? AMBER
        : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.row}>
      <View style={styles.dateBlock}>
        <Text style={styles.month}>{fmtMonth(event.date)}</Text>
        <Text style={styles.day}>{fmtDay(event.date)}</Text>
        <Text style={styles.time}>{fmtTime(event.date)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={1}>{event.opposition || 'TBD'}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[event.venue, event.competition].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {event.result ? (
        <Text style={{ color: resultColor, fontWeight: '900', fontSize: 13 }}>{event.result.display}</Text>
      ) : (
        <Text style={styles.status}>{String(event.status || '—').replace(/_/g, ' ')}</Text>
      )}
      <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.35)" />
    </TouchableOpacity>
  );
}

function ContractEndRow({ event, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.row}>
      <View style={styles.dateBlock}>
        <Text style={styles.month}>{fmtMonth(event.date)}</Text>
        <Text style={styles.day}>{fmtDay(event.date)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="document-text-outline" size={14} color={AMBER} />
          <Text style={styles.title} numberOfLines={1}>
            Contract End · {event.contractData?.contract_type || 'squad'}
          </Text>
        </View>
        <Text style={styles.meta}>Contract</Text>
      </View>
      <Text style={{ color: AMBER, fontSize: 10, fontWeight: '800' }}>END</Text>
    </TouchableOpacity>
  );
}

function ContractReminderRow({ event, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.row, { backgroundColor: 'rgba(255,210,74,0.06)' }]}>
      <View style={[styles.dateBlock, { justifyContent: 'center' }]}>
        <Ionicons name="warning" size={20} color={AMBER} />
      </View>
      <View style={styles.divider} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: AMBER }]}>Contract expiring soon</Text>
        <Text style={styles.meta}>
          {[
            event.gamesLeft != null ? `${event.gamesLeft} games left` : null,
            event.daysLeft != null ? `${event.daysLeft}d left` : null,
          ].filter(Boolean).join(' · ') || 'Tap for details'}
        </Text>
      </View>
      <Text style={{ color: AMBER, fontWeight: '900' }}>!</Text>
    </TouchableOpacity>
  );
}

export default function ScheduleFixturesList({ events, onOpenMatch }) {
  const list = fixturesListEvents(events);

  if (!list.length) {
    return (
      <SectionCard>
        <View style={{ alignItems: 'center', paddingVertical: 36, gap: 10 }}>
          <Ionicons name="calendar-outline" size={36} color="rgba(255,255,255,0.2)" />
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontWeight: '800' }}>No scheduled matches yet</Text>
        </View>
      </SectionCard>
    );
  }

  return (
    <SectionCard style={{ padding: 0 }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,232,255,0.06)',
      }}
      >
        <Text style={styles.head}>Match</Text>
        <Text style={styles.head}>Result / Status</Text>
      </View>
      {list.map((ev) => {
        if (ev.type === 'contract_end') {
          return <ContractEndRow key={ev.id} event={ev} onPress={() => {}} />;
        }
        if (ev.type === 'contract_reminder') {
          return <ContractReminderRow key={ev.id} event={ev} onPress={() => {}} />;
        }
        return (
          <MatchRow
            key={ev.id}
            event={ev}
            onPress={() => onOpenMatch?.(ev)}
          />
        );
      })}
    </SectionCard>
  );
}

const styles = {
  head: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  dateBlock: { width: 44, alignItems: 'center' },
  month: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' },
  day: { color: '#fff', fontSize: 18, fontWeight: '900', lineHeight: 22 },
  time: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  divider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' },
  title: { color: '#fff', fontSize: 14, fontWeight: '800' },
  meta: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  status: {
    color: CYAN,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    maxWidth: 72,
    textAlign: 'right',
  },
};
