import { normalizeStandingRow, normalizeStandings } from '../../lib/standingsRows';
import { calculateLeagueStandings } from '../../lib/tournamentEngine';

describe('standingsRows', () => {
  test('normalizes tournament engine rows and API rows', () => {
    expect(normalizeStandingRow({ id: '1', name: 'A', P: 2, W: 1, D: 1, L: 0, GF: 3, GA: 1, GD: 2, Pts: 4 })).toMatchObject({
      name: 'A', played: 2, wins: 1, draws: 1, losses: 0, goalsFor: 3, goalsAgainst: 1, goalDiff: 2, points: 4,
    });
    expect(normalizeStandingRow({
      club_id: 'c1', club_name: 'Hooded', played: 1, wins: 1, draws: 0, losses: 0, goals_for: 2, goals_against: 0, points: 3,
    })).toMatchObject({
      id: 'c1', name: 'Hooded', played: 1, points: 3, goalDiff: 2,
    });
  });

  test('filters null rows', () => {
    expect(normalizeStandings([null, { name: 'X', Pts: 1 }])).toHaveLength(1);
  });
});

describe('calculateLeagueStandings', () => {
  test('builds a table from confirmed club matches only', () => {
    const table = calculateLeagueStandings([
      {
        type: 'league', status: 'completed', result_state: 'confirmed',
        home_club_id: 'a', home_club_name: 'Alpha',
        away_club_id: 'b', away_club_name: 'Beta',
        home_score: 2, away_score: 1, winner_club_id: 'a',
      },
      {
        type: 'league', status: 'completed', result_state: 'confirmed',
        home_club_id: 'b', home_club_name: 'Beta',
        away_club_id: 'a', away_club_name: 'Alpha',
        home_score: 0, away_score: 0,
      },
      {
        type: 'league', status: 'completed', result_state: 'pending',
        home_club_id: 'a', home_club_name: 'Alpha',
        away_club_id: 'c', away_club_name: 'Gamma',
        home_score: 5, away_score: 0, winner_club_id: 'a',
      },
    ]);
    expect(table[0].name).toBe('Alpha');
    expect(table[0].Pts).toBe(4);
    expect(table[1].name).toBe('Beta');
    expect(table[1].Pts).toBe(1);
    // Unconfirmed fixtures may seed the roster but must not award points.
    expect(table.find((row) => row.name === 'Gamma')).toMatchObject({ P: 0, Pts: 0 });
  });
});
