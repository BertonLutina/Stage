require('../setup');
const { mockPool } = require('../mocks/db.mock');
const { generateAccessToken } = require('../../utils/jwt');

const passport = { initialize: () => (req, res, next) => next(), authenticate: () => (req, res, next) => next() };
const createApp = require('../../app');
const app = createApp(passport);
const request = require('supertest');

const USER_ID = 'user-uuid-match-test';
const TOKEN = `Bearer ${generateAccessToken(USER_ID)}`;

const MOCK_MATCH = {
  id: 'match-uuid-1',
  tournament_id: 'tourn-uuid-1',
  home_team_id: 'team-home',
  away_team_id: 'team-away',
  home_team_name: 'Home FC',
  away_team_name: 'Away FC',
  home_score: null,
  away_score: null,
  status: 'scheduled',
  tournament_name: 'Test Cup',
  tournament_format: 'single_elim',
  videos: [],
};

beforeEach(() => jest.clearAllMocks());

describe('GET /matches/:id', () => {
  it('returns match with video array', async () => {
    mockPool.query
      .mockResolvedValueOnce([[MOCK_MATCH]])
      .mockResolvedValueOnce([[]]);

    const res = await request(app).get('/matches/match-uuid-1');
    expect(res.status).toBe(200);
    expect(res.body.data.home_team_name).toBe('Home FC');
    expect(res.body.data.videos).toEqual([]);
  });

  it('returns 404 for unknown match', async () => {
    mockPool.query.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/matches/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('PUT /matches/:id/score', () => {
  it('updates match score', async () => {
    mockPool.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ ...MOCK_MATCH, home_score: 2, away_score: 1, status: 'completed' }]])
      .mockResolvedValueOnce([[]]);

    const res = await request(app)
      .put('/matches/match-uuid-1/score')
      .set('Authorization', TOKEN)
      .send({ home_score: 2, away_score: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.home_score).toBe(2);
    expect(res.body.data.away_score).toBe(1);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).put('/matches/match-uuid-1/score').send({ home_score: 2, away_score: 1 });
    expect(res.status).toBe(401);
  });
});

describe('POST /matches/:id/video', () => {
  it('adds a video link to a match', async () => {
    mockPool.query
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([[MOCK_MATCH]])
      .mockResolvedValueOnce([[{ id: 'vid-1', video_url: 'https://youtube.com/watch?v=abc', video_source: 'youtube', uploader: 'TestPlayer' }]]);

    const res = await request(app)
      .post('/matches/match-uuid-1/video')
      .set('Authorization', TOKEN)
      .send({ video_url: 'https://youtube.com/watch?v=abc', video_source: 'youtube' });

    expect(res.status).toBe(200);
    expect(res.body.data.videos).toHaveLength(1);
    expect(res.body.data.videos[0].video_source).toBe('youtube');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/matches/match-uuid-1/video').send({ video_url: 'https://test.com' });
    expect(res.status).toBe(401);
  });
});

describe('GET /matches/fixtures', () => {
  it('returns fixture list', async () => {
    const fixtures = [
      { ...MOCK_MATCH, status: 'scheduled' },
      { ...MOCK_MATCH, id: 'match-uuid-2', status: 'completed', home_score: 3, away_score: 0 },
    ];
    mockPool.query.mockResolvedValueOnce([fixtures]);

    const res = await request(app).get('/matches/fixtures');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it('filters by tournament_id and status', async () => {
    mockPool.query.mockResolvedValueOnce([[MOCK_MATCH]]);

    const res = await request(app).get('/matches/fixtures?tournament_id=tourn-uuid-1&status=scheduled');
    expect(res.status).toBe(200);

    const queryCall = mockPool.query.mock.calls[0];
    expect(queryCall[1]).toContain('tourn-uuid-1');
    expect(queryCall[1]).toContain('scheduled');
  });
});
