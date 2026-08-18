/** Same `/player-careers/:id` payload the web profile Career tab uses. */

export const CAREER_LABELS = {
  clubTitle: 'My Club Career',
  playerTitle: 'My Player Career',
  games: 'Games',
  goals: 'Goals',
  assists: 'Assists',
  avgRating: 'Avg Rating',
  wins: 'Wins',
  draws: 'Draws',
  losses: 'Losses',
  motm: 'MOTM',
  trophiesWon: 'Trophies Won',
  rankingPoints: 'Ranking Points',
  goalsFor: 'Goals For',
  goalsAgainst: 'Goals Against',
  recentMatches: 'Recent matches',
  opponent: 'Opponent',
  match: 'Match',
  unavailable: 'Career data unavailable',
  loading: 'Loading career...',
  transferHistory: 'Transfer History',
};

export function careerNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCareerRating(value) {
  const rating = careerNumber(value);
  if (rating <= 0) return '-';
  return rating.toFixed(2).replace(/0$/, '').replace(/\.$/, '');
}

export function formatCareerDate(row) {
  const date = row?.played_at || row?.scheduled_date || row?.updated_date || row?.created_date;
  if (!date || Number.isNaN(new Date(date).getTime())) return '';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function careerScoreFor(row) {
  if (row?.score) return row.score;
  if (row?.goals_for != null || row?.goals_against != null) {
    return `${careerNumber(row.goals_for)}-${careerNumber(row.goals_against)}`;
  }
  if (row?.home_score != null || row?.away_score != null) {
    return `${careerNumber(row.home_score)}-${careerNumber(row.away_score)}`;
  }
  return '-';
}

export function formatCareerFee(amount, currency = 'STC') {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return 'Undisclosed';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M ${currency}`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K ${currency}`;
  return `${value.toLocaleString()} ${currency}`;
}

export function clubCareerTiles(club = {}) {
  return [
    { label: CAREER_LABELS.games, value: careerNumber(club.games), accent: 'cyan' },
    { label: CAREER_LABELS.goals, value: careerNumber(club.goals), accent: 'gold' },
    { label: CAREER_LABELS.assists, value: careerNumber(club.assists), accent: 'sky' },
    { label: CAREER_LABELS.avgRating, value: formatCareerRating(club.avg_rating), accent: 'violet' },
    { label: CAREER_LABELS.wins, value: careerNumber(club.wins), accent: 'green' },
    { label: CAREER_LABELS.draws, value: careerNumber(club.draws), accent: 'gold' },
    { label: CAREER_LABELS.losses, value: careerNumber(club.losses), accent: 'rose' },
    { label: CAREER_LABELS.motm, value: careerNumber(club.motm), accent: 'gold' },
    { label: CAREER_LABELS.trophiesWon, value: careerNumber(club.trophies_won), accent: 'gold' },
    { label: CAREER_LABELS.rankingPoints, value: careerNumber(club.ranking_points), accent: 'violet' },
  ];
}

export function playerCareerTiles(player = {}) {
  return [
    { label: CAREER_LABELS.games, value: careerNumber(player.games), accent: 'cyan' },
    { label: CAREER_LABELS.goalsFor, value: careerNumber(player.goals_for), accent: 'gold' },
    { label: CAREER_LABELS.goalsAgainst, value: careerNumber(player.goals_against), accent: 'rose' },
    { label: CAREER_LABELS.wins, value: careerNumber(player.wins), accent: 'green' },
    { label: CAREER_LABELS.draws, value: careerNumber(player.draws), accent: 'gold' },
    { label: CAREER_LABELS.losses, value: careerNumber(player.losses), accent: 'rose' },
    { label: CAREER_LABELS.trophiesWon, value: careerNumber(player.trophies_won), accent: 'gold' },
  ];
}

export function careerTileRows(tiles = []) {
  const rows = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));
  return rows;
}

export function mapCareerHistoryRow(row, { playerCareer = false } = {}) {
  const outcome = String(row?.result || '').toUpperCase();
  const opponent = row?.opponent_name || row?.opponent || row?.opponent_club_name || CAREER_LABELS.opponent;
  const source = row?.source_label || row?.competition_name || row?.competition || CAREER_LABELS.match;
  const detail = playerCareer
    ? `vs ${opponent}`
    : [
      row?.goals != null ? `${careerNumber(row.goals)} goals` : null,
      row?.assists != null ? `${careerNumber(row.assists)} assists` : null,
      row?.rating != null ? `${formatCareerRating(row.rating)} rating` : null,
    ].filter(Boolean).join(' · ');

  return {
    key: String(row?.match_id || row?.id || `${source}-${opponent}`),
    outcome: ['W', 'D', 'L'].includes(outcome) ? outcome : '',
    title: detail || source,
    meta: [source, formatCareerDate(row)].filter(Boolean).join(' · '),
    score: careerScoreFor(row),
  };
}

export function recentCareerHistory(history, { playerCareer = false } = {}) {
  return (Array.isArray(history) ? history : []).slice(0, 5).map((row, index) => ({
    ...mapCareerHistoryRow(row, { playerCareer }),
    key: String(row?.match_id || row?.id || index),
  }));
}
