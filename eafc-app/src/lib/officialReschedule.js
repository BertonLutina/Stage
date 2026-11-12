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
  if (!payload || typeof payload !== 'object') return {};
  return payload.data ?? payload.reschedule ?? payload;
}

function canActAsStaff({ player, presidentClub, club }) {
  if (presidentClub && club && String(presidentClub.id) === String(club.id)) return true;
  return STAFF_ROLES.has(getPrimaryClubRole(player || {}));
}

function formatSlotLabel(slot) {
  if (!slot) return '—';
  if (typeof slot === 'string') return slot;
  if (slot.label) return slot.label;
  const date = slot.date || slot.day || slot.scheduled_date;
  const time = slot.time || slot.kickoff || slot.scheduled_time;
  if (date && time) return `${date} · ${time}`;
  if (slot.starts_at) {
    const d = new Date(slot.starts_at);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      });
    }
  }
  return String(slot.id || slot.value || '—');
}

function normalizeSlot(slot, index) {
  const id = String(slot?.id || slot?.slot_id || slot?.starts_at || slot?.value || `slot-${index}`);
  return {
    id,
    label: formatSlotLabel(slot),
    startsAt: slot?.starts_at || slot?.datetime || null,
    date: slot?.date || null,
    time: slot?.time || null,
    raw: slot,
  };
}

function normalizeMeeting(row, index) {
  return {
    id: String(row?.id || `ev-${index}`),
    text: row?.summary || row?.message || row?.text || formatSlotLabel(row),
    when: row?.relative_time || row?.when || row?.created_label || null,
    tone: String(row?.tone || row?.status || '').toLowerCase().includes('declin')
      || String(row?.status || '').toLowerCase() === 'declined'
      ? 'danger'
      : 'info',
    raw: row,
  };
}

export async function loadOfficialReschedule({ matchId } = {}) {
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
  const staff = canActAsStaff({
    player: identity.player,
    presidentClub: identity.presidentClub,
    club,
  });

  let payload = {};
  try {
    payload = unwrap(await stageClient.http.get(`/game-day/${encodeURIComponent(matchId)}/reschedule`));
  } catch (err) {
    if (err?.status === 404) {
      return {
        match,
        club,
        staff,
        official: isOfficialMatch(match),
        available: false,
        slots: [],
        history: [],
        pendingProposal: null,
        windowEndsAt: null,
        windowLabel: null,
        errorCode: 'not_found',
      };
    }
    throw err;
  }

  const slots = asList(payload.slots || payload.available_slots || payload.windows)
    .map(normalizeSlot);
  const history = asList(payload.meetings || payload.history || payload.events)
    .map(normalizeMeeting);
  const pending = payload.pending_proposal || payload.opponent_proposal || payload.proposal || null;
  const opponent = club && String(match.home_club_id) === String(club.id)
    ? (match.away_club_name || 'Away')
    : (match.home_club_name || 'Home');

  return {
    match,
    club,
    staff,
    official: isOfficialMatch(match),
    available: true,
    slots,
    history,
    pendingProposal: pending
      ? {
        label: formatSlotLabel(pending),
        from: pending.club_name || pending.from_club_name || opponent,
        when: pending.relative_time || pending.when || null,
        id: pending.id || null,
        raw: pending,
      }
      : null,
    windowEndsAt: payload.window_ends_at || payload.deadline || null,
    windowLabel: payload.window_label || payload.window_status || null,
    opponent,
    identity,
  };
}

export async function postOfficialReschedule(matchId, body) {
  if (!matchId) throw new Error('Missing match');
  return stageClient.http.post(`/game-day/${encodeURIComponent(matchId)}/reschedule`, body);
}
