import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import {
  acceptTournamentRules,
  advanceTournamentRound,
  fetchTournamentMatches,
  fetchTournamentPublic,
  initializeTournamentDraw,
  officializeTournament,
  isPlayerTournament,
  registerTournamentClub,
  registerTournamentPlayer,
  withdrawTournamentClub,
} from '@/api/tournamentActions';
import useThemeStore from '@/store/themeStore';
import {
  Button,
  Card,
  IconButton,
  ListRow,
  Screen,
  StatGrid,
  TextField,
} from '@/components/ui';
import TournamentStages from '@/components/tournament/TournamentStages';
import TournamentLeaderboard from '@/components/tournament/TournamentLeaderboard';
import { readAppLanguage, resolveTournamentRules } from '@/lib/tournamentRuleTemplates';
import { headingStyleLg } from '@/lib/fonts';

const TYPE_LABEL = {
  knockout: 'Knockout',
  league: 'League',
  group_stage: 'Groups + knockout',
  double_elimination: 'Double Elim',
  swiss: 'Swiss',
  swiss_ucl: 'Swiss UCL',
  group_knockout: 'Groups + knockout',
};

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function TournamentDetailScreen() {
  const { tournamentId } = useLocalSearchParams();
  const router = useRouter();
  const tokens = useThemeStore((st) => st.tokens);
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [myClub, setMyClub] = useState(null);
  const [presidentClub, setPresidentClub] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [user, setUser] = useState(null);
  const [eaClubName, setEaClubName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [rulesChecked, setRulesChecked] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!tournamentId) return;
    try {
      const [{ user: u, player, club, presidentClub: ownedClub }, t, m] = await Promise.all([
        resolveMyPlayerAndClub(),
        fetchTournamentPublic(tournamentId),
        fetchTournamentMatches(tournamentId),
      ]);
      setUser(u);
      setMyPlayer(player || null);
      setMyClub(club || null);
      setPresidentClub(ownedClub || null);
      setTournament(t);
      setMatches(m || []);
    } catch (err) {
      setError(err?.message || 'Failed to load tournament');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setRulesChecked(false);
    setRulesExpanded(false);
  }, [tournament?.id, tournament?.rules_template_id, tournament?.custom_rules]);

  const clubs = parseList(tournament?.registered_clubs);
  const players = parseList(tournament?.registered_players);
  const ownsClub = (club) => {
    if (!club || !user) return false;
    return String(club.president_user_id || '') === String(user.id)
      || String(club.user_id || '') === String(user.id)
      || String(club.owner_email || '').toLowerCase() === String(user.email || '').toLowerCase()
      || (myPlayer && String(club.president_player_id || '') === String(myPlayer.id));
  };
  const registrationClub = [presidentClub, myClub].find((club) => ownsClub(club)) || presidentClub || null;
  const sameId = (left, right) => left != null && right != null && String(left) === String(right);
  const clubEntered = registrationClub && clubs.some((c) => sameId(c.id || c, registrationClub.id));
  const playerEntered = myPlayer && players.some((p) => sameId(p.id || p, myPlayer.id));
  const clubProof = registrationClub
    ? tournament?.registration_proofs?.club?.[String(registrationClub.id)]
    : null;
  const playerProof = myPlayer
    ? tournament?.registration_proofs?.player?.[String(myPlayer.id)]
    : null;
  const clubPending = String(clubProof?.status || '').toLowerCase() === 'pending';
  const isOwner = user && (
    tournament?.created_by === user.email
    || tournament?.creator_email === user.email
    || tournament?.owner_email === user.email
  );
  const canRegister = tournament?.status === 'registration';
  const canStart = isOwner && (tournament?.status === 'registration' || tournament?.status === 'draft');
  const playerTournament = isPlayerTournament(tournament);
  const canSubmitClub = canRegister && !playerTournament && registrationClub && !clubEntered && !clubPending;
  const canSubmitPlayer = canRegister && playerTournament && myPlayer && !playerEntered;
  const hasSavedRulesAcceptance = Boolean(
    playerTournament
      ? playerProof?.rules_accepted_at
      : clubProof?.rules_accepted_at
  );
  const showRulesConsentPanel = (canSubmitClub || canSubmitPlayer) && !hasSavedRulesAcceptance;
  const rules = resolveTournamentRules(tournament, readAppLanguage());
  const registrationOptions = { rulesAccepted: true, tournament };
  const entryCreditsNeeded = tournament?.entry_credits ?? 50;
  const entryStcNeeded = Number(tournament?.entry_fee_stc || 0);
  const userCredits = user?.credits ?? 0;
  const playerStc = myPlayer?.stc ?? 0;
  const clubStc = registrationClub?.stc ?? 0;
  const canAffordPlayerEntry = userCredits >= entryCreditsNeeded
    && (entryStcNeeded <= 0 || playerStc >= entryStcNeeded);
  const canAffordClubEntry = userCredits >= entryCreditsNeeded
    && (entryStcNeeded <= 0 || clubStc >= entryStcNeeded);

  const run = async (key, fn) => {
    setBusy(key);
    setError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err?.message || 'Action failed');
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.cyan} />
        </View>
      </Screen>
    );
  }

  if (!tournament) {
    return (
      <Screen scroll={false}>
        <View style={{ gap: 24 }}>
          <View style={{ flexDirection: 'row' }}>
            <IconButton icon="arrow-back" accessibilityLabel="Back" onPress={() => router.back()} />
          </View>
          <Text style={{ color: tokens.muted, textAlign: 'center' }}>Tournament not found</Text>
        </View>
      </Screen>
    );
  }

  const participantCount = playerTournament ? players.length : clubs.length;
  const maxTeams = Number(tournament.max_teams) || 0;
  const prizePool = Number(tournament.prize_pool_stc) > 0
    ? Number(tournament.prize_pool_stc)
    : entryStcNeeded * maxTeams;
  const endOrStart = tournament.end_date || tournament.final_date || tournament.start_date;
  const dateLabel = endOrStart && !Number.isNaN(new Date(endOrStart).getTime())
    ? new Date(endOrStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null;
  const statusLive = ['in_progress', 'active'].includes(String(tournament.status || '').toLowerCase());
  const typeLbl = TYPE_LABEL[tournament.type] || String(tournament.type || 'Cup');
  const heroEyebrow = `${typeLbl} · ${statusLive ? 'Live' : String(tournament.status || 'Draft').replace(/_/g, ' ')}`;
  const clubsValue = maxTeams > 0 ? String(maxTeams) : String(participantCount);
  const statItems = [
    { label: playerTournament ? 'Players' : 'Clubs', value: clubsValue },
    {
      label: prizePool > 0 ? 'Prize' : 'Entry',
      value: prizePool > 0
        ? `${prizePool.toLocaleString()} STC`
        : (entryStcNeeded > 0 ? `${entryStcNeeded.toLocaleString()} STC` : 'Free'),
    },
    ...(dateLabel
      ? [{ label: tournament.end_date || tournament.final_date ? 'Final' : 'Starts', value: dateLabel }]
      : [{ label: 'Registered', value: String(participantCount) }]),
  ];
  const nextMatch = [...matches]
    .filter((match) => !['completed', 'forfeit', 'cancelled'].includes(String(match?.status || '').toLowerCase()))
    .sort((left, right) => {
      const leftTime = new Date(left?.scheduled_at || left?.scheduled_date || 0).getTime() || Number.MAX_SAFE_INTEGER;
      const rightTime = new Date(right?.scheduled_at || right?.scheduled_date || 0).getTime() || Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    })[0] || null;
  const nextHome = nextMatch?.home_club_name || nextMatch?.home_player_name || nextMatch?.home_team_name || 'TBD';
  const nextAway = nextMatch?.away_club_name || nextMatch?.away_player_name || nextMatch?.away_team_name || 'TBD';
  const enteredLabel = clubEntered
    ? `${registrationClub?.name || 'Club'}${tournament.my_group_name ? ` · ${tournament.my_group_name}` : ''}`
    : (playerEntered ? 'Registered' : null);
  const showRulesChip = hasSavedRulesAcceptance && !(canSubmitClub || canSubmitPlayer);
  const shareTournament = () => {
    Share.share({
      message: `${tournament.name} on STAGE`,
      title: tournament.name,
    }).catch(() => {});
  };

  return (
    <Screen
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={tokens.cyan}
        />
      )}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <DetailHero tokens={tokens}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon="chevron-back" accessibilityLabel="Back" onPress={() => router.back()} />
          <IconButton icon="share-outline" accessibilityLabel="Share" onPress={shareTournament} />
        </View>
        <View style={{ marginTop: 22, gap: 6 }}>
          <Text
            numberOfLines={1}
            style={{
              color: tokens.cyan,
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 11 * 0.12,
              textTransform: 'uppercase',
            }}
          >
            {heroEyebrow}
          </Text>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            style={[headingStyleLg, { color: tokens.text, fontSize: 36, lineHeight: 38, letterSpacing: 36 * 0.03 }]}
          >
            {tournament.name}
          </Text>
        </View>
      </DetailHero>
      <View style={{ paddingTop: 18, gap: 14 }}>
          <Card style={{ paddingVertical: 14 }}>
            <StatGrid items={statItems} columns={3} />
          </Card>

          {showRulesChip || enteredLabel ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {showRulesChip ? (
                <StatusChip tokens={tokens} icon="checkmark" iconColor={tokens.success} label="Rules accepted" />
              ) : null}
              {enteredLabel ? <StatusChip tokens={tokens} label={enteredLabel} /> : null}
            </View>
          ) : null}

          {error ? (
            <Card style={{ borderColor: tokens.danger }}>
              <Text style={{ color: tokens.danger, fontSize: 13 }}>{error}</Text>
            </Card>
          ) : null}

          {(canSubmitPlayer || canSubmitClub) ? (
            <Card>
              <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15, marginBottom: 8 }}>Your balance</Text>
              <Text style={{
                color: userCredits < entryCreditsNeeded ? tokens.danger : tokens.textSoft,
                fontSize: 14,
              }}
              >
                Credits: {userCredits.toLocaleString()} / {entryCreditsNeeded}
              </Text>
              {entryStcNeeded > 0 ? (
                <Text style={{
                  color: (playerTournament ? playerStc : clubStc) < entryStcNeeded ? tokens.danger : tokens.textSoft,
                  fontSize: 14,
                  marginTop: 4,
                }}
                >
                  STC: {(playerTournament ? playerStc : clubStc).toLocaleString()} / {entryStcNeeded.toLocaleString()}
                </Text>
              ) : null}
            </Card>
          ) : null}

          {canRegister && !playerTournament ? (
            <Button
              variant="secondary"
              title="Open registration"
              icon="clipboard-outline"
              onPress={() => router.push({
                pathname: '/apps/tournament-register',
                params: { tournamentId: tournament.id },
              })}
            />
          ) : null}

          {canRegister && !playerTournament && !registrationClub ? (
            <Card>
              <Text style={{ color: tokens.textSoft, fontSize: 14, lineHeight: 20 }}>
                {myClub
                  ? 'Only the club president can register this club for a tournament.'
                  : 'You need a club to register. Create one first, then come back as president.'}
              </Text>
            </Card>
          ) : null}

          {showRulesConsentPanel ? (
            <RulesConsent
              rules={rules}
              checked={rulesChecked}
              showCheckbox
              onToggle={() => setRulesChecked((value) => !value)}
              saveBusy={busy === 'saveRules'}
              onSave={() => run('saveRules', async () => {
                if (!rulesChecked) throw new Error('Accept the tournament rules before saving.');
                const result = await acceptTournamentRules(tournament.id, {
                  rulesAccepted: true,
                  tournament,
                  rulesTemplateId: tournament.rules_template_id || rules?.templateId || null,
                  ...(playerTournament
                    ? { playerId: myPlayer.id }
                    : { clubId: registrationClub.id }),
                });
                const proofs = result?.data?.registration_proofs;
                if (proofs) {
                  setTournament((prev) => ({ ...(prev || {}), registration_proofs: proofs }));
                }
                setRulesChecked(true);
              })}
            />
          ) : null}

          {hasSavedRulesAcceptance && (canSubmitClub || canSubmitPlayer) ? (
            <Card>
              <Text style={{ color: tokens.cyan, fontWeight: '700', fontSize: 15 }}>Rules accepted</Text>
              <Text style={{ color: tokens.muted, fontSize: 13, marginTop: 6 }}>
                You can still open the book to review the rules.
              </Text>
            </Card>
          ) : null}

          {rules?.body ? (
            <Ghost
              label={rulesExpanded ? 'Hide rules' : 'View rules'}
              onPress={() => setRulesExpanded((value) => !value)}
            />
          ) : null}
          {rulesExpanded && rules?.body ? (
            <Card>
              <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }}>{rules.title}</Text>
              <Text style={{ color: tokens.textSoft, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
                {rules.body}
              </Text>
              {rules.rulesFileUrl ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(rules.rulesFileUrl)}
                  accessibilityRole="link"
                  style={{ marginTop: 10, minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '600' }}>{rules.fileLabel}</Text>
                </TouchableOpacity>
              ) : null}
            </Card>
          ) : null}

          {canSubmitClub ? (
            <Card style={{ gap: 12 }}>
              <View>
                <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }}>Register {registrationClub.name}</Text>
                <Text style={{ color: tokens.muted, fontSize: 13, marginTop: 6, lineHeight: 18 }}>
                  Enter the exact EA FC Pro Clubs name your team uses in-game. Admin verifies it before your club appears in the tournament.
                </Text>
              </View>
              <TextField
                value={eaClubName}
                onChangeText={setEaClubName}
                placeholder="EA FC Pro Clubs name"
                accessibilityLabel="EA FC Pro Clubs name"
                autoCapitalize="words"
              />
              <Primary
                label={`Register my club (${entryCreditsNeeded}✧${entryStcNeeded > 0 ? ` + ${entryStcNeeded.toLocaleString()} STC` : ''})`}
                busy={busy === 'regClub'}
                disabled={!hasSavedRulesAcceptance || !canAffordClubEntry}
                onPress={() => run('regClub', async () => {
                  const name = eaClubName.trim();
                  if (!hasSavedRulesAcceptance) throw new Error('Save your rules acceptance before registering.');
                  if (!canAffordClubEntry) throw new Error('Not enough credits or STC for this tournament.');
                  if (!name) throw new Error('Enter your EA FC Pro Clubs name so admins can verify your club.');
                  await registerTournamentClub(tournament.id, registrationClub.id, {
                    eaClubName: name,
                    ...registrationOptions,
                  });
                  setEaClubName('');
                })}
              />
            </Card>
          ) : null}
          {canRegister && !playerTournament && clubPending ? (
            <Card>
              <Text style={{ color: tokens.warning, fontWeight: '700', fontSize: 15 }}>Pending admin approval</Text>
              <Text style={{ color: tokens.muted, fontSize: 13, marginTop: 6 }}>
                Your EA FC club name is waiting for verification.
              </Text>
            </Card>
          ) : null}
          {canSubmitPlayer ? (
            <Primary
              label={`Register as player (${entryCreditsNeeded}✧${entryStcNeeded > 0 ? ` + ${entryStcNeeded.toLocaleString()} STC` : ''})`}
              busy={busy === 'regPlayer'}
              disabled={!hasSavedRulesAcceptance || !canAffordPlayerEntry}
              onPress={() => run('regPlayer', () => {
                if (!hasSavedRulesAcceptance) throw new Error('Save your rules acceptance before registering.');
                if (!canAffordPlayerEntry) throw new Error('Not enough credits or STC for this tournament.');
                return registerTournamentPlayer(tournament.id, myPlayer.id, null, registrationOptions);
              })}
            />
          ) : null}
          {canRegister && !playerTournament && clubEntered ? (
            <Ghost
              label="Withdraw club"
              busy={busy === 'withdraw'}
              onPress={() => run('withdraw', () => withdrawTournamentClub(tournament.id, registrationClub.id))}
            />
          ) : null}
          {canStart ? (
            <Primary
              label="Start / generate draw"
              busy={busy === 'start'}
              onPress={() => run('start', () => initializeTournamentDraw(tournament.id, tournament, clubs))}
            />
          ) : null}
          {isOwner && tournament.status === 'in_progress' ? (
            <Primary
              label="Advance round"
              busy={busy === 'advance'}
              onPress={() => run('advance', () => advanceTournamentRound(tournament.id))}
            />
          ) : null}
          {isOwner && tournament.status === 'in_progress' ? (
            <Ghost
              label="Officialize tournament"
              busy={busy === 'official'}
              onPress={() => run('official', () => officializeTournament(tournament.id))}
            />
          ) : null}

          <TournamentStages tournament={tournament} matches={matches} />

          <TournamentLeaderboard tournamentId={tournamentId} />

          <Card style={{ paddingVertical: 4 }}>
            {tournament.type === 'group_stage' ? (
              <>
                <ListRow
                  icon="grid-outline"
                  title="Group stage"
                  onPress={() => router.push({ pathname: '/(tabs)/tournaments/groupstagescreen', params: { tournamentId } })}
                />
                <View style={{ height: 1, backgroundColor: tokens.border }} />
              </>
            ) : null}
            <ListRow
              icon="list-outline"
              title="Standings"
              onPress={() => router.push({ pathname: '/(tabs)/tournaments/leaguestandingsscreen', params: { tournamentId } })}
            />
            <View style={{ height: 1, backgroundColor: tokens.border }} />
            <ListRow
              icon="calendar-outline"
              title="Fixtures"
              onPress={() => router.push({ pathname: '/(tabs)/tournaments/fixturesscreen', params: { tournamentId } })}
            />
            <View style={{ height: 1, backgroundColor: tokens.border }} />
            <ListRow
              icon="git-network-outline"
              title="Bracket"
              onPress={() => router.push({ pathname: '/(tabs)/tournaments/bracketscreen', params: { tournamentId } })}
            />
          </Card>

          {nextMatch ? (
            <Button
              title={`Next match · ${nextHome} vs ${nextAway}`}
              onPress={() => router.push({
                pathname: '/(tabs)/matches/matchdetailscreen',
                params: { matchId: nextMatch.id },
              })}
            />
          ) : null}
      </View>
    </Screen>
  );
}

