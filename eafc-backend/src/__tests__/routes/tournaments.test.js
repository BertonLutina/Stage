require('../setup');
const { mockPool } = require('../mocks/db.mock');
const { generateAccessToken } = require('../../utils/jwt');

const passport = { initialize: () => (req, res, next) => next(), authenticate: () => (req, res, next) => next() };
const createApp = require('../../app');
const app = createApp(passport);
const request = require('supertest');

const OWNER_ID = 'owner-uuid-9999';
const TOKEN = `Bearer ${generateAccessToken(OWNER_ID)}`;

const MOCK_TOURNAMENT = {
  id: 'tourn-uuid-9999',
  name: 'EAFC World Cup',
  owner_id: OWNER_ID,
  format: 'single_elim',
  max_teams: 8,
  status: 'draft',
  description: null,
  created_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('POST /tournaments', () => {
  it('creates a tournament when user has no active tournament', async () => {
    mockPool.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([[MOCK_TOURNAMENT]]);

    const res = await request(app)
      .post('/tournaments')
      .set('Authorization', TOKEN)
      .send({ name: 'EAFC World Cup', format: 'single_elim', max_teams: 8 });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('EAFC World Cup');
    expect(res.body.data.status).toBe('draft');
  });

  it('returns 400 when user already has an active tournament', async () => {
    mockPool.query.mockResolvedValueOnce([[{ id: 'existing-tourn' }]]);

    const res = await request(app)
      .post('/tournaments')
      .set('Authorization', TOKEN)
      .send({ name: 'Second Tournament', format: 'classic_league', max_teams: 20 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/complete.*active/i);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/tournaments').send({ name: 'No Auth' });
    expect(res.status).toBe(401);
  });
});

describe('GET /tournaments/:id', () => {
  it('returns tournament with teams', async () => {
    mockPool.query
      .mockResolvedValueOnce([[MOCK_TOURNAMENT]])
      .mockResolvedValueOnce([[{ team_id: 'team-1', club_name: 'FC Test', avatar: null, joined_at: new Date().toISOString() }]]);

    const res = await request(app).get('/tournaments/tourn-uuid-9999');

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('EAFC World Cup');
    expect(res.body.data.teams).toHaveLength(1);
  });

  it('returns 404 for unknown tournament', async () => {
    mockPool.query.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/tournaments/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('POST /tournaments/:id/join', () => {
  it('allows a team to join a draft tournament', async () => {
    mockPool.query
      .mockResolvedValueOnce([[MOCK_TOURNAMENT]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 1 }]);

    const res = await request(app)
      .post('/tournaments/tourn-uuid-9999/join')
      .set('Authorization', TOKEN)
      .send({ team_id: 'team-uuid-join' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/joined/i);
  });

  it('returns 400 if tournament is not in draft status', async () => {
    mockPool.query.mockResolvedValueOnce([[{ ...MOCK_TOURNAMENT, status: 'active' }]]);

    const res = await request(app)
      .post('/tournaments/tourn-uuid-9999/join')
      .set('Authorization', TOKEN)
      .send({ team_id: 'team-uuid-join' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already started/i);
  });

  it('returns 400 if tournament is full', async () => {
    const fullTeams = Array.from({ length: 8 }, (_, i) => ({ team_id: `t${i}` }));
    mockPool.query
      .mockResolvedValueOnce([[MOCK_TOURNAMENT]])
      .mockResolvedValueOnce([fullTeams]);

    const res = await request(app)
      .post('/tournaments/tourn-uuid-9999/join')
      .set('Authorization', TOKEN)
      .send({ team_id: 'team-too-many' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/full/i);
  });
});
