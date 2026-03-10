const { verifyAccessToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/helpers');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Unauthorized', 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
}

module.exports = authMiddleware;
