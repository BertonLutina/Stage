const tournamentModel = require('../models/tournamentModel');
const tournamentService = require('../services/tournamentService');
const schedulingService = require('../services/schedulingService');
const teamModel = require('../models/teamModel');
const { successResponse, errorResponse } = require('../utils/helpers');

async function listTournaments(req, res, next) {
  try {
    const { page, pageSize, search } = req.query;
    const result = await tournamentModel.allTournaments({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      search,
    });
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}
async function createTournament(req, res, next) {
  try {
    const active = await tournamentModel.getUserActiveTournament(req.userId);
    if (active) return errorResponse(res, 'Complete your active tournament first', 400);
    const tournament = await tournamentModel.create({ ...req.body, owner_id: req.userId });
    return successResponse(res, tournament, 'Tournament created', 201);
  } catch (err) { next(err); }
}

async function getTournament(req, res, next) {
  try {
    const t = await tournamentModel.findById(req.params.id);
    if (!t) return errorResponse(res, 'Tournament not found', 404);
    const teams = await tournamentModel.getTeams(t.id);
    return successResponse(res, { ...t, teams });
  } catch (err) { next(err); }
}

async function joinTournament(req, res, next) {
  try {
    const t = await tournamentModel.findById(req.params.id);
    if (!t) return errorResponse(res, 'Tournament not found', 404);
    if (t.status === 'full') return errorResponse(res, 'Tournament is full', 400);
    if (t.status !== 'draft') return errorResponse(res, 'Tournament already started', 400);
    if (t.visibility === 'closed') return errorResponse(res, 'This is a closed tournament — only the owner can add teams', 403);
    const team = await teamModel.findById(req.body.team_id);
    if (!team || team.owner_id !== req.userId) return errorResponse(res, 'Forbidden: you do not own this team', 403);
    const teams = await tournamentModel.getTeams(t.id);
    if (teams.length >= t.max_teams) return errorResponse(res, 'Tournament is full', 400);
    await tournamentModel.addTeam(t.id, req.body.team_id);
    const newCount = teams.length + 1;
    if (newCount >= t.max_teams) {
      await tournamentModel.updateStatus(t.id, 'full');
    }
    return successResponse(res, null, 'Team joined tournament');
  } catch (err) { next(err); }
}

async function inviteTeams(req, res, next) {
  try {
    const t = await tournamentModel.findById(req.params.id);
    if (!t) return errorResponse(res, 'Tournament not found', 404);
    if (t.status === 'full') return errorResponse(res, 'Tournament is full', 400);
    if (t.owner_id !== req.userId) return errorResponse(res, 'Only the tournament owner can invite teams', 403);
    if (t.status !== 'draft') return errorResponse(res, 'Tournament already started', 400);
    const { team_ids } = req.body;
    if (!Array.isArray(team_ids) || team_ids.length === 0) return errorResponse(res, 'team_ids must be a non-empty array', 400);
    const existing = await tournamentModel.getTeams(t.id);
    const slots = t.max_teams - existing.length;
    if (team_ids.length > slots) return errorResponse(res, `Only ${slots} slot(s) remaining`, 400);
    for (const teamId of team_ids) {
      await tournamentModel.addTeam(t.id, teamId);
    }
    const newCount = existing.length + team_ids.length;
    if (newCount >= t.max_teams) {
      await tournamentModel.updateStatus(t.id, 'full');
    }
    return successResponse(res, null, `${team_ids.length} team(s) added`);
  } catch (err) { next(err); }
}

async function startTournament(req, res, next) {
  try {
    const t = await tournamentModel.findById(req.params.id);
    if (!t) return errorResponse(res, 'Tournament not found', 404);
    if (t.status !== 'draft' && t.status !== 'full') return errorResponse(res, 'Tournament already started', 400);
    const teams = await tournamentModel.getTeams(t.id);
    await tournamentService.generate(t, teams.map(tt => tt.team_id));
    await tournamentModel.updateStatus(t.id, 'active');
    return successResponse(res, null, 'Tournament started');
  } catch (err) { next(err); }
}

async function getBrackets(req, res, next) {
  try {
    const rounds = await tournamentModel.getBracketRounds(req.params.id);
    return successResponse(res, rounds);
  } catch (err) { next(err); }
}

async function getGroups(req, res, next) {
  try {
    const groups = await tournamentModel.getGroups(req.params.id);
    return successResponse(res, groups);
  } catch (err) { next(err); }
}

async function getStandings(req, res, next) {
  try {
    const standings = await tournamentModel.getLeagueStandings(req.params.id);
    return successResponse(res, standings);
  } catch (err) { next(err); }
}

async function setDates(req, res, next) {
  try {
    const t = await tournamentModel.findById(req.params.id);
    if (!t) return errorResponse(res, 'Tournament not found', 404);
    if (t.owner_id !== req.userId) return errorResponse(res, 'Only the tournament owner can set dates', 403);
    if (t.status !== 'draft' && t.status !== 'full') return errorResponse(res, 'Cannot change dates after tournament started', 400);
    const { start_date, end_date } = req.body;
    if (!start_date || !end_date) return errorResponse(res, 'start_date and end_date are required', 400);
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return errorResponse(res, 'Invalid date format', 400);
    if (start > end) return errorResponse(res, 'start_date must be before end_date', 400);
    await tournamentModel.updateDates(req.params.id, start_date, end_date);
    return successResponse(res, null, 'Dates updated');
  } catch (err) { next(err); }
}

async function generateMatchSchedule(req, res, next) {
  try {
    const t = await tournamentModel.findById(req.params.id);
    if (!t) return errorResponse(res, 'Tournament not found', 404);
    if (t.owner_id !== req.userId) return errorResponse(res, 'Only the tournament owner can generate schedule', 403);
    if (t.status !== 'active') return errorResponse(res, 'Tournament must be started first', 400);
    const count = await schedulingService.generateMatches(req.params.id);
    return successResponse(res, { scheduled: count }, 'Schedule generated');
  } catch (err) { next(err); }
}

async function randomizeMatchSchedule(req, res, next) {
  try {
    const t = await tournamentModel.findById(req.params.id);
    if (!t) return errorResponse(res, 'Tournament not found', 404);
    if (t.owner_id !== req.userId) return errorResponse(res, 'Only the tournament owner can randomize schedule', 403);
    if (t.status !== 'active') return errorResponse(res, 'Tournament must be started first', 400);
    const count = await schedulingService.randomizeMatchSchedule(req.params.id);
    return successResponse(res, { scheduled: count }, 'Schedule randomized');
  } catch (err) { next(err); }
}

async function getTimeSlots(req, res, next) {
  try {
    const slots = await schedulingService.getTimeSlots();
    return successResponse(res, slots);
  } catch (err) { next(err); }
}

module.exports = {
  listTournaments,
  createTournament,
  getTournament,
  joinTournament,
  inviteTeams,
  startTournament,
  getBrackets,
  getGroups,
  getStandings,
  setDates,
  generateMatchSchedule,
  randomizeMatchSchedule,
  getTimeSlots,
};
