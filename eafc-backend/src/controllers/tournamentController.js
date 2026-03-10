const tournamentModel = require('../models/tournamentModel');
const tournamentService = require('../services/tournamentService');
const { successResponse, errorResponse } = require('../utils/helpers');

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
    if (t.status !== 'draft') return errorResponse(res, 'Tournament already started', 400);
    const teams = await tournamentModel.getTeams(t.id);
    if (teams.length >= t.max_teams) return errorResponse(res, 'Tournament is full', 400);
    await tournamentModel.addTeam(t.id, req.body.team_id);
    return successResponse(res, null, 'Team joined tournament');
  } catch (err) { next(err); }
}

async function startTournament(req, res, next) {
  try {
    const t = await tournamentModel.findById(req.params.id);
    if (!t) return errorResponse(res, 'Tournament not found', 404);
    if (t.status !== 'draft') return errorResponse(res, 'Tournament already started', 400);
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

module.exports = { createTournament, getTournament, joinTournament, startTournament, getBrackets, getGroups, getStandings };
