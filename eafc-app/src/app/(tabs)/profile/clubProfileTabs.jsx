import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import {
  GamerTabNav,
  GamerSectionCard,
  GamerStatTile,
  EmptyTabPanel,
  AMBER,
} from '@/components/profile/gamer/GamerProfileUI';

/** Mobile-first primary destinations — one row, no duplicate Squad. */
const PRIMARY_TABS = [
  { id: 'squad', label: 'Squad' },
  { id: 'feed', label: 'Feed' },
  { id: 'matches', label: 'Matches' },
  { id: 'office', label: 'Office' },
];

const OFFICE_TOOLS = [
  { id: 'operations', label: 'Operations', icon: 'construct-outline', hint: 'Lineup, tactics, staff' },
  { id: 'contracts', label: 'Contracts', icon: 'document-text-outline', hint: 'Offers and wage deals' },
  { id: 'stadium', label: 'Stadium', icon: 'business-outline', hint: 'Upgrades and capacity' },
  { id: 'finance', label: 'Finance', icon: 'cash-outline', hint: 'Budget and transfers' },
  { id: 'shirts', label: 'Shirts', icon: 'shirt-outline', hint: 'Kit shop and sales' },
  { id: 'trophies', label: 'Trophies', icon: 'trophy-outline', hint: 'Cabinet and achievements' },
  { id: 'history', label: 'History', icon: 'time-outline', hint: 'Season results' },
  { id: 'stats', label: 'Stats', icon: 'stats-chart-outline', hint: 'Win rate and form' },
  { id: 'chat', label: 'Chat', icon: 'chatbubbles-outline', hint: 'Club channel' },
];

function MemberRow({ player }) {
  const ovr = player?.overall_rating;
  const ovrLabel = ovr == null || ovr === ''
    ? null
    : (Number.isInteger(Number(ovr)) ? String(Math.round(Number(ovr))) : (Math.round(Number(ovr) * 10) / 10).toFixed(1));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingVertical: 10,
        paddingHorizontal: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          overflow: 'hidden',
          backgroundColor: '#101827',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,214,10,0.25)',
        }}
      >
        {player?.avatar_url ? (
          <Image source={{ uri: player.avatar_url }} style={{ width: 44, height: 44 }} />
        ) : (
          <Ionicons name="person" size={18} color="rgba(255,255,255,0.35)" />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
          {player?.gamertag || player?.display_name || 'Player'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2, letterSpacing: 0.4 }}>
          {[player?.position, player?.role].filter(Boolean).join(' · ') || 'Squad'}
        </Text>
      </View>
      {ovrLabel ? (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: AMBER, fontWeight: '900', fontSize: 18, letterSpacing: -0.5 }}>{ovrLabel}</Text>
          <Text style={{ color: 'rgba(255,214,10,0.55)', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>OVR</Text>
        </View>
      ) : null}
    </View>
  );
}

function MatchRow({ match, clubId }) {
  const isHome = String(match.home_club_id) === String(clubId);
  const opp = isHome ? (match.away_club_name || 'Away') : (match.home_club_name || 'Home');
  const my = isHome ? match.home_score : match.away_score;
  const their = isHome ? match.away_score : match.home_score;
  const done = match.status === 'completed';
  let outcome = '—';
  if (done && my != null && their != null) {
    outcome = my > their ? 'W' : my < their ? 'L' : 'D';
  }
  const chip = outcome === 'W'
    ? { bg: 'rgba(16,185,129,0.15)', color: '#34D399' }
    : outcome === 'L'
      ? { bg: 'rgba(244,63,94,0.15)', color: '#FB7185' }
      : { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 12,
        paddingVertical: 12,
      }}
    >
      <View style={{ backgroundColor: chip.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, minWidth: 32, alignItems: 'center' }}>
        <Text style={{ color: chip.color, fontWeight: '900', fontSize: 11 }}>{outcome}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }} numberOfLines={1}>vs {opp}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
          {match.scheduled_date ? String(match.scheduled_date).slice(0, 10) : (match.status || '—')}
        </Text>
      </View>
      {done ? (
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{my ?? 0}–{their ?? 0}</Text>
      ) : (
        <Text style={{ color: AMBER, fontWeight: '800', fontSize: 10, letterSpacing: 1 }}>NEXT</Text>
      )}
    </View>
  );
}

function OfficeToolRow({ tool, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,214,10,0.18)',
        backgroundColor: 'rgba(255,214,10,0.05)',
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: 'rgba(255,214,10,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={tool.icon} size={18} color={AMBER} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{tool.label}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>{tool.hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
    </TouchableOpacity>
  );
}

/**
 * Club tabs — real-app IA:
 * one primary rail (Squad / Feed / Matches / Office).
 * Office tools are a list, not a second tab row.
 */
