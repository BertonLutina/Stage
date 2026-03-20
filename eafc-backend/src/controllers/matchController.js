const matchModel = require('../models/matchModel');
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
    const comments = await matchModel.getMatchChat(req.params.id);
    return successResponse(res, comments);
  } catch (err) { next(err); }
}

module.exports = { getMatch, updateScore, addVideo, getFixtures, getMatchChat };
