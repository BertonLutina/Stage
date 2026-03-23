const matchModel = require('../models/matchModel');
const tournamentModel = require('../models/tournamentModel');
const schedulingService = require('../services/schedulingService');
const { successResponse, errorResponse } = require('../utils/helpers');

async function getMatch(req, res, next) {
  try {
    const match = await matchModel.findById(req.params.id);
    if (!match) return errorResponse(res, 'Match not found', 404);
    return successResponse(res, match);
  } catch (err) { next(err); }
}

async function updateScore(req, res, next) {
  try {
    const { home_score, away_score } = req.body;
    const match = await matchModel.updateScore(req.params.id, home_score, away_score, req.userId);
    return successResponse(res, match);
  } catch (err) { next(err); }
}

async function addVideo(req, res, next) {
  try {
    const { video_url, video_source } = req.body;
    const match = await matchModel.addVideo(req.params.id, req.userId, video_url, video_source);
    return successResponse(res, match);
  } catch (err) { next(err); }
}

async function getFixtures(req, res, next) {
  try {
    const { tournament_id, status } = req.query;
    const fixtures = await matchModel.getFixtures(tournament_id, status);
    return successResponse(res, fixtures);
  } catch (err) { next(err); }
}

async function getMatchChat(req, res, next) {
  try {
    const { search, filter, unread } = req.query;
    const opts = {};
    if (search && search.trim()) opts.search = search.trim();
    if (filter && filter !== 'all') opts.messageType = Array.isArray(filter) ? filter.join(',') : filter;
    if ((unread === 'true' || unread === '1') && req.userId) opts.unreadByUserId = req.userId;
    const comments = await matchModel.getMatchChat(req.params.id, 200, opts);
    return successResponse(res, comments);
  } catch (err) { next(err); }
}

async function markMatchChatRead(req, res, next) {
  try {
    await matchModel.markMatchChatRead(req.params.id, req.userId);
    return successResponse(res, null, 'Marked as read');
  } catch (err) { next(err); }
}

async function updateSchedule(req, res, next) {
  try {
    const { id: matchId } = req.params;
    const { scheduled_at, time_slot_id } = req.body;
    const match = await matchModel.findById(matchId);
    if (!match) return errorResponse(res, 'Match not found', 404);
    const t = await tournamentModel.findById(match.tournament_id);
    if (!t) return errorResponse(res, 'Tournament not found', 404);
    if (t.owner_id !== req.userId) return errorResponse(res, 'Only the tournament owner can update match schedule', 403);
    const scheduledAt = scheduled_at ? new Date(scheduled_at) : null;
    const slotId = time_slot_id || null;
    await schedulingService.validateMatchSchedule(matchId, scheduledAt, slotId);
    await matchModel.updateSchedule(matchId, scheduledAt, slotId);
    const updated = await matchModel.findById(matchId);
    return successResponse(res, updated, 'Schedule updated');
  } catch (err) { next(err); }
}

module.exports = { getMatch, updateScore, addVideo, getFixtures, getMatchChat, markMatchChatRead, updateSchedule };