export default function ClubProfileTabs({
  club,
  isOwner = false,
  canOpenOperations = false,
  memberCount,
}) {
  const [tab, setTab] = useState('squad');
  const [officeTool, setOfficeTool] = useState(null);
  const [squad, setSquad] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);

  const wins = club?.wins ?? club?.wins_count ?? 0;
  const draws = club?.draws ?? club?.draws_count ?? 0;
  const losses = club?.losses ?? club?.losses_count ?? 0;
  const total = wins + draws + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : null;

  const primaryTabs = useMemo(() => {
    if (isOwner || canOpenOperations) return PRIMARY_TABS;
    return PRIMARY_TABS.filter((t) => t.id !== 'office');
  }, [isOwner, canOpenOperations]);

  const officeTools = useMemo(() => {
    if (isOwner) return OFFICE_TOOLS;
    return OFFICE_TOOLS.filter((t) => ['operations', 'trophies', 'history', 'stats', 'chat'].includes(t.id));
  }, [isOwner]);

  useEffect(() => {
    if (!primaryTabs.some((t) => t.id === tab)) setTab(primaryTabs[0]?.id || 'squad');
  }, [primaryTabs, tab]);

  useEffect(() => {
    if (!club?.id) return;
    let cancelled = false;
    (async () => {
      if (tab === 'squad' || officeTool === 'stats') {
        setLoadingTab(true);
        try {
          const rows = await stageClient.entities.Player.filter({ club_id: club.id }, null, 60).catch(() => []);
          if (!cancelled) setSquad(Array.isArray(rows) ? rows : []);
        } finally {
          if (!cancelled) setLoadingTab(false);
        }
      }
      if (tab === 'matches') {
        setLoadingTab(true);
        try {
          const [home, away] = await Promise.all([
            stageClient.entities.Match.filter({ home_club_id: club.id }, '-scheduled_date', 20).catch(() => []),
            stageClient.entities.Match.filter({ away_club_id: club.id }, '-scheduled_date', 20).catch(() => []),
          ]);
          if (cancelled) return;
          const map = new Map();
          [...(home || []), ...(away || [])].forEach((m) => { if (m?.id) map.set(m.id, m); });
          setMatches([...map.values()].sort((a, b) => String(b.scheduled_date || '').localeCompare(String(a.scheduled_date || ''))));
        } finally {
          if (!cancelled) setLoadingTab(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [club?.id, tab, officeTool]);

  const selectPrimary = (id) => {
    setTab(id);
    setOfficeTool(null);
  };

  const resolvedMembers = memberCount ?? squad.length;

  const renderOfficeDetail = () => {
    if (officeTool === 'stats') {
      return (
        <View style={{ gap: 12 }}>
          <TouchableOpacity onPress={() => setOfficeTool(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chevron-back" size={16} color={AMBER} />
            <Text style={{ color: AMBER, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>OFFICE</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <GamerStatTile label="Wins" value={wins} accent="green" />
            <GamerStatTile label="Draws" value={draws} />
            <GamerStatTile label="Losses" value={losses} accent="rose" />
            <GamerStatTile label="WR %" value={winRate ?? '—'} accent="amber" />
          </View>
          <GamerSectionCard title="Squad size">
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22 }}>{resolvedMembers || 0}</Text>
          </GamerSectionCard>
        </View>
      );
    }

    const tool = OFFICE_TOOLS.find((t) => t.id === officeTool);
    return (
      <View style={{ gap: 12 }}>
        <TouchableOpacity onPress={() => setOfficeTool(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="chevron-back" size={16} color={AMBER} />
          <Text style={{ color: AMBER, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>OFFICE</Text>
        </TouchableOpacity>
        <EmptyTabPanel
          icon={tool?.icon || 'albums-outline'}
          title={tool?.label || 'Tool'}
          hint={`${tool?.hint || 'Details'} — full controls open from Manage Club.`}
        />
      </View>
    );
  };

  const renderContent = () => {
    if (tab === 'office' && officeTool) return renderOfficeDetail();

    if (loadingTab && (tab === 'squad' || tab === 'matches')) {
      return (
        <View style={{ paddingVertical: 28, alignItems: 'center' }}>
          <ActivityIndicator color={AMBER} />
        </View>
      );
    }

    if (tab === 'squad') {
      if (squad.length === 0) {
        return (
          <EmptyTabPanel
            icon="people-outline"
            title="No squad yet"
            hint="Signed players will show here with position and OVR."
          />
        );
      }
      return (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
              ROSTER · {squad.length}
            </Text>
          </View>
          {squad.map((p) => <MemberRow key={p.id} player={p} />)}
        </View>
      );
    }

    if (tab === 'feed') {
      return (
        <EmptyTabPanel
          icon="newspaper-outline"
          title="No posts yet"
          hint="Share matchday updates from the club feed."
        />
      );
    }

    if (tab === 'matches') {
      if (matches.length === 0) {
        return (
          <EmptyTabPanel
            icon="flash-outline"
            title="No fixtures yet"
            hint="Upcoming and played matches will land here."
          />
        );
      }
      return (
        <View style={{ gap: 8 }}>
          {matches.slice(0, 30).map((m) => <MatchRow key={m.id} match={m} clubId={club.id} />)}
        </View>
      );
    }

    if (tab === 'office') {
      return (
        <View style={{ gap: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4 }}>
            CLUB OFFICE
          </Text>
          {officeTools.map((tool) => (
            <OfficeToolRow key={tool.id} tool={tool} onPress={() => setOfficeTool(tool.id)} />
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={{ gap: 14 }}>
      <GamerTabNav
        tabs={primaryTabs}
        active={tab}
        onChange={selectPrimary}
        accent="amber"
      />
      {renderContent()}
    </View>
  );
}
