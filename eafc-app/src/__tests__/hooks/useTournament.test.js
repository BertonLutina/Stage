import { act, renderHook, waitFor } from '@testing-library/react-native';
import useTournament, { buildTournamentView } from '../../hooks/useTournament';
import { fetchTournamentMatches, fetchTournamentPublic } from '../../api/tournamentActions';

jest.mock('../../api/tournamentActions', () => ({
  fetchTournamentMatches: jest.fn(),
  fetchTournamentPublic: jest.fn(),
}));

const tournament = {
  id: 'cup-1',
  name: 'Autumn Cup',
  type: 'group_stage',
  participant_type: 'club',
  num_groups: 1,
};

const matches = [
  {
    id: 'm1',
    tournament_id: 'cup-1',
    type: 'group',
    group: 0,
    round: 1,
    status: 'completed',
    result_state: 'confirmed',
    stats_processed: 1,
    home_club_id: 'a',
    home_club_name: 'Night Owls',
    away_club_id: 'b',
    away_club_name: 'Blue Comets',
    home_score: 3,
    away_score: 1,
  },
  {
    id: 'm2',
    tournament_id: 'cup-1',
    type: 'group',
    group: 0,
    round: 2,
    status: 'scheduled',
    home_club_id: 'b',
    home_club_name: 'Blue Comets',
    away_club_id: 'a',
    away_club_name: 'Night Owls',
    scheduled_at: '2030-11-04T21:00:00.000Z',
  },
];

describe('useTournament', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchTournamentPublic.mockResolvedValue(tournament);
    fetchTournamentMatches.mockResolvedValue(matches);
  });

  test('builds every tournament view from the tournament and real match records', () => {
    const view = buildTournamentView(tournament, matches);

    expect(view.tournament.name).toBe('Autumn Cup');
    expect(view.matches).toHaveLength(2);
    expect(view.groups[0].name).toBe('Group A');
    expect(view.groups[0].teams.map((row) => [row.name, row.Pts])).toEqual([
      ['Night Owls', 3],
      ['Blue Comets', 0],
    ]);
    expect(view.groups[0].matches.map((match) => match.id)).toEqual(['m1', 'm2']);
    expect(view.standings.map((row) => row.name)).toEqual(['Night Owls', 'Blue Comets']);
    expect(view.upcoming.map((match) => match.id)).toEqual(['m2']);
    expect(view.completed.map((match) => match.id)).toEqual(['m1']);
  });

  test('loads through the canonical async-resource contract', async () => {
    const { result } = renderHook(() => useTournament('cup-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchTournamentPublic).toHaveBeenCalledWith('cup-1');
    expect(fetchTournamentMatches).toHaveBeenCalledWith('cup-1');
    expect(result.current.data.tournament.name).toBe('Autumn Cup');
    expect(result.current.data.groups[0].teams[0].name).toBe('Night Owls');
  });

  test('surfaces endpoint failures and keeps refresh data on screen', async () => {
    fetchTournamentMatches
      .mockResolvedValueOnce(matches)
      .mockRejectedValueOnce(new Error('Tournament matches unavailable'));
    const { result } = renderHook(() => useTournament('cup-1'));
    await waitFor(() => expect(result.current.data?.matches).toHaveLength(2));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.error).toBe('Tournament matches unavailable');
    expect(result.current.data.matches).toHaveLength(2);
  });
});
