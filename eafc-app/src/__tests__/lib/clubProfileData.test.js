import {
  computeClubRecord,
  countryFlag,
  loadClubProfile,
  mapFinanceOverview,
  mapPresidentFromPlayer,
  mapStadiumFromClub,
  mergeHistoryRows,
  mergeTrophyRows,
} from '../../lib/clubProfileData';
import { mergeStaffRolesIntoPlayers } from '../../lib/clubStaffRoles';
import { mergeActiveContractPlayersIntoSquad } from '../../lib/clubSquadContracts';

describe('club profile data (web ClubDetail parity)', () => {
  test('maps the canonical president from the Player row', () => {
    expect(mapPresidentFromPlayer({
      id: 'player-1',
      gamertag: 'Prez',
      avatar_url: '/uploads/p.png',
    }, { id: 'club-1' })).toEqual(expect.objectContaining({
      id: 'player-1',
      player_id: 'player-1',
      display_name: 'Prez',
      profile_path: '/players/player-1',
    }));
  });

  test('computes W-D-L from completed profile matches, not club.wins fields', () => {
    expect(computeClubRecord([
      { status: 'completed', home_club_id: 'club-1', away_club_id: 'club-2', home_score: 3, away_score: 1 },
      { status: 'completed', home_club_id: 'club-2', away_club_id: 'club-1', home_score: 2, away_score: 2 },
      { status: 'completed', home_club_id: 'club-1', away_club_id: 'club-3', home_score: 0, away_score: 1 },
      { status: 'scheduled', home_club_id: 'club-1', away_club_id: 'club-4', home_score: null, away_score: null },
    ], 'club-1')).toEqual({
      wins: 1,
      draws: 1,
      losses: 1,
      totalGames: 3,
      winRate: 33,
    });
  });

  test('merges competition and league history newest season first', () => {
    const rows = mergeHistoryRows(
      [{ competition_name: 'Cup', season_number: 1, wins: 2, draws: 0, losses: 1, points: 6, final_position: 3 }],
      [{ league_name: 'D1', season_number: 2, wins: 8, draws: 2, losses: 4, points: 26, position: 1 }],
    );
    expect(rows[0].name).toBe('D1');
    expect(rows[0].season).toBe(2);
    expect(rows[1].name).toBe('Cup');
  });

  test('country flags come from ISO country codes', () => {
    expect(countryFlag('BE')).toBe('🇧🇪');
    expect(countryFlag('')).toBe('');
  });

  test('staff roles and active contracts join the squad like web', () => {
    const withStaff = mergeStaffRolesIntoPlayers(
      [{ id: 'player-1', role: 'member', club_roles: [] }],
      [{ player_id: 'player-1', role: 'vice_captain' }],
    );
    expect(withStaff[0].role).toBe('vice_captain');

    const merged = mergeActiveContractPlayersIntoSquad(
      [{ id: 'player-existing', gamertag: 'Here', club_id: 'club-1' }],
      [{ id: 'c1', user_id: 'player-cp', team_id: 'club-1', status: 'active', contract_type: 'star' }],
      [{ id: 'player-cp', gamertag: 'CP', club_id: null, role: 'free_agent' }],
      'club-1',
    );
    expect(merged.map((p) => p.id).sort()).toEqual(['player-cp', 'player-existing']);
  });

  test('loadClubProfile fetches club, president player, squad, matches, posts, and history', async () => {
    const calls = [];
    const client = {
      entities: {
        Club: { get: async (id) => { calls.push(['Club.get', id]); return { id, name: 'FC Zaire', president_player_id: 'prez-1', country_code: 'CD' }; } },
        Player: {
          get: async (id) => { calls.push(['Player.get', id]); return { id, gamertag: 'Prez', avatar_url: '/a.png' }; },
          filter: async (q) => { calls.push(['Player.filter', q]); return [{ id: 'p1', gamertag: 'Striker', club_id: q.club_id }]; },
        },
        ClubStaffRole: { filter: async (q) => { calls.push(['ClubStaffRole.filter', q]); return []; } },
        PlayerContract: { filter: async (q) => { calls.push(['PlayerContract.filter', q]); return []; } },
        President: { get: async () => null, filter: async () => [] },
        Post: { filter: async (q) => { calls.push(['Post.filter', q]); return [{ id: 'post-1', content: 'Hello', club_id: q.club_id }]; } },
        ClubAchievement: { filter: async () => [] },
        ChatMessage: { filter: async () => [] },
        CompetitionStanding: { filter: async () => [{ competition_name: 'Cup', season_number: 1, wins: 1, draws: 0, losses: 0, points: 3 }] },
        RegionalLeagueStanding: { filter: async () => [] },
      },
      profileMatches: {
        list: async (filters) => {
          calls.push(['profileMatches.list', filters]);
          if (filters.status === 'completed' && filters.home_club_id) {
            return [{ id: 'm1', status: 'completed', home_club_id: filters.home_club_id, away_club_id: 'x', home_score: 2, away_score: 0 }];
          }
          return [];
        },
      },
    };

    const bundle = await loadClubProfile('club-1', client);

    expect(bundle.club.name).toBe('FC Zaire');
    expect(bundle.president.display_name).toBe('Prez');
    expect(bundle.players[0].gamertag).toBe('Striker');
    expect(bundle.posts[0].id).toBe('post-1');
    expect(bundle.record).toEqual({ wins: 1, draws: 0, losses: 0, totalGames: 1, winRate: 100 });
    expect(bundle.historyRows[0].name).toBe('Cup');
    expect(calls.some(([name]) => name === 'Club.get')).toBe(true);
    expect(calls.some(([name]) => name === 'PlayerContract.filter')).toBe(true);
    expect(calls.some(([name]) => name === 'profileMatches.list')).toBe(true);
    expect(calls.some(([name]) => name === 'Post.filter')).toBe(true);
  });

  test('stadium comes from club stadium fields, not a mock venue', () => {
    expect(mapStadiumFromClub({
      stadium_level: 2,
      stadium_capacity: 45000,
      stadium_name: 'Stade des Martyrs',
    })).toEqual({
      level: 2,
      name: 'Stade des Martyrs',
      capacity: 45000,
      ticket_price_stc: 130,
    });
  });

  test('finance overview falls back to club STC columns when the function is empty', () => {
    expect(mapFinanceOverview({}, {
      stc: 250000,
      transfer_budget_stc: 1000000,
      wage_budget_stc: 80000,
    })).toEqual(expect.objectContaining({
      balance: 250000,
      transfer_budget: 1000000,
      wage_budget: 80000,
      transactions: [],
    }));
  });

  test('trophy cabinet placements merge with club achievements', () => {
    const rows = mergeTrophyRows(
      [{ id: 'a1', title: 'Division 1', season: 'S2' }],
      [{ id: 'p1', trophy_name: 'Cup Winners', competition_name: 'National Cup' }],
    );
    expect(rows.map((row) => row.title)).toEqual(['Cup Winners', 'Division 1']);
  });

  test('loadClubProfile fetches office tables from Stage, not mock copy', async () => {
    const calls = [];
    const client = {
      entities: {
        Club: {
          get: async (id) => ({
            id,
            name: 'FC Zaire',
            president_player_id: 'prez-1',
            stadium_level: 1,
            stadium_capacity: 20000,
            stc: 50000,
          }),
        },
        Player: {
          get: async (id) => ({ id, gamertag: 'Prez' }),
          filter: async () => [{ id: 'p1', gamertag: 'Striker' }],
        },
        ClubStaffRole: { filter: async () => [{ id: 's1', player_id: 'p1', role: 'captain', player_gamertag: 'Striker' }] },
        PlayerContract: {
          filter: async (q) => {
            calls.push(['PlayerContract.filter', q]);
            return [{ id: 'c1', team_id: q.team_id, user_id: 'p1', status: 'active', contract_type: 'star', weekly_salary_stc: 12000, player_gamertag: 'Striker' }];
          },
        },
        President: { get: async () => null, filter: async () => [] },
        Post: { filter: async () => [] },
        ClubAchievement: { filter: async () => [{ id: 'a1', title: 'Promoted' }] },
        TrophyPlacement: { filter: async (q) => { calls.push(['TrophyPlacement.filter', q]); return [{ id: 'tp1', trophy_name: 'League Cup', owner_id: q.owner_id }]; } },
        ChatMessage: { filter: async () => [] },
        CompetitionStanding: { filter: async () => [] },
        RegionalLeagueStanding: { filter: async () => [] },
        ClubApplicant: { filter: async () => [{ id: 'app1', player_gamertag: 'Prospect', status: 'new' }] },
        ClubFixtureAvailability: { filter: async () => [] },
        ClubFixtureLineup: { filter: async () => [{ id: 'lu1', fixture_id: 'fx1', formation: '4-3-3' }] },
        ClubOperationAuditLog: { filter: async () => [{ id: 'log1', action: 'offer_sent' }] },
      },
      profileMatches: { list: async () => [] },
      functions: {
        invoke: async (name, params) => {
          calls.push(['functions.invoke', name, params.action]);
          if (name === 'clubFinance') {
            return { data: { balance: 88000, transfer_budget: 400000, wage_budget: 90000, weekly_wages: 12000, income_30d: 3000, expenses_30d: 1000, transactions: [{ id: 'tx1', description: 'Ticket sales', amount: 3000 }] } };
          }
          if (name === 'shirtSales' && params.action === 'get_leaderboard') {
            return { data: { leaderboard: [{ player_id: 'p1', gamertag: 'Striker', total_shirts: 12, total_revenue: 240 }] } };
          }
          if (name === 'shirtSales') {
            return { data: { total_shirts: 12, total_revenue: 240, matches_with_sales: 2 } };
          }
          return {};
        },
      },
    };

    const bundle = await loadClubProfile('club-1', client);

    expect(calls.some((row) => row[0] === 'PlayerContract.filter' && !row[1].status)).toBe(true);
    expect(bundle.contracts[0].weekly_salary_stc).toBe(12000);
    expect(bundle.applicants[0].player_gamertag).toBe('Prospect');
    expect(bundle.lineups[0].formation).toBe('4-3-3');
    expect(bundle.staffRoles[0].role).toBe('captain');
    expect(bundle.stadium.name).toBe('Pro Stadium');
    expect(bundle.stadium.capacity).toBe(20000);
    expect(bundle.finance.balance).toBe(88000);
    expect(bundle.finance.transactions[0].id).toBe('tx1');
    expect(bundle.shirts.summary.total_shirts).toBe(12);
    expect(bundle.shirts.leaderboard[0].gamertag).toBe('Striker');
    expect(bundle.trophies.map((row) => row.title)).toEqual(['League Cup', 'Promoted']);
    expect(calls.some((row) => row[0] === 'functions.invoke' && row[1] === 'clubFinance')).toBe(true);
    expect(calls.some((row) => row[0] === 'TrophyPlacement.filter')).toBe(true);
  });
});
