import { parseKickoffDate, toMysqlDateTime } from '../../lib/momentDate';

describe('kickoff wall-clock parsing', () => {
  test('naive MySQL DATETIME is the clock the user picked, not UTC', () => {
    const date = parseKickoffDate('2026-08-30 17:20:00');
    expect(date.getHours()).toBe(17);
    expect(date.getMinutes()).toBe(20);
  });

  test('Brussels offset ISO keeps 17:20 as 15:20 UTC', () => {
    const date = parseKickoffDate('2026-08-30T17:20:00+02:00');
    expect(date.toISOString()).toBe('2026-08-30T15:20:00.000Z');
  });

  test('local Date writes MySQL wall clock without a Z suffix', () => {
    const local = new Date(2026, 7, 30, 17, 20, 0);
    expect(toMysqlDateTime(local)).toBe('2026-08-30 17:20:00');
  });
});
