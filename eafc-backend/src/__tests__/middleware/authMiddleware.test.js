require('../setup');
const authMiddleware = require('../../middleware/authMiddleware');
const { generateAccessToken } = require('../../utils/jwt');

const mockReq = (authHeader) => ({ headers: { authorization: authHeader } });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

beforeEach(() => mockNext.mockClear());

describe('authMiddleware', () => {
  it('calls next() and sets req.userId for valid token', () => {
    const token = generateAccessToken('user-test-id');
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe('user-test-id');
  });

  it('returns 401 when Authorization header is missing', () => {
    const req = mockReq(undefined);
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with Bearer', () => {
    const req = mockReq('Basic sometoken');
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for an expired/invalid token', () => {
    const req = mockReq('Bearer this.is.invalid');
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 for a token signed with wrong secret', () => {
    const jwt = require('jsonwebtoken');
    const badToken = jwt.sign({ userId: 'u1' }, 'wrong_secret', { expiresIn: '1m' });
    const req = mockReq(`Bearer ${badToken}`);
    const res = mockRes();
    authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
