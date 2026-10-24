import { normalizeBracketRounds } from '../../lib/bracketRounds';

describe('normalizeBracketRounds', () => {
  test('groups a flat match list by round', () => {
    const rounds = normalizeBracketRounds([
      { id: 'm1', round: 1, type: 'quarter_final', home_club_name: 'A', away_club_name: 'B' },
      { id: 'm2', round: 1, type: 'quarter_final', home_club_name: 'C', away_club_name: 'D' },
      { id: 'm3', round: 2, type: 'semi_final', home_club_name: 'A', away_club_name: 'C' },
    ]);
    expect(rounds).toHaveLength(2);
    expect(rounds[0].round_name).toBe('Quarter-finals');
    expect(rounds[0].matches).toHaveLength(2);
    expect(rounds[1].round_name).toBe('Semi-finals');
  });

  test('keeps pre-grouped rounds and skips null rows', () => {
    const rounds = normalizeBracketRounds([
      null,
      { id: 'r1', round_name: 'Final', matches: [{ id: 'm1', home_player_name: 'P1', away_player_name: 'P2' }] },
    ]);
    expect(rounds).toHaveLength(1);
    expect(rounds[0].id).toBe('r1');
    expect(rounds[0].matches[0].home_player_name).toBe('P1');
  });

  test('returns empty for bad input', () => {
    expect(normalizeBracketRounds(null)).toEqual([]);
    expect(normalizeBracketRounds({})).toEqual([]);
  });
});
