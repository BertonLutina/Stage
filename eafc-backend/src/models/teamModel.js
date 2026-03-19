const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM teams WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findAll() {
  const [rows] = await pool.query('SELECT * FROM teams ORDER BY club_name ASC');
  return rows;
}

async function create(data) {
  const id = uuidv4();
  const { club_name, country, country_code, owner_id, avatar, bio } = data;
  await pool.query(
    'INSERT INTO teams (id, club_name, country, country_code, owner_id, avatar, bio) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, club_name, country || null, country_code || null, owner_id, avatar || null, bio || null]
  );
  await pool.query(
    'INSERT INTO team_players (id, team_id, user_id, role) VALUES (?, ?, ?, ?)',
    [uuidv4(), id, owner_id, 'owner']
  );
  return findById(id);
}

async function update(id, data) {
  const fields = ['club_name', 'country', 'country_code', 'avatar', 'bio'];
  const updates = [];
  const values = [];
  fields.forEach(f => {
    if (data[f] !== undefined) { updates.push(`${f} = ?`); values.push(data[f]); }
  });
  if (!updates.length) return findById(id);
  values.push(id);
  await pool.query(`UPDATE teams SET ${updates.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function getPlayers(teamId) {
  const [rows] = await pool.query(
    `SELECT tp.id, tp.team_id, tp.role, tp.position, tp.jersey_number, tp.joined_at,
     u.id as user_id, u.first_name, u.last_name, u.gamer_tag, u.avatar
     FROM team_players tp JOIN users u ON tp.user_id = u.id WHERE tp.team_id = ?`,
    [teamId]
  );
  return rows;
}

async function addPlayer(teamId, userId, role = 'player') {
  const [existing] = await pool.query('SELECT id FROM team_players WHERE team_id = ? AND user_id = ?', [teamId, userId]);
  if (existing.length) return null;
  const id = uuidv4();
  await pool.query('INSERT INTO team_players (id, team_id, user_id, role) VALUES (?, ?, ?, ?)', [id, teamId, userId, role]);
  return getPlayers(teamId);
}

async function removePlayer(teamId, userId) {
  await pool.query('DELETE FROM team_players WHERE team_id = ? AND user_id = ?', [teamId, userId]);
}

async function getUserTeamCount(userId) {
  const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM team_players WHERE user_id = ?', [userId]);
  return rows[0].cnt;
}

async function getActiveFormation(teamId) {
  const [rows] = await pool.query('SELECT * FROM formations WHERE team_id = ? AND is_active = 1 LIMIT 1', [teamId]);
  if (!rows.length) return null;
  const formation = rows[0];
  const [positions] = await pool.query(
    `SELECT pp.*, u.first_name, u.last_name, u.gamer_tag, u.avatar
     FROM player_positions pp JOIN users u ON pp.user_id = u.id WHERE pp.formation_id = ?`,
    [formation.id]
  );
  formation.positions = positions;
  return formation;
}

async function saveFormation(teamId, name, positions) {
  await pool.query('UPDATE formations SET is_active = 0 WHERE team_id = ?', [teamId]);
  const formId = uuidv4();
  await pool.query('INSERT INTO formations (id, team_id, name, is_active) VALUES (?, ?, ?, 1)', [formId, teamId, name]);
  if (positions && positions.length) {
    const vals = positions.map(p => [uuidv4(), formId, p.user_id, p.position_code, p.x_coord || null, p.y_coord || null]);
    await pool.query('INSERT INTO player_positions (id, formation_id, user_id, position_code, x_coord, y_coord) VALUES ?', [vals]);
  }
  return getActiveFormation(teamId);
}

async function getDressingRoom(teamId) {
  const players = await getPlayers(teamId);
  const formation = await getActiveFormation(teamId);
  const starters = formation ? formation.positions.map(p => p.user_id) : [];
  return {
    starters: players.filter(p => starters.includes(p.user_id)),
    substitutes: players.filter(p => !starters.includes(p.user_id)),
    formation,
  };
}

async function findAllWithPlayers() {
  const teams = await findAll();
  if (!teams.length) return [];

  const ids = teams.map(t => t.id);
  const [players] = await pool.query(
    `SELECT tp.team_id,
      tp.id,
      tp.role,
      tp.position,
      tp.jersey_number,
      tp.joined_at,
      u.id as user_id,
      u.first_name,
      u.last_name,
      u.gamer_tag,
      u.avatar
     FROM team_players tp
     JOIN users u ON tp.user_id = u.id
     WHERE tp.team_id IN (?)`,
    [ids]
  );

  const byTeam = {};
  players.forEach(p => {
    if (!byTeam[p.team_id]) byTeam[p.team_id] = [];
    byTeam[p.team_id].push(p);
  });

  return teams.map(t => ({
    ...t,
    players: byTeam[t.id] || [],
  }));
}

module.exports = {
  findById,
  create,
  update,
  getPlayers,
  addPlayer,
  removePlayer,
  getUserTeamCount,
  getActiveFormation,
  saveFormation,
  getDressingRoom,
  findAll,
  findAllWithPlayers,
};
