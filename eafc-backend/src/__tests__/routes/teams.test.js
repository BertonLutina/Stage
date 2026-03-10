require('../setup');
const { mockPool } = require('../mocks/db.mock');
const request = require('supertest');
const { generateAccessToken } = require('../../utils/jwt');

const passport = { initialize: () => (req, res, next) => next(), authenticate: () => (req, res, next) => next() };
const createApp = require('../../app');
const app = createApp(passport);

const OWNER_ID = 'owner-uuid-1111';
const TOKEN = `Bearer ${generateAccessToken(OWNER_ID)}`;

const MOCK_TEAM = {
  id: 'team-uuid-1234',
  club_name: 'FC Longue Vie',
  country: 'Belgium',
  country_code: 'BE',
  owner_id: OWNER_ID,
  avatar: null,
  bio: 'Test team bio',
  followers_count: 0,
  likes_count: 0,
  wins: 3,
  draws: 1,
  losses: 0,
  created_at: new Date().toISOString(),
};

const MOCK_PLAYER = {
  user_id: OWNER_ID,
  first_name: 'John',
  last_name: 'Doe',
  gamer_tag: 'JohnDoe_99',
  avatar: null,
  position: 'ST',
  role: 'owner',
  jersey_number: 9,
  joined_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('POST /teams', () => {
  it('creates a team when user has < 3 teams', async () => {
    mockPool.query
      .mockResolvedValueOnce([[{ cnt: 1 }]])
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([[MOCK_TEAM]]);

    const res = await request(app)
      .post('/teams')
      .set('Authorization', TOKEN)
      .send({ club_name: 'FC Longue Vie', country: 'Belgium', country_code: 'BE' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.club_name).toBe('FC Longue Vie');
  });

  it('returns 400 when user already has 3 teams', async () => {
    mockPool.query.mockResolvedValueOnce([[{ cnt: 3 }]]);

    const res = await request(app)
      .post('/teams')
      .set('Authorization', TOKEN)
      .send({ club_name: 'Fourth Team' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/maximum 3/i);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/teams').send({ club_name: 'Test' });
    expect(res.status).toBe(401);
  });
});

describe('GET /teams/:id', () => {
  it('returns team with players', async () => {
    mockPool.query
      .mockResolvedValueOnce([[MOCK_TEAM]])
      .mockResolvedValueOnce([[MOCK_PLAYER]]);

    const res = await request(app).get('/teams/team-uuid-1234');

    expect(res.status).toBe(200);
    expect(res.body.data.club_name).toBe('FC Longue Vie');
    expect(res.body.data.players).toHaveLength(1);
  });

  it('returns 404 for non-existent team', async () => {
    mockPool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/teams/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

describe('GET /teams/:id/players', () => {
  it('returns the player list', async () => {
    mockPool.query.mockResolvedValueOnce([[MOCK_PLAYER]]);

    const res = await request(app).get('/teams/team-uuid-1234/players');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].gamer_tag).toBe('JohnDoe_99');
  });
});

describe('POST /teams/:id/players', () => {
  it('adds a player to the team', async () => {
    mockPool.query
      .mockResolvedValueOnce([[{ owner_id: OWNER_ID }]])
      .mockResolvedValueOnce([[{ cnt: 1 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([[MOCK_PLAYER]]);

    const res = await request(app)
      .post('/teams/team-uuid-1234/players')
      .set('Authorization', TOKEN)
      .send({ user_id: 'new-user-uuid', role: 'player' });

    expect(res.status).toBe(200);
  });

  it('returns 400 when player already in 3 teams', async () => {
    mockPool.query
      .mockResolvedValueOnce([[{ owner_id: OWNER_ID }]])
      .mockResolvedValueOnce([[{ cnt: 3 }]]);

    const res = await request(app)
      .post('/teams/team-uuid-1234/players')
      .set('Authorization', TOKEN)
      .send({ user_id: 'busy-user-uuid', role: 'player' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/3 teams/i);
  });
});

describe('GET /teams/:id/formation', () => {
  it('returns the active formation with positions', async () => {
    mockPool.query
      .mockResolvedValueOnce([[{ id: 'form-uuid', team_id: 'team-uuid-1234', name: '4-3-3', is_active: 1 }]])
      .mockResolvedValueOnce([[{ id: 'pos-1', position_code: 'GK', x_coord: 50, y_coord: 92, gamer_tag: 'JohnDoe_99' }]]);

    const res = await request(app).get('/teams/team-uuid-1234/formation');
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('4-3-3');
    expect(res.body.data.positions).toHaveLength(1);
  });

  it('returns null data when no formation set', async () => {
    mockPool.query.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/teams/team-uuid-1234/formation');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });
});

describe('GET /teams/:id/dressing-room', () => {
  it('returns starters and substitutes', async () => {
    mockPool.query
      .mockResolvedValueOnce([[MOCK_PLAYER]])
      .mockResolvedValueOnce([[{ id: 'form-uuid', name: '4-3-3', is_active: 1 }]])
      .mockResolvedValueOnce([[{ user_id: OWNER_ID, position_code: 'ST', x_coord: 50, y_coord: 15, first_name: 'John', last_name: 'Doe', gamer_tag: 'JohnDoe_99', avatar: null }]]);

    const res = await request(app).get('/teams/team-uuid-1234/dressing-room');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('starters');
    expect(res.body.data).toHaveProperty('substitutes');
    expect(res.body.data).toHaveProperty('formation');
  });
});
