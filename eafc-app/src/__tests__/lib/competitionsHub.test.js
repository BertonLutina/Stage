import {
  summarizeCup,
  groupLeaguesByRegion,
  summarizeRegistration,
  registrationWindowState,
  loadCompetitionsHub,
} from '../../lib/competitionsHub';

const mockGet = jest.fn();
const mockFilter = jest.fn();
jest.mock('../../api/stageClient', () => ({
  stageClient: {
    http: { get: (...a) => mockGet(...a) },
    entities: { SeasonRegistration: { filter: (...a) => mockFilter(...a) } },
  },
}));

describe('summarizeCup', () => {
  const cup = {
    id: 'cup1',
    name: 'Benelux Cup',
    region_slug: 'benelux',
    status: 'running',
    participant_count: 16,
    participants: [{ id: 'c1', name: 'Mine' }, { id: 'c2', name: 'Other' }],
    rounds: [
      { number: 1, drawn: true, matches: [{ id: 'm1', home_club_id: 'c1', away_club_id: 'c2', status: 'completed', kickoff_at: '2026-11-01T18:00:00Z' }] },
      { number: 2, drawn: true, matches: [{ id: 'm2', home_club_id: 'c1', away_club_id: 'c9', status: 'scheduled', kickoff_at: '2026-11-14T18:00:00Z' }] },
      { number: 3, drawn: false, matches: [] },
    ],
  };

  test('finds the current round and my next real match', () => {
    const row = summarizeCup(cup, 'c1');
    expect(row).toMatchObject({ id: 'cup1', name: 'Benelux Cup', status: 'running', participantCount: 16, round: 2, isMine: true });
    expect(row.myNext).toEqual({ matchId: 'm2', kickoffAt: '2026-11-14T18:00:00Z' });
  });

  test('is not mine when my club is not a participant, and has no next match', () => {
    const row = summarizeCup(cup, 'zzz');
    expect(row.isMine).toBe(false);
    expect(row.myNext).toBeNull();
  });

  test('a cup with no drawn round has no current round (never invents one)', () => {
    const row = summarizeCup({ id: 'c', name: 'X', status: 'running', participants: [], rounds: [{ number: 1, drawn: false, matches: [] }] }, 'c1');
    expect(row.round).toBeNull();
  });
});

describe('groupLeaguesByRegion', () => {
  const editions = [
    { id: 'a', name: 'Benelux D2', region_slug: 'benelux', division: 2, is_current: true, retired: false, slug: 'benelux-d2', status: 'registration', season_number: 4 },
    { id: 'b', name: 'Benelux D1', region_slug: 'benelux', division: 1, is_current: true, retired: false, slug: 'benelux-d1', status: 'in_progress', season_number: 4 },
    { id: 'c', name: 'France D1', region_slug: 'france', division: 1, is_current: true, retired: false, slug: 'france-d1', status: 'in_progress', season_number: 4 },
    { id: 'd', name: 'Old', region_slug: 'france', division: 1, is_current: false, retired: false, slug: 'old', status: 'completed', season_number: 3 },
    { id: 'e', name: 'Dead', region_slug: 'france', division: 3, is_current: true, retired: true, slug: 'dead', status: 'in_progress', season_number: 4 },
  ];

  test('keeps current, non-retired editions grouped by region and sorted by division', () => {
    const groups = groupLeaguesByRegion(editions);
    expect(groups.map((g) => g.regionSlug)).toEqual(['benelux', 'france']);
    expect(groups[0].editions.map((e) => e.id)).toEqual(['b', 'a']);
    expect(groups[1].editions.map((e) => e.id)).toEqual(['c']);
  });

  test('puts my region first', () => {
    const groups = groupLeaguesByRegion(editions, { regionSlug: 'france' });
    expect(groups.map((g) => g.regionSlug)).toEqual(['france', 'benelux']);
  });

  test('is empty without editions', () => {
    expect(groupLeaguesByRegion([])).toEqual([]);
    expect(groupLeaguesByRegion(null)).toEqual([]);
  });
});

describe('summarizeRegistration', () => {
  test('reads season, division and confirmed players from the real record', () => {
    expect(summarizeRegistration({
      id: 'r1', region_slug: 'benelux', region_name: 'Benelux', season_number: 4, assigned_division: 2,
      status: 'approved', participation_status: 'confirmed', confirmed_player_ids: ['p1', 'p2', 'p3'],
    })).toEqual({
      id: 'r1', regionSlug: 'benelux', regionName: 'Benelux', seasonNumber: 4, division: 2,
      status: 'approved', participationStatus: 'confirmed', confirmedPlayers: 3, tone: 'success',
    });
  });

  test('a pending registration is warning-toned with zero confirmed players', () => {
    const row = summarizeRegistration({ id: 'r2', region_slug: 'france', status: 'pending', participation_status: 'registered' });
    expect(row.tone).toBe('warning');
    expect(row.confirmedPlayers).toBe(0);
    expect(row.division).toBeNull();
  });
});

describe('registrationWindowState', () => {
  const NOW = Date.parse('2026-11-11T12:00:00Z');
  test('open when a window is in registration phase', () => {
    const w = { id: 'w1', phase: 'registration', opens_at: '2026-11-01T00:00:00Z', region_slug: 'benelux' };
    expect(registrationWindowState([w], NOW)).toMatchObject({ state: 'open', window: w });
  });
  test('upcoming exposes the opening date', () => {
    const w = { id: 'w2', phase: 'upcoming', opens_at: '2026-12-01T00:00:00Z' };
    expect(registrationWindowState([w], NOW)).toMatchObject({ state: 'upcoming', opensAt: '2026-12-01T00:00:00Z' });
  });
  test('closed or none', () => {
    expect(registrationWindowState([{ id: 'w3', phase: 'closed' }], NOW).state).toBe('closed');
    expect(registrationWindowState([], NOW).state).toBe('none');
  });
});

describe('loadCompetitionsHub', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('keeps the sections that loaded when another one fails', async () => {
    mockGet.mockImplementation((path) => {
      if (path === '/gost/overview') return Promise.resolve({ competitions: [{ slug: 'supreme' }] });
      if (path === '/regional-leagues/cups/public') return Promise.reject({ status: 500, message: 'boom' });
      if (path === '/regional-public/overview') return Promise.resolve({ editions: [{ id: 'a' }] });
      if (path === '/regional-leagues/registration-windows') return Promise.resolve({ windows: [{ id: 'w' }] });
      return Promise.resolve({});
    });
    mockFilter.mockResolvedValue([{ id: 'r1' }]);

    const hub = await loadCompetitionsHub({ clubId: 'c1' });
    expect(hub.gost).toEqual([{ slug: 'supreme' }]);
    expect(hub.cups).toEqual([]);
    expect(hub.leagues).toEqual([{ id: 'a' }]);
    expect(hub.windows).toEqual([{ id: 'w' }]);
    expect(hub.registrations).toEqual([{ id: 'r1' }]);
    expect(hub.errors).toEqual({ cups: 'boom' });
    expect(mockFilter).toHaveBeenCalledWith({ club_id: 'c1' }, '-applied_at', 50);
  });

  test('without a club there are no registrations to load', async () => {
    mockGet.mockResolvedValue({});
    const hub = await loadCompetitionsHub({ clubId: null });
    expect(hub.registrations).toEqual([]);
    expect(mockFilter).not.toHaveBeenCalled();
  });
});
