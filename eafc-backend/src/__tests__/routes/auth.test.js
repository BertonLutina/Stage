require('../setup');
const { mockPool } = require('../mocks/db.mock');
const request = require('supertest');
const bcrypt = require('bcryptjs');

const passport = { initialize: () => (req, res, next) => next(), authenticate: () => (req, res, next) => next() };
const createApp = require('../../app');
const app = createApp(passport);

const MOCK_USER = {
  id: 'user-uuid-1234',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@eafc.com',
  password_hash: bcrypt.hashSync('Password123!', 10),
  gamer_tag: 'TestPlayer_99',
  auth_provider: 'local',
  created_at: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /auth/register', () => {
  it('registers a new user and returns tokens', async () => {
    mockPool.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([{ insertId: 1 }]);

    const res = await request(app).post('/auth/register').send({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@eafc.com',
      password: 'Password123!',
      gamer_tag: 'TestPlayer_99',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user).toHaveProperty('email', 'test@eafc.com');
  });

  it('returns 409 if email already registered', async () => {
    mockPool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app).post('/auth/register').send({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@eafc.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered/i);
  });
});

describe('POST /auth/login', () => {
  it('returns tokens on valid credentials', async () => {
    mockPool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([{ insertId: 1 }]);

    const res = await request(app).post('/auth/login').send({
      email: 'test@eafc.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  it('returns 401 on wrong password', async () => {
    mockPool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app).post('/auth/login').send({
      email: 'test@eafc.com',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 401 if user not found', async () => {
    mockPool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).post('/auth/login').send({
      email: 'nobody@eafc.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(401);
  });

  it('returns 400 if account uses social login (no password_hash)', async () => {
    mockPool.query.mockResolvedValueOnce([[{ ...MOCK_USER, password_hash: null, auth_provider: 'google' }]]);

    const res = await request(app).post('/auth/login').send({
      email: 'test@eafc.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/social login/i);
  });
});

describe('POST /auth/refresh', () => {
  it('returns a new access token with valid refresh token', async () => {
    const { generateRefreshToken } = require('../../utils/jwt');
    const refreshToken = generateRefreshToken('user-uuid-1234');

    mockPool.query.mockResolvedValueOnce([[{ id: 'rt-1' }]]);

    const res = await request(app).post('/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('returns 400 if no refresh token provided', async () => {
    const res = await request(app).post('/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 for invalid refresh token', async () => {
    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'invalid.token.here' });
    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
