const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM tournaments WHERE id = ?', [id]);
  return rows[0] || null;
}

/**
 * List tournaments with basic pagination and optional search.
 *
 * @param {Object} options
 * @param {number} [options.page=1]       - 1-based page index
 * @param {number} [options.pageSize=20]  - items per page (max 100)
 * @param {string} [options.search]       - search string for name/description
 * @returns {{items: any[], total: number, page: number, pageSize: number}}
 */
async function allTournaments({ page = 1, pageSize = 20, search } = {}) {
  const limit = Math.max(1, Math.min(pageSize, 100));
  const currentPage = Math.max(page, 1);
  const offset = (currentPage - 1) * limit;

  let where = 'WHERE 1=1';
  const params = [];

  if (search && search.trim()) {
    const like = `%${search.trim()}%`;
    where += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(like, like);
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total FROM tournaments ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT * FROM tournaments ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    items: rows,
    total,
    page: currentPage,
    pageSize: limit,
  };
}

async function getUserActiveTournament(userId) {
  const [rows] = await pool.query(
    "SELECT id FROM tournaments WHERE owner_id = ? AND status != 'completed'",
    [userId]
  );
  return rows[0] || null;
}

async function getTeams(tournamentId) {
  const [rows] = await pool.query(
    'SELECT tt.*, t.club_name, t.avatar FROM tournament_teams tt JOIN teams t ON tt.team_id = t.id WHERE tt.tournament_id = ?',
    [tournamentId]
  );
  return rows;
}

async function create(data) {
  const id = uuidv4();
  const {
    name,
    owner_id,
    format,
    max_teams,
    description = null,
    visibility = 'open',
  } = data;

  await pool.query(
    'INSERT INTO tournaments (id, name, owner_id, format, max_teams, description, visibility) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name, owner_id, format, max_teams, description, visibility]
  );

  return findById(id);
}

async function addTeam(tournamentId, teamId) {
  const id = uuidv4();
  await pool.query('INSERT IGNORE INTO tournament_teams (id, tournament_id, team_id) VALUES (?, ?, ?)', [id, tournamentId, teamId]);
}

async function updateStatus(tournamentId, status) {
  await pool.query('UPDATE tournaments SET status = ? WHERE id = ?', [status, tournamentId]);
}

async function getGroups(tournamentId) {
  const [groups] = await pool.query('SELECT * FROM groups WHERE tournament_id = ?', [tournamentId]);
  for (const g of groups) {
    const [gt] = await pool.query(
      'SELECT gt.*, t.club_name, t.avatar FROM group_teams gt JOIN teams t ON gt.team_id = t.id WHERE gt.group_id = ? ORDER BY gt.points DESC, (gt.goals_for - gt.goals_against) DESC',
      [g.id]
    );
    g.teams = gt;
  }
  return groups;
}

async function getBracketRounds(tournamentId) {
  const [rounds] = await pool.query('SELECT * FROM bracket_rounds WHERE tournament_id = ? ORDER BY round_number', [tournamentId]);
  for (const r of rounds) {
    const [matches] = await pool.query(
      `SELECT m.*, ht.club_name as home_team_name, ht.avatar as home_team_avatar,
       at.club_name as away_team_name, at.avatar as away_team_avatar
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.id
       JOIN teams at ON m.away_team_id = at.id
       WHERE m.round_id = ?`,
      [r.id]
    );
    r.matches = matches;
  }
  return rounds;
}

async function getLeagueStandings(tournamentId) {
  const [rows] = await pool.query(
    'SELECT ls.*, t.club_name, t.avatar FROM league_standings ls JOIN teams t ON ls.team_id = t.id WHERE ls.tournament_id = ? ORDER BY ls.points DESC, (ls.goals_for - ls.goals_against) DESC',
    [tournamentId]
  );
  return rows;
}

module.exports = {
  findById,
  create,
  allTournaments,
  getUserActiveTournament,
  getTeams,
  addTeam,
  updateStatus,
  getGroups,
  getBracketRounds,
  getLeagueStandings,
};
