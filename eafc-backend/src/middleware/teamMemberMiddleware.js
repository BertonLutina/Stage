const teamModel = require('../models/teamModel');
const { errorResponse } = require('../utils/helpers');

async function teamMemberMiddleware(req, res, next) {
  const teamId = req.params.teamId || req.params.id;
  try {
    const team = await teamModel.findById(teamId);
    if (!team) return errorResponse(res, 'Team not found', 404);
    const isMember = await teamModel.isTeamMember(teamId, req.userId);
    if (!isMember) return errorResponse(res, 'You must be a team member to access team chat', 403);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = teamMemberMiddleware;
