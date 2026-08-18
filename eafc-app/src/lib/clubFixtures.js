import { asObjectArray } from '@/lib/clubProfileData';

export const FIXTURE_AVAILABILITY_LABELS = {
  available: 'Available',
  unavailable: 'Unavailable',
  maybe: 'Maybe',
  no_response: 'No Response',
};

export const CLUB_FIXTURE_GROUPS = [
  { key: 'regional', title: 'Regional League fixtures' },
  { key: 'supreme', title: 'Supreme League', parent: 'Competitions' },
  { key: 'elite', title: 'Elite League', parent: 'Competitions' },
  { key: 'challenger', title: 'Challenger League', parent: 'Competitions' },
  { key: 'tournament', title: 'Tournaments' },
  { key: 'gameday', title: 'Arrange Game / Game Day' },
];

function fixtureText(fixture) {
  return [
    fixture.event_type,
    fixture.fixture_type,
    fixture._fixtureType,
    fixture.competition_type,
    fixture.competition_name,
    fixture.tournament_name,
    fixture.league_name,
    fixture.name,
    fixture.title,
  ].filter(Boolean).join(' ').toLowerCase();
}

export function fixtureGroupKey(fixture) {
  const text = fixtureText(fixture);
  if (text.includes('regional')) return 'regional';
  if (text.includes('supreme league')) return 'supreme';
  if (text.includes('elite league')) return 'elite';
  if (text.includes('challenger league')) return 'challenger';
  if (text.includes('tournament') || (fixture.tournament_id && fixture.tournament_id !== 'ranked')) return 'tournament';
  return 'gameday';
}

function fixtureDateValue(fixture) {
  const value = new Date(fixture.scheduled_date || fixture.match_date || fixture.created_date || fixture.updated_date || 0).getTime();
  return Number.isFinite(value) ? value : 0;
}

export function fixtureIsCompleted(fixture) {
  return fixture.status === 'completed' || (fixture.home_score != null && fixture.away_score != null);
}

export function fixtureIsTerminal(fixture) {
  return ['completed', 'cancelled', 'canceled', 'forfeited', 'forfeit'].includes(String(fixture.status || '').toLowerCase())
    || fixtureIsCompleted(fixture);
}

export function fixtureCanSetAvailability(fixture) {
  return Boolean(fixture?.id) && !fixtureIsTerminal(fixture);
}

function sortClubFixtures(fixtures) {
  const now = Date.now();
  return fixtures.sort((a, b) => {
    const aDone = fixtureIsCompleted(a);
    const bDone = fixtureIsCompleted(b);
    if (aDone !== bDone) return aDone ? 1 : -1;
    const aDate = fixtureDateValue(a);
    const bDate = fixtureDateValue(b);
    if (!aDone) return (aDate || now) - (bDate || now);
    return bDate - aDate;
  });
}

export function groupClubFixtures(fixtures) {
  const byGroup = new Map(CLUB_FIXTURE_GROUPS.map((group) => [group.key, { ...group, fixtures: [] }]));
  for (const fixture of fixtures) {
    byGroup.get(fixtureGroupKey(fixture)).fixtures.push(fixture);
  }
  return CLUB_FIXTURE_GROUPS
    .map((group) => ({ ...byGroup.get(group.key), fixtures: sortClubFixtures(byGroup.get(group.key).fixtures) }))
    .filter((group) => group.fixtures.length > 0);
}

export function fixtureEventName(fixture, group) {
  return fixture.competition_name
    || fixture.tournament_name
    || fixture.league_name
    || fixture.event_name
    || fixture.name
    || group.title;
}

export function fixtureDateLabel(fixture) {
  const raw = fixture.scheduled_date || fixture.match_date || fixture.created_date;
  if (!raw) return 'TBD';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return String(raw);
  return parsed.toLocaleString();
}

export function buildAvailabilityByFixture(rows) {
  const map = new Map();
  for (const row of asObjectArray(rows)) {
    if (!row?.fixture_id) continue;
    const key = String(row.fixture_id);
    const current = map.get(key) || [];
    current.push(row);
    map.set(key, current);
  }
  return map;
}

export function getFixtureAvailabilityCounts(rows, players) {
  const responded = new Set();
  const counts = { available: 0, unavailable: 0, maybe: 0, no_response: 0 };
  for (const row of asObjectArray(rows)) {
    if (!row?.player_id) continue;
    const status = String(row.status || 'no_response').toLowerCase();
    if (status === 'available' || status === 'unavailable' || status === 'maybe') {
      counts[status] += 1;
      responded.add(String(row.player_id));
    }
  }
  counts.no_response = Math.max(0, asObjectArray(players).filter((player) => player?.id && !responded.has(String(player.id))).length);
  return counts;
}

export function buildFixtureResponseRows(rows, players, playerById) {
  const rowsByPlayer = new Map(asObjectArray(rows).filter((row) => row?.player_id).map((row) => [String(row.player_id), row]));
  return asObjectArray(players)
    .filter((player) => player?.id)
    .map((player) => ({
      player: playerById.get(String(player.id)) || player,
      status: rowsByPlayer.get(String(player.id))?.status || 'no_response',
    }))
    .sort((a, b) => String(a.player.gamertag || '').localeCompare(String(b.player.gamertag || '')));
}

export function getNextFixture(fixtures = []) {
  const now = Date.now();
  const scheduled = asObjectArray(fixtures)
    .filter((fixture) => fixture?.id)
    .sort((a, b) => new Date(a.scheduled_date || a.match_date || 0) - new Date(b.scheduled_date || b.match_date || 0));
  return scheduled.find((fixture) => {
    const time = new Date(fixture.scheduled_date || fixture.match_date || 0).getTime();
    return Number.isFinite(time) && time >= now;
  }) || scheduled[0] || null;
}
