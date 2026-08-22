import React, { useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, View, Text, ActivityIndicator } from 'react-native';
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
import { buildClubTabGroups, clubTabLabels } from '@/lib/clubOfficeTabs';
import { buildClubPlayerStatMap, getClubPlayerStats } from '@/lib/clubPlayerStats';
import { getNextFixture } from '@/lib/clubFixtures';
import {
  getPlayerContracts,
  getSquadAvailabilitySummary,
  getSquadContractSummary,
  resolveClubAccess,
} from '@/lib/clubSquadDisplay';
import { asObjectArray } from '@/lib/clubProfileData';
import { GamerClubTabNav, GamerSectionCard, EmptyTabPanel } from '@/components/profile/gamer/GamerProfileUI';
import ClubFixturesPanel from '@/components/club/ClubFixturesPanel';
import ClubStatsPanel from '@/components/club/ClubStatsPanel';
import ClubOfficePanel from '@/components/club/ClubOfficePanel';
import SquadPlayerCard from '@/components/club/SquadPlayerCard';

function presentActions(title, message, actions) {
  const cancel = { label: 'Cancel', style: 'cancel' };
  const all = [...actions, cancel];
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: all.map((item) => item.label),
        cancelButtonIndex: all.length - 1,
        destructiveButtonIndex: all.findIndex((item) => item.style === 'destructive'),
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

function contractPlayerName(contract, players) {
  if (contract?.player_gamertag) return contract.player_gamertag;
  const id = contract?.target_player_id || contract?.user_id;
  const player = (players || []).find((row) => String(row.id) === String(id));
  return player?.gamertag || player?.display_name || 'Player';
}

function formatStc(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0 STC';
  return `${Math.round(n).toLocaleString()} STC`;
}

export default function ClubProfileTabs({
  club,
  isOwner = false,
  isCaptain = false,
  isPresident = false,
  isViceCaptain = false,
  isMember = false,
  currentPlayerId = null,
  players: playersProp,
  matches = [],
  upcomingMatches = [],
  posts = [],
  trophies = [],
  chatMessages = [],
  contracts = [],
  auditLogs = [],
  availability: availabilityProp = [],
  stadium,
  finance,
  shirts,
}) {
  const router = useRouter();
  const [tab, setTab] = useState('squad');
  const [squad, setSquad] = useState(Array.isArray(playersProp) ? playersProp : []);
  const [loans, setLoans] = useState([]);
  const [availabilityRows, setAvailabilityRows] = useState(Array.isArray(availabilityProp) ? availabilityProp : []);
  const [statRows, setStatRows] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);

  const myPlayer = useMemo(
    () => squad.find((player) => String(player.id) === String(currentPlayerId)) || null,
    [squad, currentPlayerId],
  );

  const access = resolveClubAccess({
    isOwner,
    isCaptain,
    isPresident,
    isViceCaptain,
    isMember: isMember || Boolean(myPlayer),
  });

  const tabGroups = useMemo(
    () => buildClubTabGroups({
      canOpenClubOffice: access.canOpenClubOffice,
      showChat: access.showChat,
    }),
    [access.canOpenClubOffice, access.showChat],
  );

  const tabLabels = useMemo(() => clubTabLabels(), []);
  const nextFixture = useMemo(() => getNextFixture(upcomingMatches), [upcomingMatches]);

  useEffect(() => {
    if (Array.isArray(playersProp)) setSquad(playersProp);
  }, [playersProp]);

  useEffect(() => {
    if (Array.isArray(availabilityProp)) setAvailabilityRows(availabilityProp);
  }, [availabilityProp]);

  useEffect(() => {
    const allowed = tabGroups.flatMap((group) => group.tabs);
    if (!allowed.includes(tab)) setTab(allowed[0] || 'squad');
  }, [tabGroups, tab]);

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
      const rows = [...asObjectArray(incoming), ...asObjectArray(outgoing)];
      if (cancelled) return;
      setLoans(rows);
    })();
    return () => { cancelled = true; };
  }, [club?.id]);

  useEffect(() => {
    if (!club?.id || tab !== 'stats') return undefined;
    let cancelled = false;
    (async () => {
      const rows = await stageClient.entities.PlayerStat.filter({ club_id: club.id }, '-created_date', 500).catch(() => []);
      if (!cancelled) setStatRows(asObjectArray(rows));
    })();
    return () => { cancelled = true; };
  }, [club?.id, tab]);

  const annotatedSquad = useMemo(
    () => applyLoanAnnotations(squad, loans, club?.id),
    [squad, loans, club?.id],
  );
  const { selectable: homeSquad, onLoan: outOnLoan } = useMemo(
    () => splitSquadByLoan(annotatedSquad),
    [annotatedSquad],
  );

  const statsByPlayerId = useMemo(
    () => buildClubPlayerStatMap(annotatedSquad, statRows, club?.id),
    [annotatedSquad, statRows, club?.id],
  );

  const contractsFor = (player) => contracts.filter((row) => (
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
    setLoans([...asObjectArray(incoming), ...asObjectArray(outgoing)]);
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

  const buildMenuActions = (player) => {
    const role = String(player?.role || 'member').toLowerCase();
    const isSelf = currentPlayerId && String(currentPlayerId) === String(player.id);
    const isPresidentRole = role === 'president';
    const canReleaseOrRemove = access.canOpenClubOffice && !isSelf && !isPresidentRole;
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
      end_date: player.loan_end_date,
    } : null;
    const canRecall = access.canOpenClubOffice && player.loan_status === 'loaned_out' && isLoanRecallable({ ...loanShape, id: player.loan_id });
    const canReturn = access.canOpenClubOffice && player.loan_id && canProposeEarlyEnd(loanShape, club?.id);
    const canRespond = access.canOpenClubOffice && player.loan_id && isEarlyEndWaitingOnClub(loanShape, club?.id);
    const canBuy = access.canOpenClubOffice && player.can_exercise_purchase_option;
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

    if (access.canOpenClubOffice) {
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
        onPress: () => confirmThen('Recall player', 'Recall this player from the loan?', 'Recall', () => postLoan(player.loan_id, 'recall')),
      });
    }
    if (canReturn) {
      actions.push({
        label: 'Request return',
        onPress: () => confirmThen('Request return', 'Request an early return of this player?', 'Request return', () => postLoan(player.loan_id, 'early-end', { actor_club_id: club.id })),
      });
    }
    if (canRespond) {
      actions.push({ label: 'Accept return', onPress: () => confirmThen('Accept return', 'Accept the early return?', 'Accept return', () => postLoan(player.loan_id, 'early-end-accept', { actor_club_id: club.id })) });
      actions.push({ label: 'Reject return', onPress: () => postLoan(player.loan_id, 'early-end-reject', { actor_club_id: club.id }).catch((err) => Alert.alert('Could not update', err?.message || 'Try again.')) });
    }
    if (canBuy) {
      actions.push({ label: 'Exercise option to buy', onPress: () => confirmThen('Exercise option to buy', 'Send a permanent transfer offer to the player?', 'Send offer', () => postLoan(player.loan_id, 'exercise-option', { weekly_salary_stc: 0, max_days: 0 })) });
    }
    if (awaitingBuy) {
      actions.push({ label: 'Awaiting player response', onPress: () => Alert.alert('Purchase offer', 'The player still has to accept the permanent terms.') });
    }
    if (canReleaseOrRemove) {
      actions.push({ label: 'Release player', style: 'destructive', onPress: () => confirmThen('Release player', 'Release this player from the club?', 'Release', () => releaseSquadPlayer(player)) });
    }
    if (canRemoveRole) {
      actions.push({ label: 'Remove role', style: 'destructive', onPress: () => confirmThen('Remove role', "Remove this player's club role?", 'Remove', () => removePlayerRole(player)) });
    }

    return actions;
  };

  const renderSquad = () => {
    if (loadingTab) {
      return (
        <View style={{ paddingVertical: 28, alignItems: 'center' }}>
          <ActivityIndicator color="#00E5FF" />
        </View>
      );
    }
    if (!annotatedSquad.length) {
      return <EmptyTabPanel icon="people-outline" title="No squad yet" hint="Signed players will show here." />;
    }
    const availabilityForPlayer = (player) => {
      if (!nextFixture?.id) return null;
      return availabilityRows.find((row) => (
        String(row.fixture_id) === String(nextFixture.id) && String(row.player_id) === String(player.id)
      )) || null;
    };

    return (
      <View style={{ gap: 10 }}>
        {homeSquad.map((player) => (
          <SquadPlayerCard
            key={player.id}
            player={player}
            clubStats={getClubPlayerStats(statsByPlayerId, player)}
            contractSummary={getSquadContractSummary(contractsFor(player))}
            availabilitySummary={getSquadAvailabilitySummary(availabilityForPlayer(player), nextFixture)}
            menuActions={buildMenuActions(player)}
            onOpenProfile={() => {
              const route = playerRoute(player.id);
              if (route) router.push(route);
            }}
          />
        ))}
        {outOnLoan.length ? (
          <View style={{ gap: 10, marginTop: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' }}>
              ON LOAN · {outOnLoan.length}
            </Text>
            {outOnLoan.map((player) => (
              <SquadPlayerCard
                key={player.id}
                player={player}
                clubStats={getClubPlayerStats(statsByPlayerId, player)}
                contractSummary={getSquadContractSummary(contractsFor(player))}
                availabilitySummary={getSquadAvailabilitySummary(availabilityForPlayer(player), nextFixture)}
                menuActions={buildMenuActions(player)}
                onOpenProfile={() => {
                  const route = playerRoute(player.id);
                  if (route) router.push(route);
                }}
              />
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const renderPosts = () => {
    if (!posts.length) return <EmptyTabPanel icon="newspaper-outline" title="No posts yet" hint="Club updates will show here." />;
    return (
      <View style={{ gap: 8 }}>
        {posts.map((post) => (
          <View key={post.id} style={{ borderRadius: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, gap: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700' }}>
              {post.author_name || post.author_email || 'Club'}
              {post.created_date ? ` · ${String(post.created_date).slice(0, 10)}` : ''}
            </Text>
            {post.content ? <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>{post.content}</Text> : null}
          </View>
        ))}
      </View>
    );
  };

  const renderTrophies = () => {
    if (!trophies.length) return <EmptyTabPanel icon="trophy-outline" title="No trophies yet" hint="Cabinet placements will show here." />;
    return (
      <View style={{ gap: 8 }}>
        {trophies.map((item) => (
          <View key={item.id} style={{ borderRadius: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{item.title || item.name || 'Trophy'}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 }}>
              {item.subtitle || item.season || item.competition_name || 'Club achievement'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderChat = () => {
    if (!chatMessages.length) return <EmptyTabPanel icon="chatbubbles-outline" title="No messages yet" hint="Club channel messages will show here." />;
    return (
      <GamerSectionCard title="Club Chat">
        {chatMessages.slice(-40).map((message) => (
          <Text key={message.id} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, paddingVertical: 6 }}>
            {message.sender_gamertag || message.sender_email || 'Member'}: {message.content}
          </Text>
        ))}
      </GamerSectionCard>
    );
  };

  const renderContent = () => {
    if (tab === 'posts') return renderPosts();
    if (tab === 'squad') return renderSquad();
    if (tab === 'stats') {
      return (
        <ClubStatsPanel
          clubId={club?.id}
          players={annotatedSquad}
          myPlayer={myPlayer}
          canCustomize={access.canOpenClubOffice}
        />
      );
    }
    if (tab === 'fixtures') {
      return (
        <ClubFixturesPanel
          clubId={club?.id}
          clubPlayers={annotatedSquad}
          myPlayer={myPlayer}
          canSetAvailability={access.canSetAvailability}
          canViewTeamAvailability={access.canViewTeamAvailability}
          availabilityRows={availabilityRows}
          onAvailabilityRowsChange={setAvailabilityRows}
          matches={matches}
          upcomingMatches={upcomingMatches}
        />
      );
    }
    if (tab === 'trophies') return renderTrophies();
    if (tab === 'chat') return renderChat();
    if (tab === 'club-office') {
      return (
        <ClubOfficePanel
          contracts={contracts}
          players={annotatedSquad}
          stadium={stadium}
          finance={finance}
          shirts={shirts}
          auditLogs={auditLogs}
          contractPlayerName={contractPlayerName}
          statusLabel={statusLabel}
          getContractTypeLabel={getContractTypeLabel}
          weeklyWage={weeklyWage}
        />
      );
    }
    return null;
  };

  return (
    <View style={{ gap: 14 }}>
      <GamerClubTabNav
        groups={tabGroups}
        activeTab={tab}
        tabLabels={tabLabels}
        onChange={setTab}
      />
      {renderContent()}
    </View>
  );
}
