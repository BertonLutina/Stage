import React, { useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { stageClient } from '@/api/stageClient';
import { getContractTargetPlayerId, getContractTypeLabel, statusLabel, weeklyWage } from '@/lib/playerContractFields';
import {
  applyLoanAnnotations,
  canProposeEarlyEnd,
  isEarlyEndWaitingOnClub,
  isLoanRecallable,
  isPurchaseAwaitingPlayer,
  splitSquadByLoan,
} from '@/lib/playerLoanDisplay';
import { playerRoute } from '@/lib/stageNews';
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

function MemberRow({ player, onPress }) {
  const ovr = player?.overall_rating;
  const ovrLabel = ovr == null || ovr === ''
    ? null
    : (Number.isInteger(Number(ovr)) ? String(Math.round(Number(ovr))) : (Math.round(Number(ovr) * 10) / 10).toFixed(1));
  const loanLabel = player?.loan_status === 'loaned_in'
    ? 'LOAN'
    : player?.loan_status === 'loaned_out'
      ? 'OUT'
      : null;

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
          {loanLabel ? ` · ${loanLabel}` : ''}
        </Text>
      </View>
      {loanLabel ? (
        <View style={{ borderWidth: 1, borderColor: AMBER, paddingHorizontal: 6, paddingVertical: 3 }}>
          <Text style={{ color: AMBER, fontSize: 9, fontWeight: '900' }}>{loanLabel}</Text>
        </View>
      ) : null}
      {ovrLabel ? (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: AMBER, fontWeight: '900', fontSize: 18, letterSpacing: -0.5 }}>{ovrLabel}</Text>
          <Text style={{ color: 'rgba(255,214,10,0.55)', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>OVR</Text>
        </View>
      ) : null}
    </TouchableOpacity>
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
function presentActions(title, message, actions) {
  const cancel = { label: 'Cancel', style: 'cancel' };
  const all = [...actions, cancel];
  if (Platform.OS === 'ios') {
    const destructive = all.findIndex((item) => item.style === 'destructive');
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: all.map((item) => item.label),
        cancelButtonIndex: all.length - 1,
        destructiveButtonIndex: destructive >= 0 ? destructive : undefined,
      },
      (index) => all[index]?.onPress?.(),
    );
    return;
  }
  Alert.alert(title, message, all.map((item) => ({
    text: item.label,
    style: item.style || 'default',
    onPress: item.onPress,
  })));
}

