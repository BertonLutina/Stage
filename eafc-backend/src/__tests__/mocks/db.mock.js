const mockPool = {
  query: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
};

jest.mock('../../config/db', () => ({
  pool: mockPool,
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../config/passport', () => {
  const passport = { initialize: () => (req, res, next) => next(), authenticate: () => (req, res, next) => next() };
  return () => passport;
});

module.exports = { mockPool };
