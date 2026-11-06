import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { hexToRgba } from '@/lib/stageTheme';
import { Card } from '@/components/ui';
import { sectionLabelStyle } from '@/components/dashboard/CommandCenterUI';
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

function DateBlock({ tokens, event, withTime = true }) {
  return (
    <View style={{ width: 48, alignItems: 'center' }}>
      <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600' }}>{fmtMonth(event.date)}</Text>
      <Text style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 24, lineHeight: 26 }}>
        {fmtDay(event.date)}
      </Text>
      {withTime ? <Text style={{ color: tokens.muted, fontSize: 11 }}>{fmtTime(event.date)}</Text> : null}
    </View>
  );
}

function rowStyle(tokens) {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.border,
  };
}

function MatchRow({ event, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  const resultColor = event.result?.outcome === 'W'
    ? tokens.success
    : event.result?.outcome === 'L'
      ? tokens.danger
      : event.result
        ? tokens.warning
        : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityRole="button" style={rowStyle(tokens)}>
      <DateBlock tokens={tokens} event={event} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>{event.opposition || 'TBD'}</Text>
        <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {[event.venue, event.competition].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {event.result ? (
        <Text style={{ color: resultColor, fontWeight: '700', fontSize: 14 }}>{event.result.display}</Text>
      ) : (
        <Text
          numberOfLines={1}
          style={{ color: tokens.cyan, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', maxWidth: 80, textAlign: 'right' }}
        >
          {String(event.status || '—').replace(/_/g, ' ')}
        </Text>
      )}
      <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
    </TouchableOpacity>
  );
}

function ContractEndRow({ event, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityRole="button" style={rowStyle(tokens)}>
      <DateBlock tokens={tokens} event={event} withTime={false} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="document-text-outline" size={18} color={tokens.warning} />
          <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>
            Contract End · {event.contractData?.contract_type || 'squad'}
          </Text>
        </View>
        <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>Contract</Text>
      </View>
      <Text style={{ color: tokens.warning, fontSize: 11, fontWeight: '600' }}>END</Text>
    </TouchableOpacity>
  );
}

function ContractReminderRow({ event, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      style={[rowStyle(tokens), { backgroundColor: hexToRgba(tokens.warning, 0.08) }]}
    >
      <View style={{ width: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="warning-outline" size={22} color={tokens.warning} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: tokens.warning, fontSize: 15, fontWeight: '700' }}>Contract expiring soon</Text>
        <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>
          {[
            event.gamesLeft != null ? `${event.gamesLeft} games left` : null,
            event.daysLeft != null ? `${event.daysLeft}d left` : null,
          ].filter(Boolean).join(' · ') || 'Tap for details'}
        </Text>
      </View>
      <Ionicons name="alert-circle-outline" size={20} color={tokens.warning} />
    </TouchableOpacity>
  );
}

export default function ScheduleFixturesList({ events, onOpenMatch }) {
  const tokens = useThemeStore((s) => s.tokens);
  const list = fixturesListEvents(events);

  if (!list.length) {
    return (
      <Card>
        <View style={{ alignItems: 'center', paddingVertical: 28, gap: 10 }}>
          <Ionicons name="calendar-outline" size={36} color={tokens.muted} />
          <Text style={{ color: tokens.textSoft, fontSize: 15, fontWeight: '600' }}>No scheduled matches yet</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
        backgroundColor: hexToRgba(tokens.cyan, 0.06),
      }}
      >
        <Text style={sectionLabelStyle(tokens)}>Match</Text>
        <Text style={sectionLabelStyle(tokens)}>Result / Status</Text>
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
    </Card>
  );
}
