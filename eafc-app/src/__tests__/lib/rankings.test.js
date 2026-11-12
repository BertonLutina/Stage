import {
  loadRankings,
  filterRankings,
  filterOptions,
  buildBoard,
  INITIAL_VISIBLE,
} from '../../lib/rankings';

const mockGet = jest.fn();
jest.mock('../../api/stageClient', () => ({
  stageClient: { http: { get: (...a) => mockGet(...a) } },
}));

const club = (i, over = {}) => ({
  id: `c${i}`, name: `Club ${i}`, tag: `C${i}`, region: 'Europe', platform: 'PS5',
  wins: 10 - i, draws: 1, losses: i, matches_ranked: 11, ranking_points: 2000 - i * 10, ...over,
});
const clubs = (n, over) => Array.from({ length: n }, (_, k) => club(k + 1, over));

describe('loadRankings', () => {
  beforeEach(() => jest.clearAllMocks());

  test('reads the summary and flags full access', async () => {
    mockGet.mockResolvedValue({ clubs: clubs(3), players: [], meta: { full_access: true, access: 'full' } });
    const data = await loadRankings();
    expect(mockGet).toHaveBeenCalledWith('/rankings/summary');
    expect(data.clubs).toHaveLength(3);
    expect(data.fullAccess).toBe(true);
  });

  test('limited access (free account) is reported as such', async () => {
    mockGet.mockResolvedValue({ clubs: clubs(3), players: [], meta: { full_access: false, access: 'limited' } });
    expect((await loadRankings()).fullAccess).toBe(false);
  });

  test('a summary with no meta counts as limited, never as full', async () => {
    mockGet.mockResolvedValue({ clubs: [], players: [] });
    expect((await loadRankings()).fullAccess).toBe(false);
  });

  test('a malformed payload is an error', async () => {
    mockGet.mockResolvedValue({ clubs: 'nope' });
    await expect(loadRankings()).rejects.toThrow(/incomplete/i);
  });

  test('server errors propagate', async () => {
    mockGet.mockRejectedValue(new Error('down'));
    await expect(loadRankings()).rejects.toThrow('down');
  });
});

describe('filters', () => {
  const rows = [
    club(1, { region: 'Europe', platform: 'PS5' }),
    club(2, { region: 'Europe', platform: 'Xbox' }),
    club(3, { region: 'Asia', platform: 'ps5' }),
    club(4, { region: '', platform: null }),
  ];

  test('options are the distinct real values, sorted, platforms case-folded', () => {
    expect(filterOptions(rows)).toEqual({ regions: ['Asia', 'Europe'], platforms: ['PS5', 'Xbox'] });
  });

  test('region and platform narrow the list', () => {
    expect(filterRankings(rows, {}).map((r) => r.id)).toEqual(['c1', 'c2', 'c3', 'c4']);
    expect(filterRankings(rows, { region: 'Europe' }).map((r) => r.id)).toEqual(['c1', 'c2']);
    expect(filterRankings(rows, { platform: 'PS5' }).map((r) => r.id)).toEqual(['c1', 'c3']);
    expect(filterRankings(rows, { region: 'Europe', platform: 'PS5' }).map((r) => r.id)).toEqual(['c1']);
  });
});

describe('buildBoard: my row always visible', () => {
  test('short list: everything shown, mine in place', () => {
    const board = buildBoard({ rows: clubs(4), myId: 'c3' });
    expect(board.top.map((e) => e.rank)).toEqual([1, 2, 3, 4]);
    expect(board.mine).toMatchObject({ rank: 3, pinned: false });
    expect(board.hasMore).toBe(false);
  });

  test('long list: top slice, then my row pinned with its real rank', () => {
    const board = buildBoard({ rows: clubs(30), myId: 'c12' });
    expect(board.top).toHaveLength(INITIAL_VISIBLE);
    expect(board.mine).toMatchObject({ rank: 12, pinned: true });
    expect(board.mine.row.id).toBe('c12');
    expect(board.hasMore).toBe(true);
    expect(board.total).toBe(30);
  });

  test('showing more extends the slice and unpins my row when it falls inside', () => {
    const board = buildBoard({ rows: clubs(30), myId: 'c12', visible: 20 });
    expect(board.top).toHaveLength(20);
    expect(board.mine).toMatchObject({ rank: 12, pinned: false });
  });

  test('not in the list: falls back to my own record rank, only without filters', () => {
    const mine = { id: 'cx', name: 'Mine', wins: 4, draws: 1, losses: 2, global_rank: 57, ranking_points: 900 };
    const board = buildBoard({ rows: clubs(10), myId: 'cx', myRecord: mine });
    expect(board.mine).toMatchObject({ rank: 57, pinned: true, fromRecord: true });
    expect(board.mine.row.name).toBe('Mine');

    const filtered = buildBoard({ rows: clubs(10), myId: 'cx', myRecord: mine, filtered: true });
    expect(filtered.mine).toBeNull();
  });

  test('not in the list and no rank on my record: nothing invented', () => {
    const board = buildBoard({ rows: clubs(10), myId: 'cx', myRecord: { id: 'cx', name: 'Mine' } });
    expect(board.mine).toBeNull();
  });

  test('empty list', () => {
    const board = buildBoard({ rows: [], myId: 'c1' });
    expect(board.top).toEqual([]);
    expect(board.mine).toBeNull();
    expect(board.hasMore).toBe(false);
  });
});
