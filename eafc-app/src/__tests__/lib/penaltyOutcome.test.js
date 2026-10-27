import { penaltyOutcome, isOfficialDisplayResult } from '../../lib/penaltyOutcome';

describe('penaltyOutcome', () => {
  test('returns empty when not decided on penalties', () => {
    expect(penaltyOutcome({ status: 'completed', result_state: 'confirmed' })).toBe('');
  });

  test('names the penalty winner for an official result', () => {
    expect(penaltyOutcome({
      status: 'completed',
      result_state: 'confirmed',
      decided_on_penalties: 1,
      penalty_winner_side: 'home',
      home_club_name: 'Alpha FC',
    })).toBe('Alpha FC won on penalties.');
  });

  test('marks proposed outcomes before confirmation', () => {
    expect(penaltyOutcome({
      status: 'awaiting_confirmation',
      decided_on_penalties: 1,
      penalty_winner_side: 'away',
      away_player_name: 'Nova',
    })).toBe('Proposed: Nova won on penalties.');
  });

  test('isOfficialDisplayResult accepts Stage confirmed matches', () => {
    expect(isOfficialDisplayResult({
      status: 'completed',
      result_state: 'confirmed',
    })).toBe(true);
  });
});
