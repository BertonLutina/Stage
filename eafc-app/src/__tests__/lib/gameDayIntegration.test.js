import {
  canOpenGameDayFromFixture,
  createMatchFromFixture,
  isFixtureConfirmed,
  isFixturePendingSchedule,
  isKickoffEligibleMatch,
  loadPendingCompetitionFixtures,
  materializeConfirmedFixtures,
} from '../../lib/gameDayIntegration';
import { stageClient } from '../../api/stageClient';

jest.mock('../../api/stageClient', () => ({
  stageClient: {
    entities: {
      Match: {
        get: jest.fn(),
        filter: jest.fn(),
        create: jest.fn(),
      },
      CompetitionFixture: {
        filter: jest.fn(),
        update: jest.fn(),
      },
      RegionalLeagueFixture: {
        filter: jest.fn(),
        update: jest.fn(),
      },
    },
    functions: { invoke: jest.fn() },
  },
}));

describe('gameDayIntegration confirmed gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('isFixtureConfirmed ignores status: scheduled', () => {
    expect(isFixtureConfirmed({ scheduling_status: 'open', status: 'scheduled' })).toBe(false);
    expect(isFixtureConfirmed({ scheduling_status: 'confirmed', status: 'scheduled' })).toBe(true);
    expect(isFixturePendingSchedule({ scheduling_status: 'home_proposed' })).toBe(true);
    expect(canOpenGameDayFromFixture({ scheduling_status: 'open', match_id: 'm1' })).toBe(false);
  });

  test('kickoff list hides unconfirmed tournament Matches', () => {
    expect(isKickoffEligibleMatch({
      status: 'scheduled',
      scheduling_status: 'open',
    })).toBe(false);
    expect(isKickoffEligibleMatch({
      status: 'scheduled',
      scheduling_status: 'confirmed',
    })).toBe(true);
    expect(isKickoffEligibleMatch({ status: 'scheduled' })).toBe(true);
    expect(isKickoffEligibleMatch({ status: 'in_progress', scheduling_status: 'open' })).toBe(true);
  });

  test('createMatchFromFixture returns null unless confirmed', async () => {
    await expect(createMatchFromFixture({
      id: 'f1',
      status: 'scheduled',
      scheduling_status: 'open',
    }, 'competition')).resolves.toBeNull();
    expect(stageClient.functions.invoke).not.toHaveBeenCalled();
    expect(stageClient.entities.Match.create).not.toHaveBeenCalled();
  });

  test('createMatchFromFixture materializes confirmed fixtures', async () => {
    stageClient.entities.Match.get.mockRejectedValue(new Error('missing'));
    stageClient.entities.Match.filter.mockResolvedValue([]);
    stageClient.functions.invoke.mockResolvedValue({
      data: { match: { id: 'm-confirmed', status: 'scheduled' } },
    });

    const match = await createMatchFromFixture({
      id: 'f2',
      scheduling_status: 'confirmed',
      status: 'scheduled',
    }, 'competition');

    expect(match).toEqual({ id: 'm-confirmed', status: 'scheduled' });
    expect(stageClient.functions.invoke).toHaveBeenCalledWith('createMatchFromLeagueFixture', {
      fixture_id: 'f2',
      fixture_type: 'competition',
    });
  });

  test('materializeConfirmedFixtures skips scheduled-only rows', async () => {
    stageClient.entities.CompetitionFixture.filter
      .mockResolvedValueOnce([{ id: 'open-1', scheduling_status: 'open', status: 'scheduled' }])
      .mockResolvedValueOnce([]);
    stageClient.entities.RegionalLeagueFixture.filter
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const created = await materializeConfirmedFixtures('club-1');
    expect(created).toEqual([]);
    expect(stageClient.functions.invoke).not.toHaveBeenCalled();
  });

  test('loadPendingCompetitionFixtures keeps open and proposed only', async () => {
    stageClient.entities.CompetitionFixture.filter
      .mockResolvedValueOnce([
        { id: 'a', scheduling_status: 'open', home_club_id: 'c1' },
        { id: 'b', scheduling_status: 'confirmed', home_club_id: 'c1' },
      ])
      .mockResolvedValueOnce([
        { id: 'c', scheduling_status: 'away_proposed', away_club_id: 'c1' },
        { id: 'a', scheduling_status: 'open', home_club_id: 'c1' },
      ]);

    const pending = await loadPendingCompetitionFixtures(['c1']);
    expect(pending.map((row) => row.id).sort()).toEqual(['a', 'c']);
    expect(pending.every((row) => row.fixtureType === 'competition')).toBe(true);
  });
});
