require('../setup');

jest.mock('../../config/db', () => ({
  pool: { query: jest.fn() },
  testConnection: jest.fn(),
}));

const { pool } = require('../../config/db');
const tournamentService = require('../../services/tournamentService');

const TEAM_IDS = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];
const TOURNAMENT = { id: 'tourn-uuid-1', name: 'Test Cup', format: 'single_elim' };

beforeEach(() => {
  jest.clearAllMocks();
  pool.query.mockResolvedValue([{ insertId: 1 }]);
});

describe('Tournament Service – generateSingleElimination', () => {
  it('creates bracket rounds and matches for 8 teams', async () => {
    await tournamentService.generateSingleElimination({ ...TOURNAMENT, format: 'single_elim' }, TEAM_IDS);
    expect(pool.query).toHaveBeenCalled();
    const roundInsert = pool.query.mock.calls.find(c => c[0].includes('bracket_rounds'));
    expect(roundInsert).toBeDefined();
    const matchInsert = pool.query.mock.calls.find(c => c[0].includes('INSERT INTO matches'));
    expect(matchInsert).toBeDefined();
  });

  it('handles BYE slots when teams count is not a power of 2', async () => {
    const oddTeams = ['t1', 't2', 't3', 't4', 't5', 't6'];
    await tournamentService.generateSingleElimination(TOURNAMENT, oddTeams);
    const matchInserts = pool.query.mock.calls.filter(c => c[0].includes('INSERT INTO matches'));
    expect(matchInserts.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Tournament Service – generateGroupStage', () => {
  it('creates groups and matches for 8 teams with group size 4', async () => {
    const teams = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];
    await tournamentService.generateGroupStage({ ...TOURNAMENT, format: 'group_knockout' }, teams, 4);

    const groupInserts = pool.query.mock.calls.filter(c => c[0].includes('INSERT INTO groups'));
    expect(groupInserts).toHaveLength(2);

    const groupTeamInserts = pool.query.mock.calls.filter(c => c[0].includes('INSERT INTO group_teams'));
    expect(groupTeamInserts).toHaveLength(8);

    const matchInserts = pool.query.mock.calls.filter(c => c[0].includes('INSERT INTO matches'));
    expect(matchInserts).toHaveLength(12);
  });
});

describe('Tournament Service – generateDoubleElimination', () => {
  it('inserts all teams into winners bracket and creates round 1 matches', async () => {
    const teams = ['t1', 't2', 't3', 't4'];
    await tournamentService.generateDoubleElimination({ ...TOURNAMENT, format: 'double_elim' }, teams);

    const bracketInserts = pool.query.mock.calls.filter(c => c[0].includes('INSERT INTO de_brackets'));
    expect(bracketInserts).toHaveLength(4);

    const roundInserts = pool.query.mock.calls.filter(c => c[0].includes('bracket_rounds'));
    expect(roundInserts.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Tournament Service – generateClassicLeague', () => {
  it('creates a standings entry per team and round-robin matches', async () => {
    const teams = ['t1', 't2', 't3', 't4'];
    await tournamentService.generateClassicLeague({ ...TOURNAMENT, format: 'classic_league' }, teams);

    const standingsInserts = pool.query.mock.calls.filter(c => c[0].includes('INSERT INTO league_standings'));
    expect(standingsInserts).toHaveLength(4);

    const matchInserts = pool.query.mock.calls.filter(c => c[0].includes('INSERT INTO matches'));
    expect(matchInserts).toHaveLength(6);
  });
});

describe('Tournament Service – generateLeaguePlayoffs', () => {
  it('creates standings and distributes home/away matches', async () => {
    const teams = Array.from({ length: 8 }, (_, i) => `team_${i}`);
    await tournamentService.generateLeaguePlayoffs({ ...TOURNAMENT, format: 'league_playoffs' }, teams);

    const standingsInserts = pool.query.mock.calls.filter(c => c[0].includes('INSERT INTO league_standings'));
    expect(standingsInserts).toHaveLength(8);

    const matchInserts = pool.query.mock.calls.filter(c => c[0].includes('INSERT INTO matches'));
    expect(matchInserts.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Tournament Service – generate dispatcher', () => {
  const formats = ['group_knockout', 'single_elim', 'double_elim', 'league_playoffs', 'classic_league'];

  formats.forEach((format) => {
    it(`dispatches generate() correctly for format: ${format}`, async () => {
      await expect(
        tournamentService.generate({ id: 'tourn-x', name: 'Test', format }, TEAM_IDS)
      ).resolves.not.toThrow();
    });
  });

  it('throws on unknown format', async () => {
    await expect(
      tournamentService.generate({ id: 'tourn-x', name: 'Test', format: 'unknown_format' }, TEAM_IDS)
    ).rejects.toThrow(/unknown tournament format/i);
  });
});
