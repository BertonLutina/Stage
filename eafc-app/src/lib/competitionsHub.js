import { stageClient } from '@/api/stageClient';

/**
 * Data for the Competitions screen (task 8): GOST, regional cups, regional leagues,
 * the club's season registrations and the registration window. Every section loads
 * on its own so one failing endpoint never blanks the screen.
 */

const ENDED_REGISTRATION = new Set(['rejected', 'removed', 'withdrawn', 'cancelled', 'canceled']);

function errorMessage(err, fallback = 'Request failed') {
  return err?.message || fallback;
}

async function section(errors, key, run, fallback) {
  try {
    return await run();
  } catch (err) {
    errors[key] = errorMessage(err);
    return fallback;
  }
}

export async function loadCompetitionsHub({ clubId } = {}) {
  const errors = {};
  const [gost, cups, leagues, windows, registrations] = await Promise.all([
    section(errors, 'gost', async () => {
      const data = await stageClient.http.get('/gost/overview');
      return Array.isArray(data?.competitions) ? data.competitions : [];
    }, []),
    section(errors, 'cups', async () => {
      const data = await stageClient.http.get('/regional-leagues/cups/public');
      return Array.isArray(data?.cups) ? data.cups : [];
    }, []),
    section(errors, 'leagues', async () => {
      const data = await stageClient.http.get('/regional-public/overview');
      return Array.isArray(data?.editions) ? data.editions : [];
    }, []),
    section(errors, 'windows', async () => {
      const data = await stageClient.http.get('/regional-leagues/registration-windows');
      return Array.isArray(data?.windows) ? data.windows : [];
    }, []),
    clubId
      ? section(errors, 'registrations', async () => {
        const rows = await stageClient.entities.SeasonRegistration.filter({ club_id: clubId }, '-applied_at', 50);
        return Array.isArray(rows) ? rows : [];
      }, [])
      : Promise.resolve([]),
  ]);
  return { gost, cups, leagues, windows, registrations, errors };
}

/** One regional cup row. `round` is the latest drawn round that still has an unplayed match, else the latest drawn one. */
export function summarizeCup(cup, myClubId) {
  const rounds = Array.isArray(cup?.rounds) ? cup.rounds : [];
  const drawn = rounds.filter((r) => r?.drawn);
  const isOpen = (r) => (r.matches || []).some((m) => String(m.status || '').toLowerCase() !== 'completed');
  const current = drawn.find(isOpen) || drawn[drawn.length - 1] || null;
  const participants = Array.isArray(cup?.participants) ? cup.participants : [];
  const isMine = Boolean(myClubId) && participants.some((p) => String(p.id) === String(myClubId));

  let myNext = null;
  if (isMine) {
    outer: for (const round of drawn) {
      for (const m of round.matches || []) {
        const mine = String(m.home_club_id) === String(myClubId) || String(m.away_club_id) === String(myClubId);
        if (mine && String(m.status || '').toLowerCase() !== 'completed') {
          myNext = { matchId: m.id, kickoffAt: m.kickoff_at || null };
          break outer;
        }
      }
    }
  }

  return {
    id: cup?.id,
    name: cup?.name,
    regionSlug: cup?.region_slug || null,
    status: cup?.status || null,
    participantCount: Number(cup?.participant_count ?? participants.length) || 0,
    round: current ? current.number : null,
    isMine,
    myNext,
  };
}

/** Current, non-retired regional editions grouped by region (my region first), Division 1 first. */
export function groupLeaguesByRegion(editions, { regionSlug } = {}) {
  const rows = (Array.isArray(editions) ? editions : []).filter((e) => e && e.is_current && !e.retired);
  const byRegion = new Map();
  rows.forEach((edition) => {
    const key = edition.region_slug || 'other';
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key).push(edition);
  });
  const groups = [...byRegion.entries()].map(([slug, list]) => ({
    regionSlug: slug,
    editions: list.slice().sort((a, b) => Number(a.division) - Number(b.division) || String(a.name).localeCompare(String(b.name))),
  }));
  groups.sort((a, b) => {
    if (regionSlug) {
      if (a.regionSlug === regionSlug) return -1;
      if (b.regionSlug === regionSlug) return 1;
    }
    return a.regionSlug.localeCompare(b.regionSlug);
  });
  return groups;
}

function registrationTone(status) {
  const key = String(status || '').toLowerCase();
  if (key === 'approved') return 'success';
  if (ENDED_REGISTRATION.has(key)) return 'danger';
  return 'warning';
}

/** One row of "My registrations", read from the real season_registration record. */
export function summarizeRegistration(record) {
  const confirmed = Array.isArray(record?.confirmed_player_ids) ? record.confirmed_player_ids.length : 0;
  const division = record?.assigned_division ?? null;
  return {
    id: record?.id,
    regionSlug: record?.region_slug || null,
    regionName: record?.region_name || null,
    seasonNumber: record?.season_number ?? null,
    division: division == null || division === '' ? null : Number(division),
    status: record?.status || null,
    participationStatus: record?.participation_status || null,
    confirmedPlayers: confirmed,
    tone: registrationTone(record?.status),
  };
}

/** Where the registration window stands: open, confirmation week, upcoming (with date), closed or none. */
export function registrationWindowState(windows) {
  const list = Array.isArray(windows) ? windows : [];
  const open = list.find((w) => w.phase === 'registration');
  if (open) return { state: 'open', window: open, opensAt: open.opens_at || null };
  const confirmation = list.find((w) => w.phase === 'confirmation');
  if (confirmation) return { state: 'confirmation', window: confirmation, opensAt: confirmation.opens_at || null };
  const upcoming = list
    .filter((w) => w.phase === 'upcoming')
    .sort((a, b) => Date.parse(a.opens_at) - Date.parse(b.opens_at))[0];
  if (upcoming) return { state: 'upcoming', window: upcoming, opensAt: upcoming.opens_at || null };
  if (list.length) return { state: 'closed', window: list[0], opensAt: null };
  return { state: 'none', window: null, opensAt: null };
}
