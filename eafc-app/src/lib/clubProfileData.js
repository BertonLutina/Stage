import { getContractTargetPlayerId, getContractType, normalizePlayerContracts } from './playerContractFields';
import { mergeStaffRolesIntoPlayers } from './clubStaffRoles';
import { mergeActiveContractPlayersIntoSquad } from './clubSquadContracts';

export function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

export function asObjectArray(value) {
  if (Array.isArray(value)) return value.filter((row) => row && typeof row === 'object');
  return [];
}

export function countryFlag(code) {
  const normalized = String(code || '').toUpperCase();
  if (normalized.length !== 2 || /[^A-Z]/.test(normalized)) return '';
  return [...normalized]
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join('');
}

export function mapPresidentFromPlayer(player, club) {
  if (!player?.id) return null;
  return {
    ...player,
    player_id: player.id,
    display_name: player.gamertag || player.display_name,
    profile_path: `/players/${player.id}`,
    club_id: player.club_id || club?.id || null,
  };
}

export function computeClubRecord(matches, clubId) {
  const completed = asObjectArray(matches).filter((match) => match.status === 'completed');
  let wins = 0;
  let losses = 0;
  for (const match of completed) {
    const isHome = String(match.home_club_id) === String(clubId);
    const myScore = isHome ? match.home_score : match.away_score;
    const oppScore = isHome ? match.away_score : match.home_score;
    if (myScore > oppScore) wins += 1;
    else if (myScore < oppScore) losses += 1;
  }
  const totalGames = completed.length;
  const draws = Math.max(0, totalGames - wins - losses);
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  return { wins, draws, losses, totalGames, winRate };
}

const STADIUM_LEVELS = [
  { level: 0, name: 'Local Ground', capacity: 5000, ticket_price_stc: 15 },
  { level: 1, name: 'Pro Stadium', capacity: 20000, ticket_price_stc: 50 },
  { level: 2, name: 'Elite Ground', capacity: 45000, ticket_price_stc: 130 },
  { level: 3, name: 'Iconic Arena', capacity: 80000, ticket_price_stc: 180 },
];

export function mapStadiumFromClub(club) {
  const level = Math.min(Math.max(Number(club?.stadium_level) || 0, 0), STADIUM_LEVELS.length - 1);
  const preset = STADIUM_LEVELS[level];
  return {
    level,
    name: club?.stadium_name || preset.name,
    capacity: Number(club?.stadium_capacity) || preset.capacity,
    ticket_price_stc: preset.ticket_price_stc,
  };
}

export function mapFinanceOverview(overview, club) {
  const data = overview && typeof overview === 'object' ? overview : {};
  return {
    balance: Number(data.balance ?? club?.stc ?? 0),
    transfer_budget: Number(data.transfer_budget ?? club?.transfer_budget_stc ?? 0),
    wage_budget: Number(data.wage_budget ?? club?.wage_budget_stc ?? 0),
    weekly_wages: Number(data.weekly_wages || 0),
    income_30d: Number(data.income_30d || 0),
    expenses_30d: Number(data.expenses_30d || 0),
    transactions: asObjectArray(data.transactions),
  };
}

export function mergeTrophyRows(achievements, placements) {
  const fromPlacements = asObjectArray(placements).map((row) => ({
    id: row.id,
    title: row.trophy_name || row.name || 'Trophy',
    subtitle: row.competition_name || row.season || 'Cabinet',
    source: 'placement',
  }));
  const fromAchievements = asObjectArray(achievements).map((row) => ({
    id: row.id,
    title: row.title || row.name || 'Trophy',
    subtitle: row.season || row.competition_name || row.description || 'Club achievement',
    source: 'achievement',
  }));
  return [...fromPlacements, ...fromAchievements];
}

function unwrapFunctionResult(res) {
  if (!res || typeof res !== 'object') return {};
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  return res;
}

async function invokeFunction(client, name, params) {
  if (!client?.functions?.invoke) return null;
  try {
    return await client.functions.invoke(name, params);
  } catch {
    return null;
  }
}

async function filterEntity(client, entityName, query, orderBy, limit) {
  const filter = client?.entities?.[entityName]?.filter;
  if (!filter) return [];
  return asObjectArray(await filter(query, orderBy, limit).catch(() => []));
}

