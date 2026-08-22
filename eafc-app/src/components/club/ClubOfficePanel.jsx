import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CLUB_OFFICE_SECTIONS } from '@/lib/clubOfficeTabs';
import { GamerSectionCard, GamerStatTile, EmptyTabPanel } from '@/components/profile/gamer/GamerProfileUI';

function formatStc(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0 STC';
  return `${Math.round(n).toLocaleString()} STC`;
}

function LineItem({ title, subtitle, trailing }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 10 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {trailing ? <Text style={{ color: '#F5C542', fontWeight: '800', fontSize: 12 }}>{trailing}</Text> : null}
    </View>
  );
}

function OfficeToolRow({ tool, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(0,229,255,0.18)', backgroundColor: 'rgba(0,229,255,0.05)', paddingHorizontal: 14, paddingVertical: 12 }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,229,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={tool.icon} size={18} color="#00E5FF" />
      </View>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14, flex: 1 }}>{tool.label}</Text>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
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

  if (!section) {
    return (
      <View style={{ gap: 8 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4, textTransform: 'uppercase' }}>
          Club Office
        </Text>
        {CLUB_OFFICE_SECTIONS.map((tool) => (
          <OfficeToolRow key={tool.id} tool={tool} onPress={() => setSection(tool.id)} />
        ))}
      </View>
    );
  }

  const back = (
    <TouchableOpacity onPress={() => setSection(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}>
      <Ionicons name="chevron-back" size={16} color="#00E5FF" />
      <Text style={{ color: '#00E5FF', fontWeight: '800', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Club Office</Text>
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
