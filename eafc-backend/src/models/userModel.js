const { pool } = require('../config/db');

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, avatar, first_name, last_name, birthday, email, country, country_code, phone_number, gamer_tag, auth_provider, bio, signin_preference, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function create(data) {
  const { id, first_name, last_name, email, password_hash, auth_provider, google_id, apple_id, avatar } = data;
  await pool.query(
    'INSERT INTO users (id, first_name, last_name, email, password_hash, auth_provider, google_id, apple_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, first_name, last_name, email, password_hash || null, auth_provider || 'local', google_id || null, apple_id || null, avatar || null]
  );
  await pool.query('INSERT INTO user_stats (user_id) VALUES (?)', [id]);
  return findById(id);
}

async function update(id, data) {
  const fields = ['first_name', 'last_name', 'birthday', 'country', 'country_code', 'phone_number', 'gamer_tag', 'avatar', 'bio', 'signin_preference'];
  const updates = [];
  const values = [];
  fields.forEach(f => {
    if (data[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(data[f]);
    }
  });
  if (!updates.length) return findById(id);
  values.push(id);
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function getStats(userId) {
  const [rows] = await pool.query('SELECT * FROM user_stats WHERE user_id = ?', [userId]);
  return rows[0] || null;
}

async function getAvailability(userId) {
  const [rows] = await pool.query('SELECT * FROM user_availability WHERE user_id = ? ORDER BY day_of_week', [userId]);
  return rows;
}

async function setAvailability(userId, slots) {
  await pool.query('DELETE FROM user_availability WHERE user_id = ?', [userId]);
  if (!slots || !slots.length) return [];
  const { v4: uuidv4 } = require('uuid');
  const values = slots.map(s => [uuidv4(), userId, s.day_of_week, s.start_time, s.end_time]);
  await pool.query('INSERT INTO user_availability (id, user_id, day_of_week, start_time, end_time) VALUES ?', [values]);
  return getAvailability(userId);
}

async function getFollowersCount(userId) {
  const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM follows WHERE followee_id = ? AND followee_type = 'user'", [userId]);
  return rows[0].cnt;
}

async function getTeams(userId) {
  const [rows] = await pool.query(
    'SELECT t.id, t.club_name, t.avatar, t.country, tp.role FROM teams t JOIN team_players tp ON t.id = tp.team_id WHERE tp.user_id = ?',
    [userId]
  );
  return rows;
}

module.exports = { findById, findByEmail, create, update, getStats, getAvailability, setAvailability, getFollowersCount, getTeams };
