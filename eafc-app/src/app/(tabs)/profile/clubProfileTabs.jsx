import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import { getContractTypeLabel, statusLabel, weeklyWage } from '@/lib/playerContractFields';
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
  { id: 'operations', label: 'Operations' },
  { id: 'office', label: 'Office' },
];

const OFFICE_TOOLS = [
  { id: 'contracts', label: 'Contracts', icon: 'document-text-outline', hint: 'Offers and wage deals' },
  { id: 'stadium', label: 'Stadium', icon: 'business-outline', hint: 'Upgrades and capacity' },
  { id: 'finance', label: 'Finance', icon: 'cash-outline', hint: 'Budget and transfers' },
  { id: 'shirts', label: 'Shirts', icon: 'shirt-outline', hint: 'Kit shop and sales' },
  { id: 'trophies', label: 'Trophies', icon: 'trophy-outline', hint: 'Cabinet and achievements' },
  { id: 'history', label: 'History', icon: 'time-outline', hint: 'Season results' },
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

function formatStc(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0 STC';
  return `${Math.round(n).toLocaleString()} STC`;
}

function contractPlayerName(contract, players) {
  if (contract?.player_gamertag) return contract.player_gamertag;
  const id = contract?.target_player_id || contract?.user_id;
  const player = (players || []).find((row) => String(row.id) === String(id));
  return player?.gamertag || player?.display_name || 'Player';
}

function OfficeBack({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons name="chevron-back" size={16} color={AMBER} />
      <Text style={{ color: AMBER, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>OFFICE</Text>
    </TouchableOpacity>
  );
}

function LineItem({ title, subtitle, trailing }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Text style={{ color: AMBER, fontWeight: '800', fontSize: 12 }}>{trailing}</Text>
      ) : null}
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
 * one primary rail (Squad / Feed / Operations / Office).
 * Office tools are a list, not a second tab row.
 */
export default function ClubProfileTabs({
  club,
  isOwner = false,
  canOpenOperations = false,
  memberCount: _memberCount,
  players: playersProp,
  matches: _matchesProp,
  upcomingMatches: _upcomingMatches = [],
  posts = [],
  historyRows = [],
  trophies = [],
  chatMessages = [],
  record: _record,
  contracts = [],
  staffRoles = [],
  applicants = [],
  lineups = [],
  auditLogs = [],
  availability = [],
  stadium,
  finance,
  shirts,
}) {
  const [tab, setTab] = useState('squad');
  const [officeTool, setOfficeTool] = useState(null);
  const [squad, setSquad] = useState(Array.isArray(playersProp) ? playersProp : []);
  const [loadingTab, setLoadingTab] = useState(false);

  const primaryTabs = useMemo(() => {
    return PRIMARY_TABS.filter((item) => {
      if (item.id === 'operations') return canOpenOperations;
      if (item.id === 'office') return isOwner || canOpenOperations;
      return true;
    });
  }, [isOwner, canOpenOperations]);

  const officeTools = useMemo(() => {
    if (isOwner) return OFFICE_TOOLS;
    return OFFICE_TOOLS.filter((item) => ['trophies', 'history', 'chat'].includes(item.id));
  }, [isOwner]);

  useEffect(() => {
    if (!primaryTabs.some((t) => t.id === tab)) setTab(primaryTabs[0]?.id || 'squad');
  }, [primaryTabs, tab]);

  useEffect(() => {
    if (Array.isArray(playersProp)) setSquad(playersProp);
  }, [playersProp]);

  useEffect(() => {
    if (!club?.id) return;
    if (Array.isArray(playersProp)) return;
    let cancelled = false;
    (async () => {
      if (tab === 'squad') {
        setLoadingTab(true);
        try {
          const rows = await stageClient.entities.Player.filter({ club_id: club.id }, null, 60).catch(() => []);
          if (!cancelled) setSquad(Array.isArray(rows) ? rows : []);
        } finally {
          if (!cancelled) setLoadingTab(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [club?.id, tab, playersProp]);

  const selectPrimary = (id) => {
    setTab(id);
    setOfficeTool(null);
  };

  const renderOfficeDetail = () => {
    if (officeTool === 'history') {
      return (
        <View style={{ gap: 12 }}>
          <OfficeBack onPress={() => setOfficeTool(null)} />
          {historyRows.length ? (
            <View style={{ gap: 8 }}>
              {historyRows.map((row, index) => (
                <LineItem
                  key={`${row.name}-${row.season}-${index}`}
                  title={row.name}
                  subtitle={`S${row.season}${row.pos ? ` · P${row.pos}` : ''}`}
                  trailing={`${row.w}W ${row.d}D ${row.l}L`}
                />
              ))}
            </View>
          ) : (
            <EmptyTabPanel icon="time-outline" title="No seasons yet" hint="League and cup standings will show here." />
          )}
        </View>
      );
    }

    if (officeTool === 'trophies') {
      return (
        <View style={{ gap: 12 }}>
          <OfficeBack onPress={() => setOfficeTool(null)} />
          {trophies.length ? (
            <View style={{ gap: 8 }}>
              {trophies.map((item) => (
                <LineItem
                  key={item.id}
                  title={item.title || item.name || 'Trophy'}
                  subtitle={item.subtitle || item.season || item.competition_name || item.description || 'Club achievement'}
                />
              ))}
            </View>
          ) : (
            <EmptyTabPanel icon="trophy-outline" title="No trophies yet" hint="Cabinet placements and club achievements will show here." />
          )}
        </View>
      );
    }

    if (officeTool === 'chat') {
      return (
        <View style={{ gap: 12 }}>
          <OfficeBack onPress={() => setOfficeTool(null)} />
          {chatMessages.length ? (
            <GamerSectionCard title="Club channel">
              {chatMessages.slice(-40).map((message) => (
                <Text key={message.id} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, paddingVertical: 6 }}>
                  {message.sender_gamertag || message.sender_email || 'Member'}: {message.content}
                </Text>
              ))}
            </GamerSectionCard>
          ) : (
            <EmptyTabPanel icon="chatbubbles-outline" title="No messages yet" hint="Club channel messages will show here." />
          )}
        </View>
      );
    }

    if (officeTool === 'contracts') {
      return (
        <View style={{ gap: 12 }}>
          <OfficeBack onPress={() => setOfficeTool(null)} />
          {contracts.length ? (
            <View style={{ gap: 8 }}>
              {contracts.map((row) => {
                const wage = weeklyWage(row);
                return (
                  <LineItem
                    key={row.id}
                    title={contractPlayerName(row, squad)}
                    subtitle={`${getContractTypeLabel(row)} · ${statusLabel(row.status)}`}
                    trailing={wage ? `${formatStc(wage)}/wk` : statusLabel(row.status)}
                  />
                );
              })}
            </View>
          ) : (
            <EmptyTabPanel icon="document-text-outline" title="No contracts yet" hint="Offers and signed deals will show here." />
          )}
        </View>
      );
    }

    if (officeTool === 'stadium') {
      const venue = stadium || {};
      const capacity = Number(venue.capacity || 0);
      const ticket = Number(venue.ticket_price_stc || 0);
      return (
        <View style={{ gap: 12 }}>
          <OfficeBack onPress={() => setOfficeTool(null)} />
          <GamerSectionCard title={venue.name || 'Stadium'}>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 10 }}>
              Level {venue.level ?? 0}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <GamerStatTile label="Capacity" value={capacity ? capacity.toLocaleString() : '—'} />
              <GamerStatTile label="Ticket" value={ticket ? formatStc(ticket) : '—'} accent="amber" />
              <GamerStatTile label="Home take" value={capacity && ticket ? formatStc(capacity * ticket) : '—'} accent="green" />
            </View>
          </GamerSectionCard>
        </View>
      );
    }

    if (officeTool === 'finance') {
      const tx = Array.isArray(finance?.transactions) ? finance.transactions : [];
      return (
        <View style={{ gap: 12 }}>
          <OfficeBack onPress={() => setOfficeTool(null)} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <GamerStatTile label="Balance" value={formatStc(finance?.balance)} accent="green" />
            <GamerStatTile label="Transfer" value={formatStc(finance?.transfer_budget)} accent="amber" />
            <GamerStatTile label="Wage cap" value={formatStc(finance?.wage_budget)} />
            <GamerStatTile label="Weekly wages" value={formatStc(finance?.weekly_wages)} accent="rose" />
          </View>
          {tx.length ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
                TRANSACTIONS
              </Text>
              {tx.slice(0, 20).map((row) => (
                <LineItem
                  key={row.id}
                  title={row.description || row.category || row.type || 'Transaction'}
                  subtitle={row.created_date ? String(row.created_date).slice(0, 10) : ''}
                  trailing={`${Number(row.amount) >= 0 ? '+' : ''}${formatStc(row.amount)}`}
                />
              ))}
            </View>
          ) : (
            <EmptyTabPanel icon="cash-outline" title="No transactions yet" hint="Club ledger entries will show here." />
          )}
        </View>
      );
    }

    if (officeTool === 'shirts') {
      const summary = shirts?.summary || {};
      const board = Array.isArray(shirts?.leaderboard) ? shirts.leaderboard : [];
      return (
        <View style={{ gap: 12 }}>
          <OfficeBack onPress={() => setOfficeTool(null)} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <GamerStatTile label="Shirts" value={Number(summary.total_shirts || 0).toLocaleString()} accent="green" />
            <GamerStatTile label="Revenue" value={formatStc(summary.total_revenue)} accent="amber" />
            <GamerStatTile label="Matches" value={Number(summary.matches_with_sales || 0).toLocaleString()} />
          </View>
          {board.length ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
                TOP SELLERS
              </Text>
              {board.map((row) => (
                <LineItem
                  key={row.player_id || row.gamertag}
                  title={row.gamertag || 'Player'}
                  subtitle={row.shirt_number ? `#${row.shirt_number}` : 'Shirt sales'}
                  trailing={`${Number(row.total_shirts || 0)} · ${formatStc(row.total_revenue)}`}
                />
              ))}
            </View>
          ) : (
            <EmptyTabPanel icon="shirt-outline" title="No shirt sales yet" hint="Fan shirt sales after matches will show here." />
          )}
        </View>
      );
    }

    const tool = OFFICE_TOOLS.find((t) => t.id === officeTool);
    return (
      <View style={{ gap: 12 }}>
        <OfficeBack onPress={() => setOfficeTool(null)} />
        <EmptyTabPanel
          icon={tool?.icon || 'albums-outline'}
          title={tool?.label || 'Tool'}
          hint={tool?.hint || 'Details'}
        />
      </View>
    );
  };

  const renderContent = () => {
    if (tab === 'office' && officeTool) return renderOfficeDetail();

    if (loadingTab && tab === 'squad') {
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
      if (!posts.length) {
        return (
          <EmptyTabPanel
            icon="newspaper-outline"
            title="No posts yet"
            hint="Share matchday updates from the club feed."
          />
        );
      }
      return (
        <View style={{ gap: 8 }}>
          {posts.map((post) => (
            <View
              key={post.id}
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: 12,
                gap: 8,
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700' }}>
                {post.author_name || post.author_email || 'Club'}
                {post.created_date ? ` · ${String(post.created_date).slice(0, 10)}` : ''}
              </Text>
              {post.content ? (
                <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>{post.content}</Text>
              ) : null}
            </View>
          ))}
        </View>
      );
    }

    if (tab === 'operations') {
      const pendingApplicants = applicants.filter((row) => ['new', 'reviewed', 'invited'].includes(String(row.status || '').toLowerCase()));
      const hasOps = pendingApplicants.length || staffRoles.length || lineups.length || auditLogs.length || availability.length;
      if (!hasOps) {
        return (
          <EmptyTabPanel icon="construct-outline" title="No operations yet" hint="Applicants, staff, and lineups will show here." />
        );
      }
      return (
        <View style={{ gap: 12 }}>
          {pendingApplicants.length ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
                APPLICANTS · {pendingApplicants.length}
              </Text>
              {pendingApplicants.map((row) => (
                <LineItem
                  key={row.id}
                  title={row.player_gamertag || 'Player'}
                  subtitle={[row.preferred_position || row.player_position, row.platform || row.player_platform].filter(Boolean).join(' · ') || row.status}
                  trailing={row.status}
                />
              ))}
            </View>
          ) : null}
          {staffRoles.length ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
                STAFF · {staffRoles.length}
              </Text>
              {staffRoles.map((row) => (
                <LineItem
                  key={row.id}
                  title={row.player_gamertag || row.player_email || 'Staff'}
                  subtitle={String(row.role || 'staff').replace(/_/g, ' ')}
                />
              ))}
            </View>
          ) : null}
          {lineups.length ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
                LINEUPS · {lineups.length}
              </Text>
              {lineups.map((row) => (
                <LineItem
                  key={row.id}
                  title={row.formation || 'Lineup'}
                  subtitle={row.fixture_id ? `Fixture ${String(row.fixture_id).slice(0, 8)}` : 'Saved lineup'}
                />
              ))}
            </View>
          ) : null}
          {availability.length ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
                AVAILABILITY · {availability.length}
              </Text>
              {availability.slice(0, 12).map((row) => (
                <LineItem
                  key={row.id}
                  title={row.player_gamertag || row.player_id || 'Player'}
                  subtitle={row.fixture_id ? `Fixture ${String(row.fixture_id).slice(0, 8)}` : 'Availability'}
                  trailing={row.status || row.available ? 'In' : 'Out'}
                />
              ))}
            </View>
          ) : null}
          {auditLogs.length ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
                RECENT ACTIVITY
              </Text>
              {auditLogs.slice(0, 8).map((row) => (
                <LineItem
                  key={row.id}
                  title={String(row.action || 'update').replace(/_/g, ' ')}
                  subtitle={row.created_date ? String(row.created_date).slice(0, 10) : ''}
                />
              ))}
            </View>
          ) : null}
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