/** Full-bleed header band (bgDeep, two outline rings) that sits under the status bar. */
function DetailHero({ tokens, children }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        marginTop: -(insets.top + 12),
        marginHorizontal: -20,
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: 18,
        backgroundColor: tokens.live ? 'transparent' : tokens.bgDeep,
        overflow: 'hidden',
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: -40,
          top: 40,
          width: 220,
          height: 220,
          borderRadius: 110,
          borderWidth: 2,
          borderColor: tokens.border,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: 30,
          top: 110,
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 2,
          borderColor: tokens.aqua,
          opacity: 0.5,
        }}
      />
      {children}
    </View>
  );
}

function StatusChip({ tokens, label, icon, iconColor }) {
  return (
    <View
      style={{
        height: 34,
        maxWidth: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: tokens.border,
        backgroundColor: tokens.card,
      }}
    >
      {icon ? <Ionicons name={icon} size={16} color={iconColor || tokens.textSoft} /> : null}
      <Text numberOfLines={1} style={{ color: tokens.textSoft, fontSize: 13, fontWeight: '600', flexShrink: 1 }}>
        {label}
      </Text>
    </View>
  );
}

function RulesConsent({ rules, checked, showCheckbox, onToggle, onSave, saveBusy }) {
  const tokens = useThemeStore((st) => st.tokens);
  if (!rules?.body) return null;
  return (
    <Card>
      <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }}>{rules.title}</Text>
      <Text style={{ color: tokens.textSoft, fontSize: 14, lineHeight: 21, marginTop: 8 }}>
        {rules.body}
      </Text>
      {rules.rulesFileUrl ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(rules.rulesFileUrl)}
          accessibilityRole="link"
          style={{ marginTop: 10, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '600' }}>{rules.fileLabel}</Text>
        </TouchableOpacity>
      ) : null}
      {showCheckbox ? (
        <TouchableOpacity
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 14, minHeight: 44 }}
        >
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: checked ? tokens.cyan : tokens.borderStrong,
            backgroundColor: checked ? tokens.cyan : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          >
            {checked ? <Ionicons name="checkmark" size={16} color={tokens.onCyan} /> : null}
          </View>
          <Text style={{ color: tokens.text, flex: 1, fontSize: 14, lineHeight: 20 }}>{rules.acceptanceLabel}</Text>
        </TouchableOpacity>
      ) : null}
      {showCheckbox ? (
        <View style={{ marginTop: 12 }}>
          <Primary
            label={saveBusy ? 'Saving...' : 'Save'}
            busy={saveBusy}
            disabled={!checked}
            onPress={onSave}
          />
        </View>
      ) : null}
    </Card>
  );
}

function Primary({ label, onPress, busy, disabled }) {
  return <Button title={label} onPress={onPress} loading={!!busy} disabled={!!disabled} />;
}

function Ghost({ label, onPress, busy }) {
  return <Button title={label} variant="secondary" onPress={onPress} loading={!!busy} />;
}
