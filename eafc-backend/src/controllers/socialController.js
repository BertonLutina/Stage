const socialModel = require('../models/socialModel');
const { pool } = require('../config/db');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');

async function isTeamMember(userId, teamId) {
  if (!teamId) return true;
  const [rows] = await pool.query(
    'SELECT 1 FROM team_players WHERE team_id = ? AND user_id = ? LIMIT 1',
    [teamId, userId]
  );
  return rows.length > 0;
}

async function follow(req, res, next) {
  try {
    const { followee_id, followee_type } = req.body;
    const result = await socialModel.follow(req.userId, followee_id, followee_type || 'user');
    if (!result) return errorResponse(res, 'Already following', 409);
    return successResponse(res, null, 'Followed');
  } catch (err) { next(err); }
}

async function unfollow(req, res, next) {
  try {
    const { followee_id, followee_type } = req.body;
    await socialModel.unfollow(req.userId, followee_id, followee_type || 'user');
    return successResponse(res, null, 'Unfollowed');
  } catch (err) { next(err); }
}

async function createPost(req, res, next) {
  try {
    const { content, team_id } = req.body;
    if (!(await isTeamMember(req.userId, team_id))) return errorResponse(res, 'Forbidden: not a member of this team', 403);
    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const mediaType = req.file ? (req.file.mimetype.startsWith('video') ? 'video' : 'image') : 'none';
    const post = await socialModel.createPost(req.userId, team_id, content, mediaUrl, mediaType);
    return successResponse(res, post, 'Post created', 201);
  } catch (err) { next(err); }
}

async function getFeed(req, res, next) {
  try {
    const { page, limit } = paginate(req.query.page, req.query.limit);
    const feed = await socialModel.getFeed(req.userId, page, limit);
    return successResponse(res, feed);
  } catch (err) { next(err); }
}

async function toggleLike(req, res, next) {
  try {
    const { target_id, target_type } = req.body;
    const liked = await socialModel.toggleLike(req.userId, target_id, target_type);
    return successResponse(res, { liked });
  } catch (err) { next(err); }
}

async function addComment(req, res, next) {
  try {
    const { target_id, target_type, content } = req.body;
    const comment = await socialModel.addComment(req.userId, target_id, target_type, content);
    return successResponse(res, comment, 'Comment added', 201);
  } catch (err) { next(err); }
}

async function createReel(req, res, next) {
  try {
    const { team_id, video_url, thumbnail_url, title } = req.body;
    if (!(await isTeamMember(req.userId, team_id))) return errorResponse(res, 'Forbidden: not a member of this team', 403);
    const videoUrl = video_url || (req.file ? `/uploads/${req.file.filename}` : null);
    if (!videoUrl) return errorResponse(res, 'Video URL required', 400);
    const reel = await socialModel.createReel(req.userId, team_id, videoUrl, thumbnail_url, title);
    return successResponse(res, reel, 'Reel created', 201);
  } catch (err) { next(err); }
}

async function getReels(req, res, next) {
  try {
    const { page, limit } = paginate(req.query.page, req.query.limit);
    const reels = await socialModel.getReels(page, limit);
    return successResponse(res, reels);
  } catch (err) { next(err); }
}

async function getConversations(req, res, next) {
  try {
    const convs = await socialModel.getConversations(req.userId);
    return successResponse(res, convs);
  } catch (err) { next(err); }
}

async function getMessages(req, res, next) {
  try {
    const messages = await socialModel.getMessages(req.userId, req.params.userId);
    return successResponse(res, messages);
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const { receiver_id, content } = req.body;
    const message = await socialModel.sendMessage(req.userId, receiver_id, content);
    return successResponse(res, message, 'Message sent', 201);
  } catch (err) { next(err); }
}

module.exports = { follow, unfollow, createPost, getFeed, toggleLike, addComment, createReel, getReels, getConversations, getMessages, sendMessage };
