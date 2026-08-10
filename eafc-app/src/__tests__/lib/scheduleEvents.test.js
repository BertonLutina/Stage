import {
  buildScheduleEvents,
  buildCalendarDateMap,
  buildMonthGrid,
  toDateKey,
} from '../../lib/scheduleEvents';

describe('buildScheduleEvents', () => {
  const player = { id: 'p1' };
  const club = { id: 'c1', name: 'FC Test' };
  const now = new Date('2026-08-10T12:00:00.000Z');

  test('builds a home Match Event with W/L/D result for completed club match', () => {
    const events = buildScheduleEvents({
      matches: [{
        id: 'm1',
        status: 'completed',
        scheduled_date: '2026-08-01T18:00:00.000Z',
        home_club_id: 'c1',
        away_club_id: 'c2',
        home_club_name: 'FC Test',
        away_club_name: 'Rivals',
        home_score: 3,
        away_score: 1,
        tournament_id: 'ranked',
      }],
      tournaments: [],
      contracts: [],
      player,
      club,
      now,
    });

    expect(events).toEqual([
      expect.objectContaining({
        id: 'm1',
        type: 'match',
        opposition: 'Rivals',
        venue: 'Home',
        venueKey: 'home',
        competition: 'Ranked Match',
        result: { outcome: 'W', myScore: 3, theirScore: 1, display: '3–1' },
      }),
    ]);
  });

  test('adds Contract End and Contract Reminder for near-expiry active contract', () => {
    const events = buildScheduleEvents({
      matches: [],
      tournaments: [],
      contracts: [{
        id: 'ct1',
        status: 'active',
        user_id: 'p1',
        end_date: '2026-08-20T00:00:00.000Z',
        max_games: 20,
        games_played: 15,
        contract_type: 'squad',
      }],
      player,
      club,
      now,
    });

    expect(events.map((e) => e.type).sort()).toEqual(['contract_end', 'contract_reminder']);
    expect(events.find((e) => e.type === 'contract_end')).toEqual(
      expect.objectContaining({
        id: 'contract-end-ct1',
        date: '2026-08-20T00:00:00.000Z',
      }),
    );
    expect(events.find((e) => e.type === 'contract_reminder')).toEqual(
      expect.objectContaining({
        id: 'contract-reminder-ct1',
        gamesLeft: 5,
      }),
    );
  });

  test('adds Tournament Start only when club is registered', () => {
    const events = buildScheduleEvents({
      matches: [],
      tournaments: [{
        id: 't1',
        name: 'Stage Cup',
        start_date: '2026-09-01T16:00:00.000Z',
        registered_clubs: ['c1'],
      }, {
        id: 't2',
        name: 'Other Cup',
        start_date: '2026-09-02T16:00:00.000Z',
        registered_clubs: ['c9'],
      }],
      contracts: [],
      player,
      club,
      now,
    });

    expect(events).toEqual([
      expect.objectContaining({
        id: 'tournament-start-t1',
        type: 'tournament_start',
        competition: 'Stage Cup',
      }),
    ]);
  });

  test('sorts events by date descending', () => {
    const events = buildScheduleEvents({
      matches: [
        {
          id: 'old',
          status: 'scheduled',
          scheduled_date: '2026-07-01T12:00:00.000Z',
          home_club_id: 'c1',
          away_club_id: 'c2',
          home_club_name: 'FC Test',
          away_club_name: 'A',
        },
        {
          id: 'new',
          status: 'scheduled',
          scheduled_date: '2026-08-15T12:00:00.000Z',
          home_club_id: 'c1',
          away_club_id: 'c2',
          home_club_name: 'FC Test',
          away_club_name: 'B',
        },
      ],
      tournaments: [],
      contracts: [],
      player,
      club,
      now,
    });

    expect(events.map((e) => e.id)).toEqual(['new', 'old']);
  });
});

describe('buildCalendarDateMap', () => {
  test('groups events by local date key and skips contract reminders', () => {
    const map = buildCalendarDateMap([
      { id: 'm1', type: 'match', date: '2026-08-10T18:00:00.000Z' },
      { id: 'r1', type: 'contract_reminder', date: '2026-08-10T12:00:00.000Z' },
      { id: 'c1', type: 'contract_end', date: '2026-08-20T00:00:00.000Z' },
    ]);

    expect(map.has(toDateKey(new Date('2026-08-10T18:00:00.000Z')))).toBe(true);
    expect(map.get(toDateKey(new Date('2026-08-10T18:00:00.000Z'))).map((e) => e.id)).toEqual(['m1']);
    expect(map.get(toDateKey(new Date('2026-08-20T00:00:00.000Z'))).map((e) => e.id)).toEqual(['c1']);
  });
});

describe('buildMonthGrid', () => {
  test('returns Monday-start weeks covering August 2026', () => {
    const days = buildMonthGrid(new Date(2026, 7, 1)); // Aug 2026 local
    expect(days[0].getDay()).toBe(1); // Monday
    expect(days.length % 7).toBe(0);
    expect(days.some((d) => d.getFullYear() === 2026 && d.getMonth() === 7 && d.getDate() === 1)).toBe(true);
    expect(days.some((d) => d.getFullYear() === 2026 && d.getMonth() === 7 && d.getDate() === 31)).toBe(true);
  });
});
