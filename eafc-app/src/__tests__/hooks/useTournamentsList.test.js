import { act, renderHook, waitFor } from '@testing-library/react-native';
import useTournamentsList, { bucketTournaments } from '../../hooks/useTournamentsList';
import { resolveMyPlayerAndClub, stageClient } from '../../api/stageClient';

jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(),
  stageClient: {
    entities: {
      Tournament: { list: jest.fn() },
      TrophyItem: { list: jest.fn() },
    },
  },
}));

const identity = {
  user: { id: 'user-1', email: 'owner@stage.test' },
  player: { id: 'player-1', subscription: 'plus' },
  club: { id: 'club-1' },
};

const tournaments = [
  { id: 'open', name: 'Open Cup', status: 'registration', registered_clubs: [] },
  { id: 'mine', name: 'My Cup', status: 'in_progress', registered_clubs: '[{"id":"club-1"}]' },
  { id: 'owned', name: 'Owned Cup', status: 'registration', creator_email: 'owner@stage.test' },
  { id: 'done', name: 'Finished Cup', status: 'completed' },
  { id: 'cancelled', name: 'Cancelled Cup', status: 'cancelled' },
];

describe('useTournamentsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stageClient.entities.Tournament.list.mockResolvedValue(tournaments);
    stageClient.entities.TrophyItem.list.mockResolvedValue([]);
    resolveMyPlayerAndClub.mockResolvedValue(identity);
  });

  test('classifies real tournaments into the three mockup tabs', () => {
    const buckets = bucketTournaments(tournaments, identity);

    expect(buckets.open.map((row) => row.id)).toEqual(['open', 'owned']);
    expect(buckets.my.map((row) => row.id)).toEqual(['mine', 'owned']);
    expect(buckets.finished.map((row) => row.id)).toEqual(['done']);
  });

  test('uses the canonical loading/error/refresh contract', async () => {
    const { result } = renderHook(() => useTournamentsList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.open.map((row) => row.id)).toEqual(['open', 'owned']);
    expect(result.current.my.map((row) => row.id)).toEqual(['mine', 'owned']);
    expect(result.current.finished.map((row) => row.id)).toEqual(['done']);

    stageClient.entities.Tournament.list.mockRejectedValueOnce(new Error('Tournament list unavailable'));
    act(() => {
      result.current.refetch();
    });
    await waitFor(() => expect(result.current.refreshing).toBe(false));

    expect(result.current.error).toBe('Tournament list unavailable');
    expect(result.current.open.map((row) => row.id)).toEqual(['open', 'owned']);
  });
});
