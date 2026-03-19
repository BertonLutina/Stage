const userModel = require('../models/userModel');
const { successResponse, errorResponse } = require('../utils/helpers');

async function getProfile(req, res, next) {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    const stats = await userModel.getStats(user.id);
    const teams = await userModel.getTeams(user.id);
    const followers = await userModel.getFollowersCount(user.id);
    return successResponse(res, { ...user, stats, teams, followers_count: followers });
  } catch (err) { next(err); }
}

async function getMe(req, res, next) {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) return errorResponse(res, 'User not found', 404);
    const stats = await userModel.getStats(user.id);
    const teams = await userModel.getTeams(user.id);
    const followers = await userModel.getFollowersCount(user.id);
    return successResponse(res, { ...user, stats, teams, followers_count: followers });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    if (req.params.id !== req.userId) return errorResponse(res, 'Forbidden', 403);
    const data = req.body;
    if (req.file) data.avatar = `/uploads/${req.file.filename}`;
    const user = await userModel.update(req.userId, data);
    return successResponse(res, user);
  } catch (err) { next(err); }
}

async function updateMe(req, res, next) {
  try {
    const data = req.body;
    if (req.file) data.avatar = `/uploads/${req.file.filename}`;
    const user = await userModel.update(req.userId, data);
    return successResponse(res, user);
  } catch (err) { next(err); }
}

async function getAvailability(req, res, next) {
  try {
    const slots = await userModel.getAvailability(req.params.id);
    return successResponse(res, slots);
  } catch (err) { next(err); }
}

async function setAvailability(req, res, next) {
  try {
    const slots = await userModel.setAvailability(req.userId, req.body.slots);
    return successResponse(res, slots);
  } catch (err) { next(err); }
}

async function getStats(req, res, next) {
  try {
    const stats = await userModel.getStats(req.params.id);
    if (!stats) return errorResponse(res, 'User not found', 404);
    return successResponse(res, stats);
  } catch (err) { next(err); }
}

module.exports = { getProfile, getMe, updateProfile, updateMe, getAvailability, setAvailability, getStats };
