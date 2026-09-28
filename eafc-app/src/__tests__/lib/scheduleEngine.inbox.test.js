import { proposeTime, acceptProposal, declineProposal } from '../../lib/scheduleEngine';

jest.mock('@/api/stageClient', () => ({
  stageClient: {
    functions: { invoke: jest.fn(async () => ({ ok: true })) },
    entities: {
      Player: { filter: jest.fn(async () => [{ email: 'mgr@club.com', club_roles: ['president'] }]) },
      CompetitionFixture: { update: jest.fn(async () => ({})) },
      RegionalLeagueFixture: { update: jest.fn(async () => ({})) },
    },
  },
}));

jest.mock('@/lib/gameDayIntegration', () => ({
  createMatchFromFixture: jest.fn(async () => ({ id: 'match-1' })),
}));

jest.mock('@/lib/inboxEventId', () => ({
  createInboxEventId: jest.fn(() => 'evt-test-1'),
}));

const { stageClient } = require('@/api/stageClient');
const { createMatchFromFixture } = require('@/lib/gameDayIntegration');
const { createInboxEventId } = require('@/lib/inboxEventId');

const fixture = {
  id: 'fx1',
  home_club_id: 'c1',
  home_club_name: 'Home',
  away_club_id: 'c2',
  away_club_name: 'Away',
  home_proposed_date: '2026-09-20 21:00:00',
  away_proposed_date: '2026-09-21 21:00:00',
  proposal_count: 0,
};

describe('scheduleEngine inbox sends', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createInboxEventId.mockImplementation(() => `evt-${Math.random().toString(16).slice(2)}`);
  });

  test('proposeTime sends event_id and fixture related_entity_id', async () => {
    await proposeTime({
      fixture,
      fixtureType: 'competition',
      role: 'home',
      proposedDate: '2026-09-20 21:00:00',
      myClub: { id: 'c1', name: 'Home', logo_url: null },
      myEmail: 'me@stage.com',
      myGamertag: 'Me',
    });

    expect(stageClient.functions.invoke).toHaveBeenCalledWith(
      'sendInboxMessage',
      expect.objectContaining({
        message_type: 'league_schedule',
        event_id: expect.any(String),
        related_entity_id: 'fx1',
      }),
    );
  });

  test('acceptProposal notifies with a new event_id and confirmed scheduling_status', async () => {
    await acceptProposal({
      fixture,
      fixtureType: 'competition',
      role: 'home',
      myClub: { id: 'c1', name: 'Home' },
      myEmail: 'me@stage.com',
    });

    expect(createMatchFromFixture).toHaveBeenCalledWith(
      expect.objectContaining({ scheduling_status: 'confirmed' }),
      'competition',
    );
    expect(stageClient.functions.invoke).toHaveBeenCalledWith(
      'sendInboxMessage',
      expect.objectContaining({
        message_type: 'league_schedule',
        status: 'confirmed',
        event_id: expect.any(String),
      }),
    );
  });

  test('declineProposal updates fixture and notifies with event_id', async () => {
    await declineProposal({
      fixture,
      fixtureType: 'competition',
      role: 'home',
      myClub: { id: 'c1', name: 'Home' },
      myEmail: 'me@stage.com',
    });

    expect(stageClient.entities.CompetitionFixture.update).toHaveBeenCalledWith(
      'fx1',
      expect.objectContaining({ scheduling_status: 'awaiting' }),
    );
    expect(stageClient.functions.invoke).toHaveBeenCalledWith(
      'sendInboxMessage',
      expect.objectContaining({
        message_type: 'league_schedule',
        status: 'declined',
        event_id: expect.any(String),
      }),
    );
  });

  test('two proposeTime calls use distinct event_ids', async () => {
    await proposeTime({
      fixture,
      fixtureType: 'competition',
      role: 'home',
      proposedDate: '2026-09-20 21:00:00',
      myClub: { id: 'c1', name: 'Home' },
      myEmail: 'me@stage.com',
    });
    await proposeTime({
      fixture,
      fixtureType: 'competition',
      role: 'home',
      proposedDate: '2026-09-22 21:00:00',
      myClub: { id: 'c1', name: 'Home' },
      myEmail: 'me@stage.com',
    });

    const ids = stageClient.functions.invoke.mock.calls
      .filter((c) => c[0] === 'sendInboxMessage')
      .map((c) => c[1].event_id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
