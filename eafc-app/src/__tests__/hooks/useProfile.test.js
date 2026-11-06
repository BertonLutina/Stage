import { act, renderHook, waitFor } from '@testing-library/react-native';
import useProfile, { buildProfileView } from '../../hooks/useProfile';
import { resolveMyPlayerAndClub, stageClient } from '../../api/stageClient';

jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(),
  stageClient: { http: { get: jest.fn() } },
}));

const identity = {
  user: { id: 'u1', gamer_tag: 'NightOwl' },
  player: { id: 'p1', gamertag: 'NightOwl', position: 'ST', platform: 'PS5', overall_rating: 84 },
  club: { id: 'c1', name: 'Night Owls FC' },
};

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveMyPlayerAndClub.mockResolvedValue(identity);
    stageClient.http.get.mockResolvedValue({
      club_career: { games: 42, goals: 31, assists: 14, avg_rating: 7.8 },
    });
  });

  test('maps the profile summary from real identity and career records', () => {
    expect(buildProfileView({ ...identity, career: { club_career: { games: 42, goals: 31, assists: 14, avg_rating: 7.8 } } })).toEqual(
      expect.objectContaining({
        displayName: 'NightOwl',
        overall: 84,
        club: identity.club,
        stats: { games: 42, goals: 31, assists: 14, rating: 7.8 },
      }),
    );
  });

  test('loads through the canonical async-resource contract and surfaces refresh errors', async () => {
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.stats.games).toBe(42);

    resolveMyPlayerAndClub.mockRejectedValueOnce(new Error('Profile unavailable'));
    act(() => { result.current.refetch(); });
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.error).toBe('Profile unavailable');
    expect(result.current.data.displayName).toBe('NightOwl');
  });
});
