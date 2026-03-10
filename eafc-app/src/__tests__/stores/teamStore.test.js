import useTeamStore from '../../store/teamStore';

jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from '../../utils/api';

const MOCK_TEAM = {
  id: 'team-uuid-1',
  club_name: 'FC Longue Vie',
  country: 'Belgium',
  owner_id: 'owner-uuid-1',
  wins: 5,
  draws: 2,
  losses: 1,
};

beforeEach(() => {
  useTeamStore.setState({ teams: [], currentTeam: null, loading: false });
  jest.clearAllMocks();
});

describe('teamStore – fetchTeam', () => {
  it('fetches and stores the team', async () => {
    api.get.mockResolvedValueOnce({ data: { data: MOCK_TEAM } });

    await useTeamStore.getState().fetchTeam('team-uuid-1');

    const state = useTeamStore.getState();
    expect(state.currentTeam).toEqual(MOCK_TEAM);
    expect(state.loading).toBe(false);
    expect(api.get).toHaveBeenCalledWith('/teams/team-uuid-1');
  });

  it('handles fetch error gracefully (no crash)', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'));

    await useTeamStore.getState().fetchTeam('bad-id');

    expect(useTeamStore.getState().loading).toBe(false);
    expect(useTeamStore.getState().currentTeam).toBeNull();
  });
});

describe('teamStore – createTeam', () => {
  it('posts FormData and returns the created team', async () => {
    api.post.mockResolvedValueOnce({ data: { data: MOCK_TEAM } });

    const result = await useTeamStore.getState().createTeam({ club_name: 'FC Longue Vie', country: 'Belgium' });

    expect(result).toEqual(MOCK_TEAM);
    expect(api.post).toHaveBeenCalledWith(
      '/teams',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
    );
  });
});

describe('teamStore – saveFormation', () => {
  it('posts formation data and returns the result', async () => {
    const mockFormation = { id: 'form-1', name: '4-3-3', positions: [] };
    api.post.mockResolvedValueOnce({ data: { data: mockFormation } });

    const result = await useTeamStore.getState().saveFormation('team-uuid-1', '4-3-3', []);

    expect(result).toEqual(mockFormation);
    expect(api.post).toHaveBeenCalledWith('/teams/team-uuid-1/formation', { name: '4-3-3', positions: [] });
  });
});
