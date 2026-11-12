import { buildFixtureMatchdays } from '../../lib/fixtureMatchdays';

describe('buildFixtureMatchdays', () => {
  test('groups by matchday and sorts buckets chronologically', () => {
    const days = buildFixtureMatchdays([
      { id: 'b', matchday: 2, scheduled_at: '2026-11-10T20:00:00Z', home_club_name: 'A', away_club_name: 'B' },
      { id: 'a', matchday: 1, scheduled_at: '2026-11-03T20:00:00Z', home_club_name: 'C', away_club_name: 'D' },
      { id: 'c', matchday: 1, scheduled_at: '2026-11-03T21:00:00Z', home_club_name: 'E', away_club_name: 'F' },
    ]);
    expect(days).toHaveLength(2);
    expect(days[0].title).toBe('Matchday 1');
    expect(days[0].items.map((item) => item.id)).toEqual(['a', 'c']);
    expect(days[1].title).toBe('Matchday 2');
  });

  test('falls back to calendar days when round fields are missing', () => {
    const days = buildFixtureMatchdays([
      { id: '1', scheduled_at: '2026-11-03T18:00:00Z' },
      { id: '2', scheduled_at: '2026-11-04T18:00:00Z' },
    ]);
    expect(days).toHaveLength(2);
    expect(days[0].items[0].id).toBe('1');
    expect(days[1].items[0].id).toBe('2');
  });
});
