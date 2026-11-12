import { resolveMyPlayerAndClub, stageClient } from '@/api/stageClient';
import { pickMyClubForMatch, reloadMatch, uniqueIdentityClubs } from '@/lib/gameDayOps';
import { getPrimaryClubRole } from '@/lib/clubStaffRoles';
import { isOfficialMatch } from '@/lib/matchFixtureLifecycle';

const STAFF_ROLES = new Set(['president', 'captain', 'vice_captain', 'match_coordinator']);

function asList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function unwrap(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  return payload.data ?? payload.preparation ?? payload;
}

function playerInitials(name) {
  const raw = String(name || '').trim();
  if (!raw) return '?';
  const parts = raw.replace(/[_\-.]+/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  return raw.slice(0, 2).toUpperCase();
}

function normalizePlayer(row = {}, selectedIds) {
  const id = row.player_id || row.id || null;
  const gamertag = row.gamertag || row.player_gamertag || row.name || '—';
  const eligible = row.eligible !== false
    && row.is_eligible !== false
    && !row.ineligible
    && String(row.eligibility_status || '').toLowerCase() !== 'ineligible';
  const message = row.eligibility_message || row.ineligibility_reason || row.note || null;
  const availability = String(row.availability_status || row.availability || row.status || '').toLowerCase();
  return {
    id: id ? String(id) : null,
    gamertag,
    initials: playerInitials(gamertag),
    position: row.position || row.preferred_position || row.slot || '—',
    eligible,
    eligibilityMessage: message,
    availability: availability || 'no_reply',
    selected: selectedIds ? selectedIds.has(String(id)) : Boolean(row.selected || row.in_starting_xi),
    raw: row,
  };
}

function countAvailability(rows) {
  const counts = { available: 0, maybe: 0, no_reply: 0 };
  for (const row of rows || []) {
    const status = String(row.status || row.availability_status || '').toLowerCase();
    if (status === 'available' || status === 'yes') counts.available += 1;
    else if (status === 'maybe') counts.maybe += 1;
    else counts.no_reply += 1;
  }
  return counts;
}

function canActAsStaff({ player, presidentClub, club }) {
  if (presidentClub && club && String(presidentClub.id) === String(club.id)) return true;
  const role = getPrimaryClubRole(player || {});
  return STAFF_ROLES.has(role);
}

export async function loadMatchPrep({ matchId } = {}) {
  if (!matchId) throw new Error('Missing match');
  const identity = await resolveMyPlayerAndClub().catch(() => ({}));
  const clubs = uniqueIdentityClubs(
    identity.player?.club_id ? { id: identity.player.club_id } : null,
    identity.club,
    identity.presidentClub,
  );
  const match = await reloadMatch(matchId);
  if (!match) throw new Error('Match not found');
  const club = pickMyClubForMatch(match, clubs);
  const fixtureId = match.source_fixture_id || match.fixture_id || null;
  const staff = canActAsStaff({
    player: identity.player,
    presidentClub: identity.presidentClub,
    club,
  });

  let preparation = null;
  let availabilityRows = [];
  let loadNote = null;

  if (club?.id && fixtureId) {
    try {
      preparation = unwrap(await stageClient.http.get(
        `/club-fixture-lineups/preparation/${encodeURIComponent(club.id)}/${encodeURIComponent(fixtureId)}`,
      ));
    } catch (err) {
      if (err?.status === 404) loadNote = 'preparation_missing';
      else throw err;
    }
    try {
      const avail = await stageClient.http.get('/club-fixture-availabilities', {
        fixture_id: fixtureId,
        club_id: club.id,
      });
      availabilityRows = asList(avail?.rows || avail?.data || avail);
    } catch {
      availabilityRows = [];
    }
  }

  const selectedRaw = preparation?.starting_players
    || preparation?.selected_player_ids
    || preparation?.lineup
    || [];
  const selectedIds = new Set(
    asList(selectedRaw).map((entry) => String(entry?.id || entry?.player_id || entry)).filter(Boolean),
  );

  const playersSource = preparation?.players
    || preparation?.eligible_players
    || preparation?.roster
    || [];
  let players = asList(playersSource).map((row) => normalizePlayer(row, selectedIds)).filter((p) => p.id);

  if (!players.length && club?.id) {
    const roster = await stageClient.entities.Player.filter({ club_id: club.id }).catch(() => []);
    players = (roster || []).map((row) => normalizePlayer(row, selectedIds));
  }

  const availByPlayer = new Map(
    availabilityRows.map((row) => [String(row.player_id), String(row.status || '').toLowerCase()]),
  );
  players = players.map((p) => ({
    ...p,
    availability: availByPlayer.get(String(p.id)) || p.availability || 'no_reply',
  }));

  const published = Boolean(
    preparation?.published
    || preparation?.is_published
    || preparation?.status === 'published'
    || preparation?.published_at,
  );

  const opponent = club && String(match.home_club_id) === String(club.id)
    ? (match.away_club_name || 'Away')
    : (match.home_club_name || 'Home');

  return {
    match,
    club,
    fixtureId,
    official: isOfficialMatch(match),
    staff,
    published,
    publishedAt: preparation?.published_at || null,
    players,
    availabilityCounts: countAvailability(availabilityRows),
    maxStarters: Number(preparation?.max_starters || preparation?.starting_xi_size || 11) || 11,
    loadNote,
    identity,
  };
}

export async function saveMatchPrepDraft({ clubId, fixtureId, playerIds, formation = null }) {
  if (!clubId || !fixtureId) throw new Error('Missing club or fixture');
  return stageClient.http.post(
    `/club-fixture-lineups/preparation/${encodeURIComponent(clubId)}/${encodeURIComponent(fixtureId)}`,
    {
      starting_player_ids: playerIds,
      formation,
    },
  );
}

export async function publishMatchPrep({ clubId, fixtureId, playerIds, formation = null }) {
  if (!clubId || !fixtureId) throw new Error('Missing club or fixture');
  return stageClient.http.post(
    `/clubs/${encodeURIComponent(clubId)}/lineups/${encodeURIComponent(fixtureId)}/publish`,
    {
      starting_player_ids: playerIds,
      formation,
    },
  );
}
