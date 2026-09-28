import { respondToInboxMessage } from '../../lib/inboxData';

jest.mock('@/api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(async () => ({
    user: { email: 'me@stage.com' },
    player: { id: 'p1', gamertag: 'Me' },
    club: { id: 'c1', name: 'Home FC' },
  })),
  stageClient: {
    functions: { invoke: jest.fn(async () => ({ ok: true })) },
    entities: {
      InboxMessage: { update: jest.fn(async () => ({})) },
    },
  },
}));

jest.mock('@/lib/scheduleEngine', () => ({
  acceptProposal: jest.fn(async () => {}),
  declineProposal: jest.fn(async () => {}),
  proposeTime: jest.fn(async () => {}),
  loadFixtureForInbox: jest.fn(async () => ({
    fixture: { id: 'fx1', home_club_id: 'c1', away_club_id: 'c2' },
    fixtureType: 'competition',
  })),
  roleForClub: jest.fn(() => 'home'),
}));

const { stageClient } = require('@/api/stageClient');
const { acceptProposal, declineProposal } = require('@/lib/scheduleEngine');

describe('respondToInboxMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('tournament_schedule accepted calls respondInboxMessage', async () => {
    await respondToInboxMessage(
      { id: 'm1', message_type: 'tournament_schedule' },
      'accepted',
    );
    expect(stageClient.functions.invoke).toHaveBeenCalledWith(
      'respondInboxMessage',
      expect.objectContaining({ message_id: 'm1', action: 'accepted' }),
    );
  });

  test('match_invite accepted calls respondInboxMessage', async () => {
    await respondToInboxMessage(
      { id: 'm-invite', message_type: 'match_invite' },
      'accepted',
    );
    expect(stageClient.functions.invoke).toHaveBeenCalledWith(
      'respondInboxMessage',
      expect.objectContaining({ message_id: 'm-invite', action: 'accepted' }),
    );
  });

  test('failed contract action does not mark the mail accepted', async () => {
    stageClient.functions.invoke.mockRejectedValue(new Error('window closed'));
    await expect(
      respondToInboxMessage({ id: 'm2', message_type: 'contract_offer' }, 'accepted'),
    ).rejects.toThrow(/window closed/);
    expect(stageClient.entities.InboxMessage.update).not.toHaveBeenCalled();
  });

  test('league_schedule decline calls declineProposal, not status patch alone', async () => {
    await respondToInboxMessage(
      { id: 'm3', message_type: 'league_schedule', metadata: { fixture_id: 'fx1' } },
      'declined',
    );
    expect(declineProposal).toHaveBeenCalled();
    expect(stageClient.entities.InboxMessage.update).not.toHaveBeenCalled();
    expect(stageClient.functions.invoke).not.toHaveBeenCalledWith(
      'respondInboxMessage',
      expect.anything(),
    );
  });

  test('league_schedule accept calls acceptProposal', async () => {
    await respondToInboxMessage(
      { id: 'm4', message_type: 'league_schedule', metadata: { fixture_id: 'fx1' } },
      'confirmed',
    );
    expect(acceptProposal).toHaveBeenCalled();
  });
});
