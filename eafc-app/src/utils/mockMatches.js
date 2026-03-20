/**
 * Fake match data for matches tab when API is unavailable or empty.
 */

export const MOCK_MATCHES = [
  {
    id: 'match-1',
    tournament_name: 'Supreme League',
    home_team_name: 'FC Longue Vie',
    away_team_name: 'Milan Club',
    home_score: 2,
    away_score: 1,
    status: 'completed',
    played_at: '2025-01-15T14:00:00Z',
    videos: [
      {
        id: 'vid-1',
        uploader: '@lengarose',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        video_source: 'youtube',
      },
    ],
  },
  {
    id: 'match-2',
    tournament_name: 'Supreme League',
    home_team_name: 'United FC',
    away_team_name: 'LVFC',
    home_score: null,
    away_score: null,
    status: 'scheduled',
    scheduled_at: '2025-01-19T18:00:00Z',
    videos: [],
  },
  {
    id: 'match-3',
    tournament_name: 'Cup Quarter Finals',
    home_team_name: 'Real Madrid',
    away_team_name: 'Barcelona',
    home_score: 3,
    away_score: 2,
    status: 'completed',
    played_at: '2025-01-10T20:00:00Z',
    videos: [
      {
        id: 'vid-2',
        uploader: '@romedns',
        video_url: 'https://www.twitch.tv/videos/123456',
        video_source: 'twitch',
      },
    ],
  },
  {
    id: 'match-4',
    tournament_name: 'Supreme League',
    home_team_name: 'Atletico',
    away_team_name: 'Juventus',
    home_score: null,
    away_score: null,
    status: 'scheduled',
    scheduled_at: '2025-01-22T19:00:00Z',
    videos: [],
  },
  {
    id: 'match-5',
    tournament_name: 'Friendly',
    home_team_name: 'PSG',
    away_team_name: 'Bayern',
    home_score: 1,
    away_score: 1,
    status: 'completed',
    played_at: '2025-01-08T16:00:00Z',
    videos: [],
  },
];

export const getMockMatchById = (id) => MOCK_MATCHES.find((m) => m.id === id || String(m.id) === String(id));