async function loadShirtSales(clubId, client) {
  const [lbRes, sumRes] = await Promise.all([
    invokeFunction(client, 'shirtSales', { action: 'get_leaderboard', club_id: clubId, period: '30d', limit: 5 }),
    invokeFunction(client, 'shirtSales', { action: 'get_club_summary', club_id: clubId, period: '30d' }),
  ]);
  const leaderboard = asObjectArray(unwrapFunctionResult(lbRes).leaderboard);
  const summaryRaw = unwrapFunctionResult(sumRes);
  const summary = {
    total_shirts: Number(summaryRaw.total_shirts || 0),
    total_revenue: Number(summaryRaw.total_revenue || 0),
    matches_with_sales: Number(summaryRaw.matches_with_sales || 0),
  };
  if (leaderboard.length || summary.total_shirts) {
    return { leaderboard, summary };
  }

  const sales = await filterEntity(client, 'ShirtSale', { club_id: clubId }, '-created_date', 80);
  const byPlayer = new Map();
  for (const sale of sales) {
    const key = sale.player_id || sale.player_gamertag || sale.id;
    const prev = byPlayer.get(key) || {
      player_id: sale.player_id,
      gamertag: sale.player_gamertag,
      total_shirts: 0,
      total_revenue: 0,
    };
    prev.total_shirts += 1;
    prev.total_revenue += Number(sale.price_stc || 0);
    byPlayer.set(key, prev);
  }
  return {
    leaderboard: [...byPlayer.values()].sort((a, b) => b.total_shirts - a.total_shirts).slice(0, 5),
    summary: {
      total_shirts: sales.length,
      total_revenue: sales.reduce((sum, row) => sum + Number(row.price_stc || 0), 0),
      matches_with_sales: new Set(sales.map((row) => row.match_id).filter(Boolean)).size,
    },
  };
}

export function mergeHistoryRows(compRows, leagueRows) {
  const comp = asObjectArray(compRows).map((row) => ({
    type: 'competition',
    name: row.competition_name || 'Competition',
    season: row.season_number || 0,
    pos: row.final_position || row.position || null,
    w: row.wins || 0,
    d: row.draws || 0,
    l: row.losses || 0,
    pts: row.points || 0,
  }));
  const league = asObjectArray(leagueRows).map((row) => ({
    type: 'league',
    name: row.league_name || 'League',
    season: row.season_number || 0,
    pos: row.final_position || row.position || null,
    w: row.wins || 0,
    d: row.draws || 0,
    l: row.losses || 0,
    pts: row.points || 0,
  }));
  return [...comp, ...league].sort((a, b) => Number(b.season || 0) - Number(a.season || 0));
}

function emptyBundle(club = null) {
  return {
    club,
    president: null,
    players: [],
    matches: [],
    upcomingMatches: [],
    posts: [],
    historyRows: [],
    trophies: [],
    chatMessages: [],
    record: { wins: 0, draws: 0, losses: 0, totalGames: 0, winRate: 0 },
    contracts: [],
    staffRoles: [],
    applicants: [],
    availability: [],
    lineups: [],
    auditLogs: [],
    stadium: mapStadiumFromClub(club),
    finance: mapFinanceOverview({}, club),
    shirts: { leaderboard: [], summary: { total_shirts: 0, total_revenue: 0, matches_with_sales: 0 } },
  };
}

async function loadPresident(club, client) {
  if (club?.president_player_id) {
    const presidentPlayer = asObject(await client.entities.Player.get(club.president_player_id).catch(() => null));
    const mapped = mapPresidentFromPlayer(presidentPlayer, club);
    if (mapped) return mapped;
  }
  if (club?.president_id) {
    return asObject(await client.entities.President.get(club.president_id).catch(() => null));
  }
  if (club?.id) {
    const byClub = await client.entities.President.filter({ club_id: club.id }, null, 1).catch(() => []);
    return asObject(asObjectArray(byClub)[0]);
  }
  return null;
}

async function enrichSquad(clubId, initialPlayerRows, staffRoleRows, activeContractRows, client) {
  const staffRows = asObjectArray(staffRoleRows);
  let playerData = asObjectArray(initialPlayerRows).filter((player) => player.id);
  const playerIds = new Set(playerData.map((player) => player.id).filter(Boolean));
  const safeActiveContracts = normalizePlayerContracts(activeContractRows);

  const liveOwnershipContracts = safeActiveContracts.filter((contract) => getContractType(contract) === 'ownership');
  if (liveOwnershipContracts.length > 0) {
    const ownershipPlayers = await Promise.all(
      liveOwnershipContracts
        .filter((contract) => {
          const playerId = getContractTargetPlayerId(contract);
          return playerId && !playerIds.has(playerId);
        })
        .map((contract) => client.entities.Player.get(getContractTargetPlayerId(contract)).catch(() => null)),
    );
    const normalizedOwners = asObjectArray(ownershipPlayers).map((ownerPlayer) => ({
      ...ownerPlayer,
      club_id: ownerPlayer.club_id || clubId,
      club_roles: Array.isArray(ownerPlayer.club_roles) && ownerPlayer.club_roles.includes('president')
        ? ownerPlayer.club_roles
        : ['president'],
      role: ownerPlayer.role === 'captain' || ownerPlayer.role === 'owner' || !ownerPlayer.role
        ? 'president'
        : ownerPlayer.role,
    }));
    playerData = [...playerData, ...normalizedOwners];
  }

  const activeContractPlayerIds = [...new Set(safeActiveContracts.map(getContractTargetPlayerId).filter(Boolean))];
  const visiblePlayerIds = new Set(playerData.map((player) => player.id).filter(Boolean));
  const missingContractPlayerIds = activeContractPlayerIds.filter((playerId) => !visiblePlayerIds.has(playerId));
  if (missingContractPlayerIds.length > 0) {
    const contractedPlayerRows = await Promise.all(
      missingContractPlayerIds.map((playerId) => client.entities.Player.get(playerId).catch(() => null)),
    );
    playerData = mergeActiveContractPlayersIntoSquad(
      playerData,
      safeActiveContracts,
      asObjectArray(contractedPlayerRows),
      clubId,
    );
  }

  return mergeStaffRolesIntoPlayers(playerData, staffRows);
}

