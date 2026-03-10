const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function createMatch(tournamentId, homeTeamId, awayTeamId, roundId = null, groupId = null, leg = 1) {
  const id = uuidv4();
  await pool.query(
    'INSERT INTO matches (id, tournament_id, round_id, group_id, home_team_id, away_team_id, leg) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, tournamentId, roundId, groupId, homeTeamId, awayTeamId, leg]
  );
  return id;
}

async function createRound(tournamentId, roundName, roundNumber) {
  const id = uuidv4();
  await pool.query(
    'INSERT INTO bracket_rounds (id, tournament_id, round_name, round_number) VALUES (?, ?, ?, ?)',
    [id, tournamentId, roundName, roundNumber]
  );
  return id;
}

async function generateGroupStage(tournament, teamIds, groupSize = 4) {
  const teams = shuffle(teamIds);
  const groups = [];
  for (let i = 0; i < teams.length; i += groupSize) {
    groups.push(teams.slice(i, i + groupSize));
  }
  const groupLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let gi = 0; gi < groups.length; gi++) {
    const gId = uuidv4();
    await pool.query('INSERT INTO groups (id, tournament_id, name) VALUES (?, ?, ?)', [gId, tournament.id, `Group ${groupLabels[gi]}`]);
    for (const tid of groups[gi]) {
      await pool.query('INSERT INTO group_teams (id, group_id, team_id) VALUES (?, ?, ?)', [uuidv4(), gId, tid]);
    }
    for (let a = 0; a < groups[gi].length; a++) {
      for (let b = a + 1; b < groups[gi].length; b++) {
        await createMatch(tournament.id, groups[gi][a], groups[gi][b], null, gId);
      }
    }
  }
}

async function generateSingleElimination(tournament, teamIds) {
  const teams = shuffle(teamIds);
  const roundNames = { 64: 'Round of 64', 32: 'Round of 32', 16: 'Round of 16', 8: 'Quarterfinals', 4: 'Semifinals', 2: 'Final' };
  let size = 1;
  while (size < teams.length) size *= 2;
  const byeCount = size - teams.length;
  const padded = [...teams, ...Array(byeCount).fill('BYE')];
  const roundId = await createRound(tournament.id, roundNames[size] || `Round of ${size}`, 1);
  for (let i = 0; i < padded.length; i += 2) {
    if (padded[i] !== 'BYE' && padded[i + 1] !== 'BYE') {
      await createMatch(tournament.id, padded[i], padded[i + 1], roundId);
    }
  }
}

async function generateDoubleElimination(tournament, teamIds) {
  const teams = shuffle(teamIds);
  const roundId = await createRound(tournament.id, 'Winners Round 1', 1);
  for (const tid of teams) {
    await pool.query(
      'INSERT INTO de_brackets (id, tournament_id, team_id, bracket) VALUES (?, ?, ?, ?)',
      [uuidv4(), tournament.id, tid, 'winners']
    );
  }
  for (let i = 0; i < teams.length; i += 2) {
    if (teams[i + 1]) {
      await createMatch(tournament.id, teams[i], teams[i + 1], roundId);
    } else {
      await pool.query(
        "UPDATE de_brackets SET bracket = 'winners_bye' WHERE tournament_id = ? AND team_id = ?",
        [tournament.id, teams[i]]
      );
    }
  }
}

async function generateLeaguePlayoffs(tournament, teamIds) {
  const teams = shuffle(teamIds);
  for (const tid of teams) {
    await pool.query(
      'INSERT INTO league_standings (id, tournament_id, team_id) VALUES (?, ?, ?)',
      [uuidv4(), tournament.id, tid]
    );
  }
  const home = teams.slice(0, Math.ceil(teams.length / 2));
  const away = teams.slice(Math.ceil(teams.length / 2));
  const roundId = await createRound(tournament.id, 'League Phase', 1);
  let matchCount = {};
  teams.forEach(t => { matchCount[t] = 0; });
  for (let i = 0; i < home.length; i++) {
    for (let j = 0; j < away.length; j++) {
      if (home[i] !== away[j] && matchCount[home[i]] < 4 && matchCount[away[j]] < 4) {
        await createMatch(tournament.id, home[i], away[j], roundId);
        matchCount[home[i]]++;
        matchCount[away[j]]++;
      }
    }
  }
}

async function generateClassicLeague(tournament, teamIds) {
  const teams = shuffle(teamIds);
  for (const tid of teams) {
    await pool.query(
      'INSERT INTO league_standings (id, tournament_id, team_id) VALUES (?, ?, ?)',
      [uuidv4(), tournament.id, tid]
    );
  }
  const roundId = await createRound(tournament.id, 'League', 1);
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      await createMatch(tournament.id, teams[i], teams[j], roundId);
    }
  }
}

async function generate(tournament, teamIds) {
  switch (tournament.format) {
    case 'group_knockout':
      await generateGroupStage(tournament, teamIds, 4);
      break;
    case 'single_elim':
      await generateSingleElimination(tournament, teamIds);
      break;
    case 'double_elim':
      await generateDoubleElimination(tournament, teamIds);
      break;
    case 'league_playoffs':
      await generateLeaguePlayoffs(tournament, teamIds);
      break;
    case 'classic_league':
      await generateClassicLeague(tournament, teamIds);
      break;
    default:
      throw new Error(`Unknown tournament format: ${tournament.format}`);
  }
}

module.exports = { generate, generateGroupStage, generateSingleElimination, generateDoubleElimination, generateLeaguePlayoffs, generateClassicLeague };
