import { getContractTargetPlayerId } from './playerContractFields';

/**
 * Schedule domain helpers — pure seams for Fixtures + Calendar.
 * See CONTEXT.md (Schedule Event, Fixtures View, Calendar View).
 */

export function toDateKey(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, n) {
  const next = new Date(date);
  next.setDate(next.getDate() + n);
  return next;
}

export function buildMonthGrid(monthDate, { weekStartsOn = 1 } = {}) {
  const base = parseDate(monthDate) || new Date();
  const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
  const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0);

  const start = startOfDay(monthStart);
  while (start.getDay() !== weekStartsOn) {
    start.setDate(start.getDate() - 1);
  }

  const end = startOfDay(monthEnd);
  const endDow = end.getDay();
  const daysToAdd = (weekStartsOn + 6 - endDow) % 7;
  end.setDate(end.getDate() + daysToAdd);

  const days = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function buildCalendarDateMap(events = []) {
  const map = new Map();
  events.forEach((ev) => {
    if (!ev || ev.type === 'contract_reminder') return;
    const key = toDateKey(ev.date);
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(ev);
  });
  return map;
}

function deriveCompetition(match, tournament) {
  if (match?.competition_context) return match.competition_context;
  if (!tournament || match?.tournament_id === 'ranked') return 'Ranked Match';
  const type = tournament.type || tournament.format;
  if (type === 'knockout' || type === 'single_elim') return `${tournament.name} · Knockout`;
  if (type === 'league' || type === 'classic_league') return `${tournament.name} · League`;
  if (type === 'group_stage' || type === 'group_knockout') return `${tournament.name} · Groups`;
  if (type === 'swiss' || type === 'swiss_ucl') return `${tournament.name} · Swiss`;
  if (type === 'double_elimination' || type === 'double_elim') return `${tournament.name} · Double Elim`;
  return tournament.name || 'Tournament';
}

function getResult(match, club, player) {
  if (match.status !== 'completed' && match.status !== 'awaiting_confirmation') return null;
  const isSolo = match.mode === 'solo' || (!match.home_club_id && !match.away_club_id);
  const isHome = isSolo
    ? match.home_player_id === player?.id
    : club
      ? match.home_club_id === club.id
      : match.home_player_id === player?.id;
  const myScore = isHome ? Number(match.home_score ?? 0) : Number(match.away_score ?? 0);
  const theirScore = isHome ? Number(match.away_score ?? 0) : Number(match.home_score ?? 0);
  const outcome = myScore > theirScore ? 'W' : myScore < theirScore ? 'L' : 'D';
  return {
    outcome,
    myScore,
    theirScore,
    display: `${myScore}–${theirScore}`,
  };
}

function toMatchEvent(match, { club, player, tournamentMap }) {
  const tournament = tournamentMap.get(match.tournament_id);
  const isSolo = match.mode === 'solo' || (!match.home_club_id && !match.away_club_id);
  const isHome = isSolo
    ? match.home_player_id === player?.id
    : club
      ? match.home_club_id === club.id
      : match.home_player_id === player?.id;

  const opposition = isSolo
    ? (isHome ? (match.away_player_name || 'Unknown') : (match.home_player_name || 'Unknown'))
    : club
      ? (isHome
        ? (match.away_club_name || match.away_player_name)
        : (match.home_club_name || match.home_player_name))
      : (isHome
        ? (match.away_player_name || match.away_club_name)
        : (match.home_player_name || match.home_club_name));

  return {
    id: match.id,
    type: 'match',
    date: match.scheduled_date || match.created_date,
    opposition: opposition || 'TBD',
    venue: isHome ? 'Home' : 'Away',
    venueKey: isHome ? 'home' : 'away',
    result: getResult(match, club, player),
    competition: deriveCompetition(match, tournament),
    status: match.status,
    matchData: match,
    tournament: tournament || null,
    isHome,
  };
}

function toContractEvents(contract, { player, club, now }) {
  const targetId = getContractTargetPlayerId(contract);
  const mine = targetId === player?.id || contract.team_id === club?.id || contract.club_id === club?.id;
  if (!mine || contract.status !== 'active') return [];

  const events = [];
  const endDate = parseDate(contract.end_date);
  const gamesLeft = contract.max_games != null
    ? Number(contract.max_games) - Number(contract.games_played || 0)
    : null;
  const daysLeft = endDate
    ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiring = (gamesLeft != null && gamesLeft <= 10)
    || (daysLeft != null && daysLeft <= 14);

  if (endDate) {
    events.push({
      id: `contract-end-${contract.id}`,
      type: 'contract_end',
      date: contract.end_date,
      competition: 'Contract',
      opposition: '',
      venue: '',
      result: null,
      status: 'contract',
      contractData: contract,
    });
  }

  if (isExpiring) {
    events.push({
      id: `contract-reminder-${contract.id}`,
      type: 'contract_reminder',
      date: now.toISOString(),
      competition: 'Contract',
      opposition: '',
      venue: '',
      result: null,
      status: 'reminder',
      contractData: contract,
      gamesLeft,
      daysLeft,
    });
  }

  return events;
}

function toTournamentStartEvents(tournament, club) {
  if (!club?.id || !tournament?.start_date) return [];
  const registered = tournament.registered_clubs || [];
  if (!registered.includes(club.id)) return [];
  return [{
    id: `tournament-start-${tournament.id}`,
    type: 'tournament_start',
    date: tournament.start_date,
    competition: tournament.name,
    opposition: '',
    venue: '',
    result: null,
    status: 'tournament',
    tournamentData: tournament,
  }];
}

/**
 * Build sorted Schedule Events from raw Stage entities (web Schedule parity).
 */
export function buildScheduleEvents({
  matches = [],
  tournaments = [],
  contracts = [],
  player = null,
  club = null,
  now = new Date(),
  scopedTournamentId = null,
} = {}) {
  const tournamentMap = new Map((tournaments || []).map((t) => [t.id, t]));
  const matchEvents = (matches || []).map((m) => toMatchEvent(m, { club, player, tournamentMap }));

  const contractEvents = (contracts || []).flatMap((c) => toContractEvents(c, { player, club, now }));
  const tournamentEvents = (tournaments || []).flatMap((t) => toTournamentStartEvents(t, club));

  const scopedMatchEvents = scopedTournamentId
    ? matchEvents.filter((e) => e.matchData?.tournament_id === scopedTournamentId)
    : matchEvents;
  const scopedContractEvents = scopedTournamentId ? [] : contractEvents;
  const scopedTournamentEvents = scopedTournamentId
    ? tournamentEvents.filter((e) => e.tournamentData?.id === scopedTournamentId)
    : tournamentEvents;

  return [...scopedMatchEvents, ...scopedContractEvents, ...scopedTournamentEvents].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
}

/** Fixtures list excludes tournament_start (web ScheduleList behavior). */
export function fixturesListEvents(events = []) {
  return events.filter((e) => e.type !== 'tournament_start');
}

export function uniqById(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    if (row?.id != null) map.set(String(row.id), row);
  });
  return Array.from(map.values());
}
