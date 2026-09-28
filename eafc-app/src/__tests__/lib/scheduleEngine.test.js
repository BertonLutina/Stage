import { acceptProposal, canAcceptProposal, roleForClub } from '../../lib/scheduleEngine';
import { createMatchFromFixture } from '../../lib/gameDayIntegration';
import { stageClient } from '../../api/stageClient';

jest.mock('../../lib/gameDayIntegration', () => ({
  createMatchFromFixture: jest.fn(async () => ({ id: 'match-1' })),
}));

jest.mock('../../api/stageClient', () => ({
  stageClient: {
    entities: {
      CompetitionFixture: { update: jest.fn(async () => ({})) },
      RegionalLeagueFixture: { update: jest.fn(async () => ({})) },
      Player: { filter: jest.fn(async () => []) },
    },
    functions: { invoke: jest.fn(async () => ({})) },
  },
}));

describe('scheduleEngine acceptProposal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('canAcceptProposal only when the opponent proposed', () => {
    expect(canAcceptProposal({
      scheduling_status: 'away_proposed',
      away_proposed_date: '2026-09-01T18:00:00Z',
    }, 'home')).toBe(true);
    expect(canAcceptProposal({
      scheduling_status: 'away_proposed',
      away_proposed_date: '2026-09-01T18:00:00Z',
    }, 'away')).toBe(false);
    expect(canAcceptProposal({ scheduling_status: 'open' }, 'home')).toBe(false);
    expect(roleForClub({ home_club_id: '12', away_club_id: '34' }, 12)).toBe('home');
  });

  test('passes confirmed scheduling_status into createMatchFromFixture', async () => {
    const fixture = {
      id: 'fx-1',
      home_club_id: 'c1',
      away_club_id: 'c2',
      home_club_name: 'Home',
      away_club_name: 'Away',
      home_proposed_date: '2026-09-02T20:00:00.000Z',
      scheduling_status: 'home_proposed',
    };

    await acceptProposal({
      fixture,
      fixtureType: 'regional_league',
      role: 'away',
      myClub: { id: 'c2', name: 'Away' },
      myEmail: 'away@example.test',
    });

    expect(stageClient.entities.RegionalLeagueFixture.update).toHaveBeenCalledWith('fx-1', {
      scheduling_status: 'confirmed',
      confirmed_date: '2026-09-02T20:00:00.000Z',
      scheduled_date: '2026-09-02T20:00:00.000Z',
      status: 'scheduled',
    });
    expect(createMatchFromFixture).toHaveBeenCalledWith({
      ...fixture,
      scheduling_status: 'confirmed',
      confirmed_date: '2026-09-02T20:00:00.000Z',
      scheduled_date: '2026-09-02T20:00:00.000Z',
      status: 'scheduled',
    }, 'regional_league');
  });
});
