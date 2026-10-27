import { scheduleResult } from '../../lib/scheduleResult';

describe('scheduleResult', () => {
  test('returns null for unconfirmed matches', () => {
    expect(scheduleResult({
      status: 'completed',
      result_state: 'AWAITING_AWAY_CONFIRMATION',
      home_score: 2,
      away_score: 1,
      home_club_id: 'c1',
    }, { id: 'c1' }, null)).toBeNull();
  });

  test('uses penalty winner when scores are level', () => {
    expect(scheduleResult({
      status: 'completed',
      result_state: 'confirmed',
      home_score: 1,
      away_score: 1,
      decided_on_penalties: 1,
      penalty_winner_side: 'away',
      home_club_id: 'c1',
      away_club_id: 'c2',
    }, { id: 'c1' }, null)).toEqual({
      outcome: 'L',
      myScore: 1,
      theirScore: 1,
      display: '1–1',
    });
  });
});
