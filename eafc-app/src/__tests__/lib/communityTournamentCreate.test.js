import {
  applyTournamentFormat,
  calculateTournamentPrizeBreakdown,
  getDefaultTournamentMaxTeams,
  normalizeTournamentMaxTeams,
  TOURNAMENT_CREDIT_COST,
} from '../../lib/tournamentRules';
import {
  assertCanCreateCommunityTournament,
  buildCommunityTournamentPayload,
  canCreateCommunityTournament,
} from '../../lib/communityTournamentCreate';

describe('tournamentRules (web parity)', () => {
  test('create cost is 50 credits', () => {
    expect(TOURNAMENT_CREDIT_COST).toBe(50);
  });

  test('normalizes max teams onto the format allow-list', () => {
    expect(normalizeTournamentMaxTeams('knockout', 16)).toBe(16);
    expect(normalizeTournamentMaxTeams('knockout', 12)).toBe(8);
    expect(getDefaultTournamentMaxTeams('league')).toBe(20);
    expect(applyTournamentFormat({ name: 'Cup' }, 'group_stage').max_teams).toBe('16');
  });

  test('splits the prize pool 70/20/10', () => {
    expect(calculateTournamentPrizeBreakdown(1000, 8)).toEqual({
      entryFee: 1000,
      pool: 8000,
      winner: 5600,
      runnerUp: 1600,
      thirdPlace: 800,
      participation: 0,
    });
  });
});

describe('community tournament create payload', () => {
  test('gates create on STAGE Plus expiry, except admins', () => {
    expect(canCreateCommunityTournament({
      player: { subscription: 'stage_plus', subscription_expires_at: '2020-01-01' },
    })).toBe(false);
    expect(canCreateCommunityTournament({
      player: { subscription: 'stage_plus', subscription_expires_at: '2099-01-01' },
    })).toBe(true);
    expect(canCreateCommunityTournament({ user: { role: 'admin' } })).toBe(true);
    expect(() => assertCanCreateCommunityTournament({ player: { subscription: 'free' } }))
      .toThrow(/STAGE Plus/);
  });

  test('matches the web Tournament.create body', () => {
    const payload = buildCommunityTournamentPayload({
      form: {
        name: 'Night Cup',
        type: 'knockout',
        max_teams: '16',
        entry_fee_stc: '1000',
        start_date: '2026-09-01T21:00',
        participant_type: 'club',
        platform: 'PlayStation',
        region: 'Europe',
      },
      user: { email: 'me@stage.com' },
      player: { id: 'p1', gamertag: 'Neo' },
    });
    expect(payload).toEqual(expect.objectContaining({
      name: 'Night Cup',
      max_teams: 16,
      entry_credits: 50,
      entry_fee_stc: 1000,
      prize_pool_stc: 16000,
      prize_winner_stc: 11200,
      prize_runner_up_stc: 3200,
      prize_semi_final_stc: 1600,
      creator_email: 'me@stage.com',
      creator_id: 'p1',
      creator_gamertag: 'Neo',
      start_date: '2026-09-01 21:00:00',
      status: 'registration',
      registered_clubs: [],
    }));
  });
});
