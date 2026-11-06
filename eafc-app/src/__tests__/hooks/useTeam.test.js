import { act, renderHook, waitFor } from '@testing-library/react-native';
import useTeam, { buildTeamView } from '../../hooks/useTeam';
import { loadClubProfile } from '../../lib/clubProfileData';

jest.mock('../../lib/clubProfileData', () => ({ loadClubProfile: jest.fn() }));
jest.mock('../../api/stageClient', () => ({ stageClient: {} }));

const bundle = {
  club: { id: 'c1', name: 'Night Owls', tag: 'NOW', platform: 'PS5', region: 'Europe', created_date: '2025-04-01' },
  players: [{ id: 'p1', gamertag: 'NightOwl', position: 'ST', role: 'captain' }],
  record: { wins: 24, totalGames: 30 },
  trophies: [{ id: 't1' }, { id: 't2' }],
};

describe('useTeam', () => {
  beforeEach(() => { jest.clearAllMocks(); loadClubProfile.mockResolvedValue(bundle); });

  test('derives the mockup summary only from loaded club data', () => {
    expect(buildTeamView(bundle)).toEqual(expect.objectContaining({
      name: 'Night Owls', foundedYear: 2025, playerCount: 1, trophyCount: 2, wins: 24,
    }));
  });

  test('uses the canonical loading/error/refresh contract', async () => {
    const { result } = renderHook(() => useTeam('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.name).toBe('Night Owls');

    loadClubProfile.mockRejectedValueOnce(new Error('Team unavailable'));
    act(() => { result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBe('Team unavailable'));
    expect(result.current.data.name).toBe('Night Owls');
  });
});
