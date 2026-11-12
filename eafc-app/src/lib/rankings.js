import { stageClient } from '@/api/stageClient';

/**
 * Rankings (task 10): `GET /rankings/summary` gives clubs and players already ranked.
 * Free accounts get the top 10 with public fields (no points); STAGE Plus gets up to 100
 * with points. Region and platform narrow the list on the client, like the web page.
 */

export const INITIAL_VISIBLE = 10;
export const PAGE_STEP = 20;

export async function loadRankings() {
  const summary = await stageClient.http.get('/rankings/summary');
  if (!Array.isArray(summary?.clubs) || !Array.isArray(summary?.players)) {
    throw new Error('Ranking data is incomplete. Please retry.');
  }
  return {
    clubs: summary.clubs,
    players: summary.players,
    // Only an explicit full_access:true unlocks the points column.
    fullAccess: summary.meta?.full_access === true,
    fixturesCount: summary.meta?.official_fixtures_count ?? null,
  };
}

const fold = (value) => String(value || '').trim().toLowerCase();

export function filterRankings(rows, { region = '', platform = '' } = {}) {
  return (rows || []).filter((row) => {
    if (region && fold(row.region) !== fold(region)) return false;
    if (platform && fold(row.platform) !== fold(platform)) return false;
    return true;
  });
}

/** Distinct real regions and platforms present in the rows. */
export function filterOptions(rows) {
  const regions = new Map();
  const platforms = new Map();
  (rows || []).forEach((row) => {
    const region = String(row.region || '').trim();
    const platform = String(row.platform || '').trim();
    if (region && !regions.has(fold(region))) regions.set(fold(region), region);
    if (platform && !platforms.has(fold(platform))) platforms.set(fold(platform), platform);
  });
  const sort = (map) => [...map.values()].sort((a, b) => a.localeCompare(b));
  return { regions: sort(regions), platforms: sort(platforms) };
}

/**
 * The visible board.
 * - `top`: the first `visible` rows with their rank (position in the filtered list).
 * - `mine`: my row. In place when it is inside `top`, `pinned` below the list otherwise.
 *   When I am not in the returned rows, and no filter is active, my own record's
 *   `global_rank` is used if it has one. Otherwise null: no rank is invented.
 */
export function buildBoard({
  rows = [], myId = null, myRecord = null, filtered = false, visible = INITIAL_VISIBLE,
}) {
  const ranked = rows.map((row, index) => ({ row, rank: index + 1 }));
  const top = ranked.slice(0, visible);
  const hit = myId ? ranked.find((entry) => entry.row.id === myId) : null;

  let mine = null;
  if (hit) {
    mine = { ...hit, pinned: hit.rank > visible, fromRecord: false };
  } else if (myId && myRecord && !filtered && Number(myRecord.global_rank) > 0) {
    mine = { row: myRecord, rank: Number(myRecord.global_rank), pinned: true, fromRecord: true };
  }

  return { top, mine, total: ranked.length, hasMore: ranked.length > visible };
}
