const { pool } = require('../config/db');
const { errorResponse } = require('../utils/helpers');

async function teamOwnerMiddleware(req, res, next) {
  const teamId = req.params.teamId || req.params.id;
  try {
    const [rows] = await pool.query('SELECT owner_id FROM teams WHERE id = ?', [teamId]);
    if (!rows.length) return errorResponse(res, 'Team not found', 404);
    if (rows[0].owner_id !== req.userId) return errorResponse(res, 'Forbidden: not team owner', 403);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = teamOwnerMiddleware;
