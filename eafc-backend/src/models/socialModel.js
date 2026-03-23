const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function follow(followerId, followeeId, followeeType) {
  const id = uuidv4();
  try {
    await pool.query(
      'INSERT INTO follows (id, follower_id, followee_id, followee_type) VALUES (?, ?, ?, ?)',
      [id, followerId, followeeId, followeeType]
    );
    return true;
  } catch {
    return false;
  }
}

async function unfollow(followerId, followeeId, followeeType) {
  await pool.query('DELETE FROM follows WHERE follower_id = ? AND followee_id = ? AND followee_type = ?', [followerId, followeeId, followeeType]);
}

async function isFollowing(followerId, followeeId, followeeType) {
  const [rows] = await pool.query('SELECT id FROM follows WHERE follower_id = ? AND followee_id = ? AND followee_type = ?', [followerId, followeeId, followeeType]);
  return rows.length > 0;
}

async function createPost(userId, teamId, content, mediaUrl, mediaType) {
  const id = uuidv4();
  await pool.query(
    'INSERT INTO posts (id, user_id, team_id, content, media_url, media_type) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, teamId || null, content || null, mediaUrl || null, mediaType || 'none']
  );
  const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
  return rows[0];
}

async function getFeed(userId, page, limit) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT p.*, u.gamer_tag, u.avatar as user_avatar, u.first_name, u.last_name
     FROM posts p JOIN users u ON p.user_id = u.id
     WHERE p.user_id = ? OR p.user_id IN (
       SELECT followee_id FROM follows WHERE follower_id = ? AND followee_type = 'user'
     )
     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [userId, userId, limit, offset]
  );
  return rows;
}

async function toggleLike(userId, targetId, targetType) {
  const [existing] = await pool.query('SELECT id FROM likes WHERE user_id = ? AND target_id = ? AND target_type = ?', [userId, targetId, targetType]);
  if (existing.length) {
    await pool.query('DELETE FROM likes WHERE user_id = ? AND target_id = ? AND target_type = ?', [userId, targetId, targetType]);
    return false;
  }
  await pool.query('INSERT INTO likes (id, user_id, target_id, target_type) VALUES (?, ?, ?, ?)', [uuidv4(), userId, targetId, targetType]);
  return true;
}

async function addComment(userId, targetId, targetType, content) {
  const id = uuidv4();
  await pool.query('INSERT INTO comments (id, user_id, target_id, target_type, content) VALUES (?, ?, ?, ?, ?)', [id, userId, targetId, targetType, content]);
  const [rows] = await pool.query('SELECT c.*, u.gamer_tag, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [id]);
  return rows[0];
}

async function createReel(userId, teamId, videoUrl, thumbnailUrl, title) {
  const id = uuidv4();
  await pool.query(
    'INSERT INTO reels (id, user_id, team_id, video_url, thumbnail_url, title) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, teamId || null, videoUrl, thumbnailUrl || null, title || null]
  );
  const [rows] = await pool.query('SELECT r.*, u.gamer_tag, u.avatar FROM reels r JOIN users u ON r.user_id = u.id WHERE r.id = ?', [id]);
  return rows[0];
}

async function getReels(page, limit) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    'SELECT r.*, u.gamer_tag, u.avatar as user_avatar FROM reels r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  return rows;
}

async function getMessages(userId, otherUserId) {
  const [rows] = await pool.query(
    `SELECT * FROM direct_messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC`,
    [userId, otherUserId, otherUserId, userId]
  );
  await pool.query('UPDATE direct_messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?', [userId, otherUserId]);
  return rows;
}

async function sendMessage(senderId, receiverId, content, messageType = 'text', mediaUrl = null, mediaMetadata = null) {
  const id = uuidv4();
  await pool.query(
    'INSERT INTO direct_messages (id, sender_id, receiver_id, content, message_type, media_url, media_metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, senderId, receiverId, content || '', messageType, mediaUrl, mediaMetadata ? JSON.stringify(mediaMetadata) : null]
  );
  const [rows] = await pool.query('SELECT * FROM direct_messages WHERE id = ?', [id]);
  return rows[0];
}

async function getConversations(userId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT
     CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id,
     MAX(created_at) as last_message_at
     FROM direct_messages WHERE sender_id = ? OR receiver_id = ?
     GROUP BY other_user_id ORDER BY last_message_at DESC`,
    [userId, userId, userId]
  );
  return rows;
}

module.exports = { follow, unfollow, isFollowing, createPost, getFeed, toggleLike, addComment, createReel, getReels, getMessages, sendMessage, getConversations };
