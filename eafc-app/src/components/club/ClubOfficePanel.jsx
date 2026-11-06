import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import Card from '@/components/ui/Card';
import { CLUB_OFFICE_SECTIONS } from '@/lib/clubOfficeTabs';
import { GamerSectionCard, GamerStatTile, EmptyTabPanel } from '@/components/profile/gamer/GamerProfileUI';

function formatStc(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0 STC';
  return `${Math.round(n).toLocaleString()} STC`;
}

function LineItem({ title, subtitle, trailing }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingVertical: 10 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: tokens.text, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {trailing ? <Text style={{ color: tokens.amber, fontWeight: '700', fontSize: 12, flexShrink: 0 }} numberOfLines={1}>{trailing}</Text> : null}
    </Card>
  );
}

function OfficeToolRow({ tool, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={tool.label}
    >
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 10 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: tokens.bgDeep, borderWidth: 1, borderColor: tokens.border, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={tool.icon} size={22} color={tokens.cyan} />
        </View>
        <Text style={{ color: tokens.text, fontWeight: '600', fontSize: 15, flex: 1 }} numberOfLines={1}>{tool.label}</Text>
        <Ionicons name="chevron-forward" size={20} color={tokens.muted} />
      </Card>
    </TouchableOpacity>
  );
}

export default function ClubOfficePanel({
  contracts = [],
  players = [],
  stadium,
  finance,
  shirts,
  auditLogs = [],
  contractPlayerName,
  statusLabel,
  getContractTypeLabel,
  weeklyWage,
}) {
  const [section, setSection] = useState(null);
  const tokens = useThemeStore((st) => st.tokens);

  if (!section) {
    return (
      <View style={{ gap: 10 }}>
        <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, marginBottom: 4, textTransform: 'uppercase' }}>
          Club Office
        </Text>
        {CLUB_OFFICE_SECTIONS.map((tool) => (
          <OfficeToolRow key={tool.id} tool={tool} onPress={() => setSection(tool.id)} />
        ))}
      </View>
    );
  }

  const back = (
    <TouchableOpacity
      onPress={() => setSection(null)}
      accessibilityRole="button"
      accessibilityLabel="Back to Club Office"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}
    >
      <Ionicons name="chevron-back" size={20} color={tokens.cyan} />
      <Text style={{ color: tokens.cyan, fontFamily: FONT_EA_SPORTS, fontSize: 14, letterSpacing: 14 * 0.03, textTransform: 'uppercase' }}>Club Office</Text>
    </TouchableOpacity>
  );

  if (section === 'contracts') {
    return (
      <View style={{ gap: 12 }}>
        {back}
        {contracts.length ? contracts.map((row) => {
          const wage = weeklyWage?.(row);
          return (
            <LineItem
              key={row.id}
              title={contractPlayerName?.(row, players) || 'Player'}
              subtitle={`${getContractTypeLabel?.(row) || 'Contract'} · ${statusLabel?.(row.status) || row.status}`}
              trailing={wage ? `${formatStc(wage)}/wk` : undefined}
            />
          );
        }) : <EmptyTabPanel icon="document-text-outline" title="No contracts yet" hint="Offers and signed deals will show here." />}
      </View>
    );
  }

  if (section === 'stadium') {
    const venue = stadium || {};
    return (
      <View style={{ gap: 12 }}>
        {back}
        <GamerSectionCard title={venue.name || 'Stadium'}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <GamerStatTile label="Level" value={String(venue.level ?? 0)} />
            <GamerStatTile label="Capacity" value={venue.capacity ? venue.capacity.toLocaleString() : '—'} />
            <GamerStatTile label="Ticket" value={venue.ticket_price_stc ? formatStc(venue.ticket_price_stc) : '—'} accent="amber" />
          </View>
        </GamerSectionCard>
      </View>
    );
  }

  if (section === 'finance') {
    const tx = Array.isArray(finance?.transactions) ? finance.transactions : [];
    return (
      <View style={{ gap: 12 }}>
        {back}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <GamerStatTile label="Balance" value={formatStc(finance?.balance)} accent="green" />
          <GamerStatTile label="Transfer" value={formatStc(finance?.transfer_budget)} accent="amber" />
          <GamerStatTile label="Wage cap" value={formatStc(finance?.wage_budget)} />
          <GamerStatTile label="Weekly wages" value={formatStc(finance?.weekly_wages)} accent="rose" />
        </View>
        {tx.length ? tx.slice(0, 20).map((row) => (
          <LineItem
            key={row.id}
            title={row.description || row.category || row.type || 'Transaction'}
            subtitle={row.created_date ? String(row.created_date).slice(0, 10) : ''}
            trailing={`${Number(row.amount) >= 0 ? '+' : ''}${formatStc(row.amount)}`}
          />
        )) : <EmptyTabPanel icon="cash-outline" title="No transactions yet" hint="Club ledger entries will show here." />}
      </View>
    );
  }

  if (section === 'shirts') {
    const summary = shirts?.summary || {};
    const board = Array.isArray(shirts?.leaderboard) ? shirts.leaderboard : [];
    return (
      <View style={{ gap: 12 }}>
        {back}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <GamerStatTile label="Shirts" value={Number(summary.total_shirts || 0).toLocaleString()} accent="green" />
          <GamerStatTile label="Revenue" value={formatStc(summary.total_revenue)} accent="amber" />
        </View>
        {board.length ? board.map((row) => (
          <LineItem
            key={row.player_id || row.gamertag}
            title={row.gamertag || 'Player'}
            subtitle={row.shirt_number ? `#${row.shirt_number}` : 'Shirt sales'}
            trailing={`${Number(row.total_shirts || 0)} · ${formatStc(row.total_revenue)}`}
          />
        )) : <EmptyTabPanel icon="shirt-outline" title="No shirt sales yet" hint="Fan shirt sales after matches will show here." />}
      </View>
    );
  }

  if (section === 'audit') {
    return (
      <View style={{ gap: 12 }}>
        {back}
        {auditLogs.length ? auditLogs.slice(0, 20).map((row) => (
          <LineItem
            key={row.id}
            title={String(row.action || 'update').replace(/_/g, ' ')}
            subtitle={row.created_date ? String(row.created_date).slice(0, 10) : ''}
          />
        )) : <EmptyTabPanel icon="reader-outline" title="No audit entries yet" hint="Club office actions will be logged here." />}
      </View>
    );
  }

  return null;
}
