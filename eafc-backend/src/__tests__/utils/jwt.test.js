require('../setup');

const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../../utils/jwt');

describe('JWT Utils', () => {
  const userId = 'user-uuid-test-1234';

  describe('generateAccessToken / verifyAccessToken', () => {
    it('generates a valid access token and verifies it', () => {
      const token = generateAccessToken(userId);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const payload = verifyAccessToken(token);
      expect(payload.userId).toBe(userId);
    });

    it('throws on tampered access token', () => {
      const token = generateAccessToken(userId);
      const tampered = token.slice(0, -4) + 'XXXX';
      expect(() => verifyAccessToken(tampered)).toThrow();
    });

    it('throws on wrong secret', () => {
      const jwt = require('jsonwebtoken');
      const badToken = jwt.sign({ userId }, 'wrong_secret', { expiresIn: '1m' });
      expect(() => verifyAccessToken(badToken)).toThrow();
    });
  });

  describe('generateRefreshToken / verifyRefreshToken', () => {
    it('generates and verifies a refresh token', () => {
      const token = generateRefreshToken(userId);
      const payload = verifyRefreshToken(token);
      expect(payload.userId).toBe(userId);
    });

    it('throws on tampered refresh token', () => {
      const token = generateRefreshToken(userId);
      const tampered = token.slice(0, -4) + 'YYYY';
      expect(() => verifyRefreshToken(tampered)).toThrow();
    });

    it('access token is different from refresh token for same user', () => {
      const access = generateAccessToken(userId);
      const refresh = generateRefreshToken(userId);
      expect(access).not.toBe(refresh);
    });
  });
});
