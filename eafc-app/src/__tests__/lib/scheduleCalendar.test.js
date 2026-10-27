import {
  calendarGrid,
  calendarRange,
  groupCalendarEvents,
  identicalKickoffs,
  shiftCalendarMonth,
} from '../../lib/scheduleCalendar';

describe('scheduleCalendar', () => {
  test('builds a Monday-start month grid and range', () => {
    const days = calendarGrid('2026-03');
    expect(days[0]).toBe('2026-02-23');
    expect(days.at(-1)).toBe('2026-04-05');
    expect(calendarRange('2026-03')).toEqual({ from: '2026-02-23', to: '2026-04-06' });
  });

  test('shifts months and groups events by local day', () => {
    expect(shiftCalendarMonth('2026-01', 1)).toBe('2026-02');
    const dates = groupCalendarEvents([
      { id: 'a', startsAt: '2026-03-10T18:00:00Z' },
      { id: 'b', startsAt: '2026-03-10T20:00:00Z' },
    ], 'UTC');
    expect(dates.get('2026-03-10').map((e) => e.id)).toEqual(['a', 'b']);
  });

  test('detects identical kickoffs', () => {
    const conflicts = identicalKickoffs([
      { id: '1', startsAt: '2026-03-10T18:00:00Z' },
      { id: '2', startsAt: '2026-03-10T18:00:00Z' },
      { id: '3', startsAt: '2026-03-10T19:00:00Z' },
    ]);
    expect([...conflicts].sort()).toEqual(['1', '2']);
  });
});
