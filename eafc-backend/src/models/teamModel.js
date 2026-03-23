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

async function search(q, limit = 20) {
  if (!q || typeof q !== 'string' || q.trim().length < 2) return [];
  const like = `%${q.trim()}%`;
  const [rows] = await pool.query(
    'SELECT id, club_name, avatar, country, country_code FROM teams WHERE club_name LIKE ? ORDER BY club_name ASC LIMIT ?',
    [like, limit]
  );
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

async function isTeamMember(teamId, userId) {
  const [rows] = await pool.query('SELECT 1 FROM team_players WHERE team_id = ? AND user_id = ?', [teamId, userId]);
  return rows.length > 0;
}

async function getTeamChat(teamId, limit = 100, opts = {}) {
  const { search, messageType, unreadByUserId } = opts;
  let sql = 'SELECT id, team_id, user_id, gamer_tag, content, message_type, media_url, media_metadata, created_at FROM team_chat_messages WHERE team_id = ?';
  const params = [teamId];

  if (search && search.trim()) {
    sql += ' AND (content LIKE ? OR media_url LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }
  if (messageType && messageType !== 'all') {
    const types = messageType.split(',').map((t) => t.trim()).filter(Boolean);
    if (types.length) {
      sql += ` AND message_type IN (${types.map(() => '?').join(',')})`;
      params.push(...types);
    }
  }
  if (unreadByUserId) {
    sql += ` AND created_at > COALESCE((SELECT last_read_at FROM chat_read_receipts WHERE user_id = ? AND chat_type = 'team' AND chat_id = team_chat_messages.team_id LIMIT 1), '1970-01-01')`;
    params.push(unreadByUserId);
  }

  sql += ' ORDER BY created_at ASC LIMIT ?';
  params.push(limit);

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function markTeamChatRead(teamId, userId) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO chat_read_receipts (id, user_id, chat_type, chat_id, last_read_at) VALUES (?, ?, 'team', ?, NOW())
     ON DUPLICATE KEY UPDATE last_read_at = NOW()`,
    [id, userId, teamId]
  );
}

async function createJoinRequest(teamId, userId) {
  const [existing] = await pool.query(
    'SELECT id FROM request_joining_team WHERE team_id = ? AND user_id = ? AND status = ?',
    [teamId, userId, 'pending']
  );
  if (existing.length) return { existing: true };
  const [declined] = await pool.query(
    'SELECT id FROM request_joining_team WHERE team_id = ? AND user_id = ? AND status = ?',
    [teamId, userId, 'declined']
  );
  if (declined.length) {
    await pool.query('UPDATE request_joining_team SET status = ?, responded_at = NULL WHERE id = ?', ['pending', declined[0].id]);
  } else {
    const id = uuidv4();
    await pool.query('INSERT INTO request_joining_team (id, team_id, user_id, status) VALUES (?, ?, ?, ?)', [id, teamId, userId, 'pending']);
  }
  return { existing: false };
}

async function getPendingJoinRequests(teamId) {
  const [rows] = await pool.query(
    `SELECT r.id, r.team_id, r.user_id, r.status, r.created_at,
      u.gamer_tag, u.first_name, u.last_name, u.avatar
     FROM request_joining_team r
     JOIN users u ON r.user_id = u.id
     WHERE r.team_id = ? AND r.status = ? ORDER BY r.created_at ASC`,
    [teamId, 'pending']
  );
  return rows;
}

async function acceptJoinRequest(requestId, teamId, ownerId) {
  const [rows] = await pool.query(
    `SELECT r.*, t.owner_id, t.club_name, u.gamer_tag
     FROM request_joining_team r
     JOIN teams t ON r.team_id = t.id
     JOIN users u ON r.user_id = u.id
     WHERE r.id = ? AND r.team_id = ?`,
    [requestId, teamId]
  );
  if (!rows.length || rows[0].owner_id !== ownerId) return null;
  const req = rows[0];
  if (req.status !== 'pending') return null;
  await pool.query('UPDATE request_joining_team SET status = ?, responded_at = NOW() WHERE id = ?', ['accepted', requestId]);
  await addPlayer(teamId, req.user_id, 'player');
  return { userId: req.user_id, gamerTag: req.gamer_tag, teamName: req.club_name };
}

async function declineJoinRequest(requestId, teamId, ownerId) {
  const [rows] = await pool.query(
    'SELECT r.*, t.owner_id FROM request_joining_team r JOIN teams t ON r.team_id = t.id WHERE r.id = ? AND r.team_id = ?',
    [requestId, teamId]
  );
  if (!rows.length || rows[0].owner_id !== ownerId) return null;
  if (rows[0].status !== 'pending') return null;
  await pool.query('UPDATE request_joining_team SET status = ?, responded_at = NOW() WHERE id = ?', ['declined', requestId]);
  return true;
}

async function getUserPendingRequest(teamId, userId) {
  const [rows] = await pool.query(
    'SELECT id, status FROM request_joining_team WHERE team_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1',
    [teamId, userId]
  );
  return rows[0] || null;
}

async function insertTeamChat(teamId, userId, gamerTag, content, messageType = 'text', mediaUrl = null, mediaMetadata = null) {
  const id = uuidv4();
  await pool.query(
    'INSERT INTO team_chat_messages (id, team_id, user_id, gamer_tag, content, message_type, media_url, media_metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, teamId, userId, gamerTag, content || '', messageType, mediaUrl, mediaMetadata ? JSON.stringify(mediaMetadata) : null]
  );
  const [rows] = await pool.query(
    'SELECT id, team_id, user_id, gamer_tag, content, message_type, media_url, media_metadata, created_at FROM team_chat_messages WHERE id = ?',
    [id]
  );
  return rows[0];
}

async function updateTeamChatMessageMediaMetadata(messageId, mediaMetadata) {
  await pool.query(
    'UPDATE team_chat_messages SET media_metadata = ? WHERE id = ?',
    [JSON.stringify(mediaMetadata), messageId]
  );
  const [rows] = await pool.query(
    'SELECT id, team_id, user_id, gamer_tag, content, message_type, media_url, media_metadata, created_at FROM team_chat_messages WHERE id = ?',
    [messageId]
  );
  return rows[0];
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
  search,
  findAllWithPlayers,
  isTeamMember,
  getTeamChat,
  insertTeamChat,
  updateTeamChatMessageMediaMetadata,
  markTeamChatRead,
  createJoinRequest,
  getPendingJoinRequests,
  acceptJoinRequest,
  declineJoinRequest,
  getUserPendingRequest,
};
