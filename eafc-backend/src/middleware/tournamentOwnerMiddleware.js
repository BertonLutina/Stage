const { pool } = require('../config/db');
const { errorResponse } = require('../utils/helpers');

async function tournamentOwnerMiddleware(req, res, next) {
  const tournamentId = req.params.tournamentId || req.params.id;
  try {
    const [rows] = await pool.query('SELECT owner_id FROM tournaments WHERE id = ?', [tournamentId]);
    if (!rows.length) return errorResponse(res, 'Tournament not found', 404);
    if (rows[0].owner_id !== req.userId) return errorResponse(res, 'Forbidden: not tournament owner', 403);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = tournamentOwnerMiddleware;
