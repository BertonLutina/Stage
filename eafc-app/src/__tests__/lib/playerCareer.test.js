import {
  CAREER_LABELS,
  careerNumber,
  careerScoreFor,
  careerTileRows,
  clubCareerTiles,
  formatCareerFee,
  formatCareerRating,
  mapCareerHistoryRow,
  playerCareerTiles,
  recentCareerHistory,
} from '../../lib/playerCareer';

const clubCareer = {
  games: 1,
  goals: 2,
  assists: 1,
  avg_rating: 8.4,
  wins: 1,
  draws: 0,
  losses: 0,
  motm: 1,
  trophies_won: 2,
  ranking_points: 425,
  history: [{
    match_id: 'club-match-1',
    source_label: 'Arranged Game',
    result: 'W',
    goals: 2,
    assists: 1,
    rating: 8.4,
    is_motm: true,
    score: '3-1',
    played_at: '2026-08-01 18:00:00',
  }],
};

const playerCareer = {
  games: 1,
  goals_for: 4,
  goals_against: 2,
  wins: 1,
  draws: 0,
  losses: 0,
  trophies_won: 0,
  history: [{
    match_id: 'solo-match-1',
    source_label: 'Arranged Game',
    result: 'W',
    opponent_name: 'Away Player',
    goals_for: 4,
    goals_against: 2,
    score: '4-2',
    played_at: '2026-08-02 18:00:00',
  }],
};

describe('player career (web Profile Career tab parity)', () => {
  test('formats the same club and player tiles the web Career tab shows', () => {
    expect(clubCareerTiles(clubCareer)).toEqual([
      { label: CAREER_LABELS.games, value: 1, accent: 'cyan' },
      { label: CAREER_LABELS.goals, value: 2, accent: 'gold' },
      { label: CAREER_LABELS.assists, value: 1, accent: 'sky' },
      { label: CAREER_LABELS.avgRating, value: '8.4', accent: 'violet' },
      { label: CAREER_LABELS.wins, value: 1, accent: 'green' },
      { label: CAREER_LABELS.draws, value: 0, accent: 'gold' },
      { label: CAREER_LABELS.losses, value: 0, accent: 'rose' },
      { label: CAREER_LABELS.motm, value: 1, accent: 'gold' },
      { label: CAREER_LABELS.trophiesWon, value: 2, accent: 'gold' },
      { label: CAREER_LABELS.rankingPoints, value: 425, accent: 'violet' },
    ]);
    expect(playerCareerTiles(playerCareer)).toEqual([
      { label: CAREER_LABELS.games, value: 1, accent: 'cyan' },
      { label: CAREER_LABELS.goalsFor, value: 4, accent: 'gold' },
      { label: CAREER_LABELS.goalsAgainst, value: 2, accent: 'rose' },
      { label: CAREER_LABELS.wins, value: 1, accent: 'green' },
      { label: CAREER_LABELS.draws, value: 0, accent: 'gold' },
      { label: CAREER_LABELS.losses, value: 0, accent: 'rose' },
      { label: CAREER_LABELS.trophiesWon, value: 0, accent: 'gold' },
    ]);
    expect(careerTileRows(clubCareerTiles(clubCareer))).toHaveLength(5);
    expect(careerTileRows(playerCareerTiles(playerCareer)).at(-1)).toHaveLength(1);
  });

  test('maps club and solo history rows the same way as web', () => {
    expect(mapCareerHistoryRow(clubCareer.history[0])).toEqual(expect.objectContaining({
      outcome: 'W',
      title: '2 goals · 1 assists · 8.4 rating',
      score: '3-1',
    }));
    expect(mapCareerHistoryRow(playerCareer.history[0], { playerCareer: true })).toEqual(expect.objectContaining({
      outcome: 'W',
      title: 'vs Away Player',
      score: '4-2',
    }));
  });

  test('keeps the latest five history rows and web fee labels', () => {
    const history = Array.from({ length: 7 }, (_, i) => ({ match_id: `m-${i}`, result: 'D', score: '1-1' }));
    expect(recentCareerHistory(history)).toHaveLength(5);
    expect(formatCareerFee(45_000_000)).toBe('45M STC');
    expect(formatCareerFee(0)).toBe('Undisclosed');
    expect(formatCareerRating(0)).toBe('-');
    expect(careerNumber('x')).toBe(0);
    expect(careerScoreFor({ home_score: 2, away_score: 1 })).toBe('2-1');
  });
});
