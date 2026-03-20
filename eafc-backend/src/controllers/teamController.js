const teamModel = require('../models/teamModel');
const { successResponse, errorResponse } = require('../utils/helpers');

async function listTeamsWithPlayers(req, res, next) {
  try {
    const teams = await teamModel.findAllWithPlayers();
    return successResponse(res, teams);
  } catch (err) { next(err); }
}

async function createTeam(req, res, next) {
  try {
    const count = await teamModel.getUserTeamCount(req.userId);
    if (count >= 3) return errorResponse(res, 'Maximum 3 teams allowed', 400);
    const data = { ...req.body, owner_id: req.userId };
    if (req.file) data.avatar = `/uploads/${req.file.filename}`;
    const team = await teamModel.create(data);
    return successResponse(res, team, 'Team created', 201);
  } catch (err) { next(err); }
}

async function getTeam(req, res, next) {
  try {
    const team = await teamModel.findById(req.params.id);
    if (!team) return errorResponse(res, 'Team not found', 404);
    const players = await teamModel.getPlayers(team.id);
    return successResponse(res, { ...team, players });
  } catch (err) { next(err); }
}

async function updateTeam(req, res, next) {
  try {
    const data = req.body;
    if (req.file) data.avatar = `/uploads/${req.file.filename}`;
    const team = await teamModel.update(req.params.id, data);
    return successResponse(res, team);
  } catch (err) { next(err); }
}

async function getPlayers(req, res, next) {
  try {
    const players = await teamModel.getPlayers(req.params.id);
    return successResponse(res, players);
  } catch (err) { next(err); }
}

async function addPlayer(req, res, next) {
  try {
    const { user_id, role } = req.body;
    const count = await teamModel.getUserTeamCount(user_id);
    if (count >= 3) return errorResponse(res, 'Player already in 3 teams', 400);
    const players = await teamModel.addPlayer(req.params.id, user_id, role);
    if (!players) return errorResponse(res, 'Player already in team', 409);
    return successResponse(res, players);
  } catch (err) { next(err); }
}

async function removePlayer(req, res, next) {
  try {
    const team = await teamModel.findById(req.params.id);
    if (req.params.userId === team.owner_id) return errorResponse(res, 'Cannot remove team owner', 400);
    await teamModel.removePlayer(req.params.id, req.params.userId);
    return successResponse(res, null, 'Player removed');
  } catch (err) { next(err); }
}

async function getFormation(req, res, next) {
  try {
    const formation = await teamModel.getActiveFormation(req.params.id);
    return successResponse(res, formation);
  } catch (err) { next(err); }
}

async function saveFormation(req, res, next) {
  try {
    const { name, positions } = req.body;
    const formation = await teamModel.saveFormation(req.params.id, name, positions);
    return successResponse(res, formation);
  } catch (err) { next(err); }
}

async function getDressingRoom(req, res, next) {
  try {
    const room = await teamModel.getDressingRoom(req.params.id);
    return successResponse(res, room);
  } catch (err) { next(err); }
}

async function getTeamChat(req, res, next) {
  try {
    const messages = await teamModel.getTeamChat(req.params.id);
    return successResponse(res, messages);
  } catch (err) { next(err); }
}

async function joinTeam(req, res, next) {
  try {
    const count = await teamModel.getUserTeamCount(req.userId);
    if (count >= 3) return errorResponse(res, 'Maximum 3 teams allowed', 400);
    const players = await teamModel.addPlayer(req.params.id, req.userId, 'player');
    if (!players) return errorResponse(res, 'Already in team', 409);
    const team = await teamModel.findById(req.params.id);
    const updated = { ...team, players };
    return successResponse(res, updated, 'Joined team');
  } catch (err) { next(err); }
}

async function leaveTeam(req, res, next) {
  try {
    const team = await teamModel.findById(req.params.id);
    if (!team) return errorResponse(res, 'Team not found', 404);
    if (team.owner_id === req.userId) return errorResponse(res, 'Owner cannot leave. Transfer ownership first.', 400);
    await teamModel.removePlayer(req.params.id, req.userId);
    const players = await teamModel.getPlayers(req.params.id);
    return successResponse(res, { ...team, players }, 'Left team');
  } catch (err) { next(err); }
}

async function requestToJoin(req, res, next) {
  try {
    const team = await teamModel.findById(req.params.id);
    if (!team) return errorResponse(res, 'Team not found', 404);
    if (await teamModel.isTeamMember(req.params.id, req.userId)) return errorResponse(res, 'Already in team', 400);
    const count = await teamModel.getUserTeamCount(req.userId);
    if (count >= 3) return errorResponse(res, 'Maximum 3 teams allowed', 400);
    const result = await teamModel.createJoinRequest(req.params.id, req.userId);
    if (result.existing) return errorResponse(res, 'Request already pending', 409);
    return successResponse(res, { status: 'pending' }, 'Join request sent');
  } catch (err) { next(err); }
}

async function getMyRequestStatus(req, res, next) {
  try {
    const reqStatus = await teamModel.getUserPendingRequest(req.params.id, req.userId);
    return successResponse(res, reqStatus ? { status: reqStatus.status } : { status: null });
  } catch (err) { next(err); }
}

async function getJoinRequests(req, res, next) {
  try {
    const requests = await teamModel.getPendingJoinRequests(req.params.id);
    return successResponse(res, requests);
  } catch (err) { next(err); }
}

async function acceptJoinRequest(req, res, next) {
  try {
    const result = await teamModel.acceptJoinRequest(req.params.requestId, req.params.id, req.userId);
    if (!result) return errorResponse(res, 'Request not found or already processed', 404);
    const io = req.app.get('io');
    if (io) {
      io.of('/notifications').to(`user_${result.userId}`).emit('join_accepted', {
        teamId: req.params.id,
        teamName: result.teamName,
        gamerTag: result.gamerTag,
      });
    }
    const team = await teamModel.findById(req.params.id);
    const players = await teamModel.getPlayers(req.params.id);
    return successResponse(res, { ...team, players }, 'Request accepted');
  } catch (err) { next(err); }
}

async function declineJoinRequest(req, res, next) {
  try {
    const ok = await teamModel.declineJoinRequest(req.params.requestId, req.params.id, req.userId);
    if (!ok) return errorResponse(res, 'Request not found or already processed', 404);
    return successResponse(res, null, 'Request declined');
  } catch (err) { next(err); }
}

module.exports = {
  listTeamsWithPlayers,
  createTeam,
  getTeam,
  updateTeam,
  getPlayers,
  addPlayer,
  removePlayer,
  getFormation,
  saveFormation,
  getDressingRoom,
  getTeamChat,
  joinTeam,
  leaveTeam,
  requestToJoin,
  getMyRequestStatus,
  getJoinRequests,
  acceptJoinRequest,
  declineJoinRequest,
};
