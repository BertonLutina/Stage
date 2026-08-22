import { isPlayerTournament, registerTournamentClub } from '../../api/tournamentActions';
import { stageClient } from '../../api/stageClient';

jest.mock('../../api/stageClient', () => ({
  stageClient: { http: {}, entities: {}, functions: { invoke: jest.fn() } },
}));

describe('isPlayerTournament', () => {
  test('treats missing or club participant_type as a club tournament', () => {
    expect(isPlayerTournament({ participant_type: 'club' })).toBe(false);
    expect(isPlayerTournament({ participant_type: 'Club' })).toBe(false);
    expect(isPlayerTournament({})).toBe(false);
    expect(isPlayerTournament(null)).toBe(false);
  });

  test('only player tournaments expose player registration', () => {
    expect(isPlayerTournament({ participant_type: 'player' })).toBe(true);
  });
});

describe('registerTournamentClub', () => {
  beforeEach(() => {
    stageClient.functions.invoke.mockReset();
  });

  test('sends the EA FC Pro Clubs name the server requires', async () => {
    stageClient.functions.invoke.mockResolvedValue({ data: { success: true, pending_review: true } });
    await registerTournamentClub('t1', 'c1', { eaClubName: 'The Hooded F.C.' });
    expect(stageClient.functions.invoke).toHaveBeenCalledWith('tournamentRegistration', {
      tournament_id: 't1',
      club_id: 'c1',
      registration_proof_url: null,
      ea_club_name: 'The Hooded F.C.',
    });
  });

  test('surfaces a rejected club registration instead of pretending it worked', async () => {
    stageClient.functions.invoke.mockResolvedValue({
      data: { success: false, error: 'EA FC Pro Clubs name is required for club registration' },
    });
    await expect(registerTournamentClub('t1', 'c1')).rejects.toThrow(
      'EA FC Pro Clubs name is required for club registration',
    );
  });
});