/**
 * Same club-profile payload the web ClubDetail page loads from Stage.
 */
async function listProfileMatches(client, filters, orderBy, limit) {
  if (client.profileMatches?.list) {
    return client.profileMatches.list(filters, orderBy, limit).catch(() => []);
  }
  return client.entities.Match.filter(filters, `-${orderBy || 'scheduled_date'}`, limit).catch(() => []);
}

export async function loadClubProfile(clubId, client) {
  if (!clubId || !client?.entities) return emptyBundle();

  const [clubRecordRaw, initialPlayerRows, staffRoleRows, contractRows] = await Promise.all([
    client.entities.Club.get(clubId).catch(() => null),
    client.entities.Player.filter({ club_id: clubId }).catch(() => []),
    client.entities.ClubStaffRole.filter({ club_id: clubId }, '-created_date', 200).catch(() => []),
    client.entities.PlayerContract.filter({ team_id: clubId }, '-created_date', 200).catch(() => []),
  ]);

  const club = asObject(clubRecordRaw);
  if (!club?.id) return emptyBundle();

  const contracts = normalizePlayerContracts(contractRows);
  const activeContractRows = contracts.filter((contract) => contract.status === 'active');

  const [
    president,
    players,
    matchesHome,
    matchesAway,
    upcomingHome,
    upcomingAway,
    posts,
    achievements,
    trophyPlacements,
    chatMessages,
    compRows,
    leagueRows,
    applicants,
    availability,
    lineups,
    auditLogs,
    financeRes,
    shirts,
  ] = await Promise.all([
    loadPresident(club, client),
    enrichSquad(clubId, initialPlayerRows, staffRoleRows, activeContractRows, client),
    listProfileMatches(client, { home_club_id: clubId, status: 'completed' }, 'round', 30),
    listProfileMatches(client, { away_club_id: clubId, status: 'completed' }, 'round', 30),
    listProfileMatches(client, { home_club_id: clubId, status: 'scheduled' }, 'round', 30),
    listProfileMatches(client, { away_club_id: clubId, status: 'scheduled' }, 'round', 30),
    (client.entities.Post.filter({ club_id: clubId }, '-created_date', 50).catch(() => [])),
    filterEntity(client, 'ClubAchievement', { club_id: clubId }, '-created_date', 50),
    filterEntity(client, 'TrophyPlacement', { owner_id: clubId, owner_type: 'club' }, '-created_date', 50),
    (client.entities.ChatMessage.filter({ match_id: `club:${clubId}` }, 'created_date', 80).catch(() => [])),
    filterEntity(client, 'CompetitionStanding', { club_id: clubId }, null, 100),
    filterEntity(client, 'RegionalLeagueStanding', { club_id: clubId }, null, 100),
    filterEntity(client, 'ClubApplicant', { club_id: clubId }, '-created_date', 200),
    filterEntity(client, 'ClubFixtureAvailability', { club_id: clubId }, '-updated_date', 300),
    filterEntity(client, 'ClubFixtureLineup', { club_id: clubId }, '-updated_date', 100),
    filterEntity(client, 'ClubOperationAuditLog', { club_id: clubId }, '-created_date', 100),
    invokeFunction(client, 'clubFinance', { action: 'get_overview', club_id: clubId }),
    loadShirtSales(clubId, client),
  ]);

  const matches = [...asObjectArray(matchesHome), ...asObjectArray(matchesAway)]
    .sort((a, b) => new Date(b.created_date || b.scheduled_date || 0) - new Date(a.created_date || a.scheduled_date || 0));
  const upcomingMatches = [...asObjectArray(upcomingHome), ...asObjectArray(upcomingAway)]
    .sort((a, b) => new Date(a.scheduled_date || 0) - new Date(b.scheduled_date || 0));

  return {
    club,
    president,
    players,
    matches,
    upcomingMatches,
    posts: asObjectArray(posts),
    historyRows: mergeHistoryRows(compRows, leagueRows),
    trophies: mergeTrophyRows(achievements, trophyPlacements),
    chatMessages: asObjectArray(chatMessages),
    record: computeClubRecord(matches, clubId),
    contracts,
    staffRoles: asObjectArray(staffRoleRows),
    applicants,
    availability,
    lineups,
    auditLogs,
    stadium: mapStadiumFromClub(club),
    finance: mapFinanceOverview(unwrapFunctionResult(financeRes), club),
    shirts,
  };
}
