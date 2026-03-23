const { pool } = require('../config/db');
const tournamentModel = require('../models/tournamentModel');
const matchModel = require('../models/matchModel');

const DEFAULT_SLOT_IDS = ['slot-1000', 'slot-1200', 'slot-1400', 'slot-1600', 'slot-1800', 'slot-2000'];

/**
 * Get all time slots from DB (or fallback to defaults)
 */
async function getTimeSlots() {
  const [rows] = await pool.query('SELECT * FROM time_slots ORDER BY sort_order ASC');
  if (rows.length > 0) return rows;
  return [
    { id: 'slot-1000', start_time: '10:00:00', sort_order: 1 },
    { id: 'slot-1200', start_time: '12:00:00', sort_order: 2 },
    { id: 'slot-1400', start_time: '14:00:00', sort_order: 3 },
    { id: 'slot-1600', start_time: '16:00:00', sort_order: 4 },
    { id: 'slot-1800', start_time: '18:00:00', sort_order: 5 },
    { id: 'slot-2000', start_time: '20:00:00', sort_order: 6 },
  ];
}

/**
 * Build list of (date, slot) combinations within tournament range.
 * All datetimes in UTC.
 */
function buildScheduleGrid(startDate, endDate, slots) {
  const grid = [];
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    for (const slot of slots) {
      const timeStr = typeof slot.start_time === 'string' ? slot.start_time : String(slot.start_time);
      const [h, m, s] = timeStr.split(':').map((x) => parseInt(x, 10) || 0);
      const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m, s));
      grid.push({ date: dateStr, slotId: slot.id, scheduledAt: dt });
    }
  }
  return grid;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Assign schedule slots to matches ensuring:
 * - No team plays 2 matches at same time
 * - No overlapping matches in same slot (same slot = same time, so one match per slot)
 * Returns assignments: [{ matchId, scheduledAt, timeSlotId }]
 */
function assignSchedules(matches, grid) {
  const teamBusy = new Map();
  const slotUsed = new Set();

  const assignments = [];
  const shuffledMatches = shuffle(matches);

  for (const match of shuffledMatches) {
    const home = match.home_team_id;
    const away = match.away_team_id;
    let assigned = false;

    const shuffledGrid = shuffle(grid);

    for (const cell of shuffledGrid) {
      const key = `${cell.date}_${cell.slotId}`;
      if (slotUsed.has(key)) continue;

      const homeBusy = teamBusy.get(home) || new Set();
      const awayBusy = teamBusy.get(away) || new Set();
      if (homeBusy.has(key) || awayBusy.has(key)) continue;

      slotUsed.add(key);
      homeBusy.add(key);
      awayBusy.add(key);
      teamBusy.set(home, homeBusy);
      teamBusy.set(away, awayBusy);

      assignments.push({
        matchId: match.id,
        scheduledAt: cell.scheduledAt,
        timeSlotId: cell.slotId,
      });
      assigned = true;
      break;
    }

    if (!assigned) {
      throw new Error(`Could not assign schedule for match ${match.id}: no valid slot available. Try extending tournament dates or adding more time slots.`);
    }
  }

  return assignments;
}

/**
 * Generate schedule for all matches in a tournament.
 * Matches must already exist (created by tournament start).
 * Requires tournament to have start_date and end_date set.
 */
async function generateMatches(tournamentId) {
  const tournament = await tournamentModel.findById(tournamentId);
  if (!tournament) throw new Error('Tournament not found');
  if (!tournament.start_date || !tournament.end_date) {
    throw new Error('Tournament must have start_date and end_date set before generating schedule');
  }

  const matches = await matchModel.getByTournament(tournamentId);
  if (matches.length === 0) throw new Error('No matches to schedule. Start the tournament first.');

  const slots = await getTimeSlots();
  const grid = buildScheduleGrid(tournament.start_date, tournament.end_date, slots);

  if (grid.length < matches.length) {
    throw new Error(
      `Not enough schedule slots: ${matches.length} matches need scheduling, but only ${grid.length} slots available. ` +
      'Extend tournament dates or add more time slots.'
    );
  }

  const assignments = assignSchedules(matches, grid);

  for (const a of assignments) {
    await matchModel.updateSchedule(a.matchId, a.scheduledAt, a.timeSlotId);
  }

  return assignments.length;
}

/**
 * Randomize all match schedules in a tournament.
 * Reassigns dates and time slots randomly, respecting constraints.
 * Safe to run multiple times.
 */
async function randomizeMatchSchedule(tournamentId) {
  return generateMatches(tournamentId);
}

/**
 * Validate that updating a match's schedule would not create conflicts.
 * When setting schedule: both scheduledAt and timeSlotId required.
 */
async function validateMatchSchedule(matchId, scheduledAt, timeSlotId) {
  const match = await matchModel.findById(matchId);
  if (!match) throw new Error('Match not found');

  const tournament = await tournamentModel.findById(match.tournament_id);
  if (!tournament) throw new Error('Tournament not found');

  if (!scheduledAt && !timeSlotId) return;

  if (scheduledAt && !timeSlotId) {
    throw new Error('time_slot_id is required when setting scheduled_at');
  }
  if (timeSlotId && !scheduledAt) {
    throw new Error('scheduled_at is required when setting time_slot_id');
  }

  const scheduledDate = new Date(scheduledAt).toISOString().slice(0, 10);
  if (tournament.start_date && new Date(scheduledDate) < new Date(tournament.start_date)) {
    throw new Error('Match date is before tournament start date');
  }
  if (tournament.end_date && new Date(scheduledDate) > new Date(tournament.end_date)) {
    throw new Error('Match date is after tournament end date');
  }

  const conflicts = await matchModel.findScheduleConflicts(
    match.tournament_id,
    match.home_team_id,
    match.away_team_id,
    scheduledAt,
    timeSlotId,
    matchId
  );
  if (conflicts.length > 0) {
    throw new Error('Schedule conflict: another match or team is already assigned to this date/time slot');
  }
}

module.exports = {
  getTimeSlots,
  generateMatches,
  randomizeMatchSchedule,
  validateMatchSchedule,
  buildScheduleGrid,
};