export default function ClubProfileTabs({
  club,
  isOwner = false,
  canOpenOperations = false,
  currentPlayerId = null,
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
  const router = useRouter();
  const [tab, setTab] = useState('squad');
  const [officeTool, setOfficeTool] = useState(null);
  const [squad, setSquad] = useState(Array.isArray(playersProp) ? playersProp : []);
  const [loans, setLoans] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);

  const primaryTabs = useMemo(() => {
    return PRIMARY_TABS.filter((item) => {
      if (item.id === 'operations') return canOpenOperations;
      if (item.id === 'office') return isOwner;
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

  useEffect(() => {
    if (!club?.id) return undefined;
    let cancelled = false;
    (async () => {
      const [incoming, outgoing] = await Promise.all([
        stageClient.entities.PlayerLoan.filter({ loan_club_id: club.id, status: 'ACTIVE' }).catch(() => []),
        stageClient.entities.PlayerLoan.filter({ parent_club_id: club.id, status: 'ACTIVE' }).catch(() => []),
      ]);
      const rows = [...(Array.isArray(incoming) ? incoming : []), ...(Array.isArray(outgoing) ? outgoing : [])];
      if (cancelled) return;
      setLoans(rows);
      const missingIds = [...new Set(rows.map((loan) => loan.player_id).filter(Boolean))];
      if (!missingIds.length) return;
      const extras = await Promise.all(missingIds.map((id) => stageClient.entities.Player.get(id).catch(() => null)));
      if (cancelled) return;
      setSquad((prev) => {
        const seen = new Set(prev.map((player) => String(player.id)));
        const add = extras.filter((player) => player?.id && !seen.has(String(player.id)));
        return add.length ? [...prev, ...add] : prev;
      });
    })();
    return () => { cancelled = true; };
  }, [club?.id]);

  const annotatedSquad = useMemo(
    () => applyLoanAnnotations(squad, loans, club?.id),
    [squad, loans, club?.id],
  );
  const { selectable: homeSquad, onLoan: outOnLoan } = useMemo(
    () => splitSquadByLoan(annotatedSquad),
    [annotatedSquad],
  );

  const contractsFor = (player) => (contracts || []).filter((row) => (
    String(getContractTargetPlayerId(row)) === String(player?.id)
  ));
  const activeContractFor = (player) => (
    contractsFor(player).find((row) => String(row.status || '').toLowerCase() === 'active') || null
  );

  const postLoan = async (loanId, path, body = {}) => {
    await stageClient.http.post(`/player-loans/${encodeURIComponent(loanId)}/${path}`, body);
    const [incoming, outgoing] = await Promise.all([
      stageClient.entities.PlayerLoan.filter({ loan_club_id: club.id, status: 'ACTIVE' }).catch(() => []),
      stageClient.entities.PlayerLoan.filter({ parent_club_id: club.id, status: 'ACTIVE' }).catch(() => []),
    ]);
    setLoans([...(Array.isArray(incoming) ? incoming : []), ...(Array.isArray(outgoing) ? outgoing : [])]);
  };

  const confirmThen = (title, message, confirmLabel, onConfirm) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmLabel, style: 'destructive', onPress: () => { onConfirm().catch((err) => Alert.alert('Could not update', err?.message || 'Try again.')); } },
    ]);
  };

  const releaseSquadPlayer = async (player) => {
    const contract = activeContractFor(player);
    if (contract?.id) {
      await stageClient.functions.invoke('contractManagement', { action: 'terminate', contract_id: contract.id });
    } else {
      await stageClient.entities.Player.update(player.id, {
        club_id: null,
        club_roles: [],
        role: 'member',
        dressing_room_seat: null,
        is_ready: false,
      });
    }
    setSquad((prev) => prev.filter((row) => String(row.id) !== String(player.id)));
  };

  const removePlayerRole = async (player) => {
    await stageClient.entities.Player.update(player.id, { club_roles: [], role: 'member' });
    setSquad((prev) => prev.map((row) => (
      String(row.id) === String(player.id) ? { ...row, club_roles: [], role: 'member' } : row
    )));
  };

  const openPlayerCard = (player) => {
    const name = player?.gamertag || player?.display_name || 'Player';
    const role = String(player?.role || 'member').toLowerCase();
    const isSelf = currentPlayerId && String(currentPlayerId) === String(player.id);
    const isPresidentRole = role === 'president';
    const canReleaseOrRemove = isOwner && !isSelf && !isPresidentRole;
    const canRemoveRole = canReleaseOrRemove && role !== 'member';
    const active = activeContractFor(player);
    const loanShape = player.loan_id ? {
      status: 'ACTIVE',
      loan_id: player.loan_id,
      parent_club_id: player.loan_status === 'loaned_out' ? club?.id : player.loan_from_club_id,
      loan_club_id: player.loan_status === 'loaned_in' ? club?.id : player.on_loan_club_id,
      recall_allowed: player.recall_allowed,
      recall_after_date: player.recall_after_date,
      early_end_proposed_by_club_id: player.early_end_proposed_by_club_id,
      purchase_type: player.purchase_type,
      purchase_offer_status: player.purchase_offer_status,
      purchase_option_deadline: player.purchase_option_deadline,
      end_date: player.loan_end_date,
    } : null;
    const canRecall = isOwner && player.loan_status === 'loaned_out' && isLoanRecallable({ ...loanShape, id: player.loan_id });
    const canReturn = isOwner && player.loan_id && canProposeEarlyEnd(loanShape, club?.id);
    const canRespond = isOwner && player.loan_id && isEarlyEndWaitingOnClub(loanShape, club?.id);
    const canBuy = isOwner && player.can_exercise_purchase_option;
    const awaitingBuy = isPurchaseAwaitingPlayer(loanShape);

    const actions = [
      {
        label: 'View profile',
        onPress: () => {
          const route = playerRoute(player.id);
          if (route) router.push(route);
        },
      },
    ];
    if (isOwner || canOpenOperations) {
      actions.push({
        label: 'View contract',
        onPress: () => {
          const wage = weeklyWage(active);
          Alert.alert(
            'Contract',
            active
              ? `${getContractTypeLabel(active)} · ${statusLabel(active.status)}${wage ? ` · ${formatStc(wage)}/wk` : ''}`
              : 'No active contract on file.',
          );
        },
      });
    }
    if (canRecall) {
      actions.push({
        label: 'Recall',
        onPress: () => confirmThen(
          'Recall player',
          'Recall this player from the loan? Playing rights return immediately. The loan fee is not refunded.',
          'Recall',
          () => postLoan(player.loan_id, 'recall'),
        ),
      });
    }
    if (canReturn) {
      actions.push({
        label: 'Request return',
        onPress: () => confirmThen(
          'Request return',
          'Request an early return of this player? The other club must accept. The loan fee is not refunded.',
          'Request return',
          () => postLoan(player.loan_id, 'early-end', { actor_club_id: club.id }),
        ),
      });
    }
    if (canRespond) {
      actions.push({
        label: 'Accept return',
        onPress: () => confirmThen(
          'Accept return',
          'Accept the early return? Playing rights go back to the parent club immediately. The loan fee is not refunded.',
          'Accept return',
          () => postLoan(player.loan_id, 'early-end-accept', { actor_club_id: club.id }),
        ),
      });
      actions.push({
        label: 'Reject return',
        onPress: () => postLoan(player.loan_id, 'early-end-reject', { actor_club_id: club.id })
          .catch((err) => Alert.alert('Could not update', err?.message || 'Try again.')),
      });
    }
    if (canBuy) {
      actions.push({
        label: 'Exercise option to buy',
        onPress: () => confirmThen(
          'Exercise option to buy',
          'Send a permanent transfer offer to the player? They must accept before ownership moves. Current wage and end date will be used.',
          'Send offer',
          () => postLoan(player.loan_id, 'exercise-option', { weekly_salary_stc: 0, max_days: 0 }),
        ),
      });
    }
    if (awaitingBuy) {
      actions.push({
        label: 'Awaiting player response',
        onPress: () => Alert.alert('Purchase offer', 'The player still has to accept the permanent terms.'),
      });
    }
    if (canReleaseOrRemove) {
      actions.push({
        label: 'Release player',
        style: 'destructive',
        onPress: () => confirmThen(
          'Release player',
          'Release this player from the club?',
          'Release',
          () => releaseSquadPlayer(player),
        ),
      });
    }
    if (canRemoveRole) {
      actions.push({
        label: 'Remove role',
        style: 'destructive',
        onPress: () => confirmThen(
          'Remove role',
          "Remove this player's club role?",
          'Remove',
          () => removePlayerRole(player),
        ),
      });
    }
    presentActions(name, [player.position, player.role].filter(Boolean).join(' · ') || 'Squad', actions);
  };

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
      if (annotatedSquad.length === 0) {
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
              ROSTER · {homeSquad.length}
            </Text>
          </View>
          {homeSquad.map((p) => <MemberRow key={p.id} player={p} onPress={() => openPlayerCard(p)} />)}
          {outOnLoan.length ? (
            <View style={{ gap: 8, marginTop: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
                ON LOAN · {outOnLoan.length}
              </Text>
              {outOnLoan.map((p) => <MemberRow key={p.id} player={p} onPress={() => openPlayerCard(p)} />)}
            </View>
          ) : null}
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
