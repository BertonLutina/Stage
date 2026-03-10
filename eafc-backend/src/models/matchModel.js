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

async function updateScore(id, homeScore, awayScore, userId) {
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
  sql += ' ORDER BY m.created_at DESC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { findById, updateScore, addVideo, getFixtures };
