const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT m.*, ht.club_name as home_team_name, ht.avatar as home_avatar,
     at.club_name as away_team_name, at.avatar as away_avatar,
     t.name as tournament_name, t.format as tournament_format
     FROM matches m
     JOIN teams ht ON m.home_team_id = ht.id
     JOIN teams at ON m.away_team_id = at.id
     JOIN tournaments t ON m.tournament_id = t.id
     WHERE m.id = ?`,
    [id]
  );
  if (!rows.length) return null;
  const match = rows[0];
  const [videos] = await pool.query(
    'SELECT mv.*, u.gamer_tag as uploader FROM match_videos mv JOIN users u ON mv.uploaded_by = u.id WHERE mv.match_id = ?',
    [id]
  );
  match.videos = videos;
  return match;
}

async function canUpdateScore(matchId, userId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM matches m
     JOIN tournaments t ON m.tournament_id = t.id
     JOIN team_players tp ON tp.team_id IN (m.home_team_id, m.away_team_id)
     WHERE m.id = ? AND (t.owner_id = ? OR tp.user_id = ?)
     LIMIT 1`,
    [matchId, userId, userId]
  );
  return rows.length > 0;
}

async function updateScore(id, homeScore, awayScore, userId) {
  const allowed = await canUpdateScore(id, userId);
  if (!allowed) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  await pool.query(
    "UPDATE matches SET home_score = ?, away_score = ?, status = 'completed', played_at = NOW() WHERE id = ?",
    [homeScore, awayScore, id]
  );
  return findById(id);
}

async function addVideo(matchId, uploadedBy, videoUrl, videoSource) {
  const id = uuidv4();
  await pool.query(
    'INSERT INTO match_videos (id, match_id, uploaded_by, video_url, video_source) VALUES (?, ?, ?, ?, ?)',
    [id, matchId, uploadedBy, videoUrl, videoSource || 'youtube']
  );
  return findById(matchId);
}

async function getFixtures(tournamentId, status) {
  let sql = `SELECT m.*, ht.club_name as home_team_name, ht.avatar as home_avatar,
     at.club_name as away_team_name, at.avatar as away_avatar,
     t.name as tournament_name
     FROM matches m
     JOIN teams ht ON m.home_team_id = ht.id
     JOIN teams at ON m.away_team_id = at.id
     JOIN tournaments t ON m.tournament_id = t.id`;
  const params = [];
  const conditions = [];
  if (tournamentId) { conditions.push('m.tournament_id = ?'); params.push(tournamentId); }
  if (status) { conditions.push('m.status = ?'); params.push(status); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY COALESCE(m.scheduled_at, m.created_at) ASC, m.created_at DESC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getMatchChat(matchId, limit = 100, opts = {}) {
  const { search, messageType, unreadByUserId } = opts;
  let sql = 'SELECT id, match_id, user_id, gamer_tag, content, message_type, media_url, media_metadata, created_at FROM match_live_chat WHERE match_id = ?';
  const params = [matchId];

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
    sql += ` AND created_at > COALESCE((SELECT last_read_at FROM chat_read_receipts WHERE user_id = ? AND chat_type = 'match' AND chat_id = match_live_chat.match_id LIMIT 1), '1970-01-01')`;
    params.push(unreadByUserId);
  }

  sql += ' ORDER BY created_at ASC LIMIT ?';
  params.push(limit);

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function insertMatchChat(matchId, userId, gamerTag, content, messageType = 'text', mediaUrl = null, mediaMetadata = null) {
  const id = uuidv4();
  await pool.query(
    'INSERT INTO match_live_chat (id, match_id, user_id, gamer_tag, content, message_type, media_url, media_metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, matchId, userId, gamerTag, content || '', messageType, mediaUrl, mediaMetadata ? JSON.stringify(mediaMetadata) : null]
  );
  const [rows] = await pool.query(
    'SELECT id, match_id, user_id, gamer_tag, content, message_type, media_url, media_metadata, created_at FROM match_live_chat WHERE id = ?',
    [id]
  );
  return rows[0];
}

async function markMatchChatRead(matchId, userId) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO chat_read_receipts (id, user_id, chat_type, chat_id, last_read_at) VALUES (?, ?, 'match', ?, NOW())
     ON DUPLICATE KEY UPDATE last_read_at = NOW()`,
    [id, userId, matchId]
  );
}

async function getByTournament(tournamentId) {
  const [rows] = await pool.query(
    'SELECT id, tournament_id, home_team_id, away_team_id, round_id, group_id FROM matches WHERE tournament_id = ?',
    [tournamentId]
  );
  return rows;
}

async function updateSchedule(matchId, scheduledAt, timeSlotId) {
  await pool.query(
    'UPDATE matches SET scheduled_at = ?, time_slot_id = ? WHERE id = ?',
    [scheduledAt, timeSlotId, matchId]
  );
}

/**
 * Find matches that would conflict if we assign (scheduledAt, timeSlotId) to a match.
 * Conflict = same date + same time_slot_id AND (home or away team involved).
 */
async function findScheduleConflicts(tournamentId, homeTeamId, awayTeamId, scheduledAt, timeSlotId, excludeMatchId) {
  const params = [tournamentId, excludeMatchId || ''];

  let sql = `SELECT m.id FROM matches m
    WHERE m.tournament_id = ?
    AND m.id != ?
    AND m.scheduled_at IS NOT NULL
    AND (m.home_team_id IN (?, ?) OR m.away_team_id IN (?, ?))`;
  params.push(homeTeamId, awayTeamId, homeTeamId, awayTeamId);

  if (scheduledAt && timeSlotId) {
    const dateStr = new Date(scheduledAt).toISOString().slice(0, 10);
    sql += ` AND DATE(m.scheduled_at) = ? AND m.time_slot_id = ?`;
    params.push(dateStr, timeSlotId);
  }

  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = {
  findById,
  updateScore,
  addVideo,
  getFixtures,
  getMatchChat,
  insertMatchChat,
  markMatchChatRead,
  getByTournament,
  updateSchedule,
  findScheduleConflicts,
};
