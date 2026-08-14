import { isPlayerTournament } from '../../api/tournamentActions';

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
