import { lastResults, outcomeOf } from '../../lib/clubForm';

const CLUB = 'c1';
const m = (id, home, away, hs, as, date, extra = {}) => ({
  id, status: 'completed', home_club_id: home, away_club_id: away, home_score: hs, away_score: as,
  home_club_name: home === CLUB ? 'Red Foxes' : `Club ${home}`,
  away_club_name: away === CLUB ? 'Red Foxes' : `Club ${away}`,
  scheduled_date: date, ...extra,
});

describe('outcomeOf', () => {
  test('win, draw, loss from the club point of view', () => {
    expect(outcomeOf(3, 1)).toBe('W');
    expect(outcomeOf(2, 2)).toBe('D');
    expect(outcomeOf(0, 1)).toBe('L');
  });
});

describe('lastResults', () => {
  test('reads home and away matches from the club side, newest first', () => {
    const rows = lastResults([
      m('a', 'c1', 'x', 1, 3, '2026-01-01T10:00:00Z'),
      m('b', 'y', 'c1', 2, 2, '2026-01-03T10:00:00Z'),
      m('c', 'c1', 'z', 4, 0, '2026-01-02T10:00:00Z'),
    ], CLUB);
    expect(rows.map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(rows[0]).toMatchObject({ home: false, opponent: 'Club y', mine: 2, theirs: 2, outcome: 'D' });
    expect(rows[1]).toMatchObject({ home: true, opponent: 'Club z', mine: 4, theirs: 0, outcome: 'W' });
    expect(rows[2]).toMatchObject({ home: true, opponent: 'Club x', mine: 1, theirs: 3, outcome: 'L' });
  });

  test('ignores matches that are not completed or have no score, and other clubs', () => {
    const rows = lastResults([
      m('a', 'c1', 'x', 1, 0, '2026-01-01', { status: 'scheduled' }),
      m('b', 'c1', 'x', null, null, '2026-01-02'),
      m('c', 'p', 'q', 1, 0, '2026-01-03'),
      m('d', 'c1', 'x', 0, 0, '2026-01-04'),
    ], CLUB);
    expect(rows.map((r) => r.id)).toEqual(['d']);
  });

  test('limits to the requested count and keeps null for a missing opponent name or competition', () => {
    const many = Array.from({ length: 8 }, (_, i) => m(`m${i}`, 'c1', 'x', 1, 0, `2026-01-0${i + 1}`));
    expect(lastResults(many, CLUB, 5)).toHaveLength(5);
    const [row] = lastResults([m('n', 'c1', 'x', 1, 0, '2026-01-01', { away_club_name: null })], CLUB);
    expect(row.opponent).toBeNull();
    expect(row.competition).toBeNull();
  });

  test('carries the competition name when the match has one', () => {
    const [row] = lastResults([m('n', 'c1', 'x', 1, 0, '2026-01-01', { competition_name: 'Euro Pro League' })], CLUB);
    expect(row.competition).toBe('Euro Pro League');
  });

  test('garbage input gives an empty list', () => {
    expect(lastResults(null, CLUB)).toEqual([]);
    expect(lastResults([null, 3, 'x'], CLUB)).toEqual([]);
    expect(lastResults([m('a', 'c1', 'x', 1, 0, '2026-01-01')], null)).toEqual([]);
  });
});
