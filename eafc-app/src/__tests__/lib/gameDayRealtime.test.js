import {
  isGameDayMatchSocketPayload,
  resolveGameDayMatchEvent,
  sameRecordId,
} from '../../lib/gameDayRealtime';

describe('gameDayRealtime', () => {
  it('compares match ids as strings', () => {
    expect(sameRecordId(12, '12')).toBe(true);
    expect(sameRecordId('m1', 'm2')).toBe(false);
  });

  it('ignores match-stat payloads on the match channel', () => {
    expect(isGameDayMatchSocketPayload({
      _entity: 'MatchPlayerStat',
      id: 'stat-1',
      match_id: 'm1',
      player_id: 'p1',
      goals: 2,
    })).toBe(false);
  });

  it('accepts kickoff and full-time match payloads', () => {
    expect(isGameDayMatchSocketPayload({ id: 'm1', status: 'in_progress' })).toBe(true);
    expect(isGameDayMatchSocketPayload({
      id: 'm1',
      status: 'awaiting_confirmation',
      result_home_submitted: 1,
    })).toBe(true);
  });

  it('resolves only events for the open match', () => {
    expect(resolveGameDayMatchEvent({
      type: 'update',
      data: { id: 'm1', status: 'in_progress' },
    }, 'm1')?.type).toBe('update');
    expect(resolveGameDayMatchEvent({
      type: 'update',
      data: { id: 'm2', status: 'in_progress' },
    }, 'm1')).toBeNull();
    expect(resolveGameDayMatchEvent({
      type: 'delete',
      id: 'm1',
    }, 'm1')?.type).toBe('delete');
  });
});
