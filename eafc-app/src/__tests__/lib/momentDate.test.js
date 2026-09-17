import {
  formatKickoffClock,
  formatKickoffInZone,
  parseKickoffDate,
  toMysqlDateTime,
  wallClockToOffsetIso,
} from '../../lib/momentDate';

describe('kickoff wall clock uses the user timezone', () => {
  test('Belgium 17:20 in August is +02:00, not UTC Z', () => {
    expect(wallClockToOffsetIso('2026-08-30 17:20:00', 'Europe/Brussels')).toBe(
      '2026-08-30T17:20:00+02:00',
    );
    expect(parseKickoffDate('2026-08-30 17:20:00', 'Europe/Brussels').toISOString()).toBe(
      '2026-08-30T15:20:00.000Z',
    );
  });

  test('London viewer sees Brussels 17:20 as 16:20', () => {
    expect(formatKickoffClock('2026-08-30 17:20:00', {
      sourceTimeZone: 'Europe/Brussels',
      displayTimeZone: 'Europe/London',
    })).toBe('16:20');
    expect(formatKickoffInZone('2026-08-30 17:20:00', {
      sourceTimeZone: 'Europe/Brussels',
      displayTimeZone: 'Europe/Brussels',
    })).toMatch(/17:20/);
  });

  test('naive picker digits stay as MySQL DATETIME', () => {
    expect(toMysqlDateTime('2026-08-30T17:20')).toBe('2026-08-30 17:20:00');
  });
});
