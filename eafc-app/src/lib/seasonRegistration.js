import { stageClient } from '@/api/stageClient';
import { REGIONS } from '@/lib/qualificationConfig';

/**
 * Regional season registration (task 9), mirroring the web `RegionalRegistrationPanel`:
 *   GET  /regional-leagues/registration-windows
 *   GET  /regional-leagues/registration-readiness/:clubId
 *   POST /regional-leagues/registration-windows/:windowId/apply
 *   POST /regional-leagues/registrations/:id/confirm   { player_ids }
 *   POST /regional-leagues/registrations/:id/reserve   { decision, player_ids }
 * The server hashes the accepted rules itself and assigns league, division and group:
 * the player does not pick them.
 */

export const MIN_CONFIRMED_PLAYERS = 3;
const BASE = '/regional-leagues';

const INCOMPLETE = 'Published registration data is incomplete. Please retry.';

export async function loadSeasonRegistration({ clubId } = {}) {
  const windowsPayload = await stageClient.http.get(`${BASE}/registration-windows`);
  if (!Array.isArray(windowsPayload?.windows)) throw new Error(INCOMPLETE);

  let readiness = null;
  let accessNote = '';
  if (clubId) {
    try {
      readiness = await stageClient.http.get(`${BASE}/registration-readiness/${encodeURIComponent(clubId)}`);
    } catch (err) {
      if (err?.status !== 403) throw err;
      accessNote = err?.message || '';
    }
    if (readiness && (!Array.isArray(readiness.players) || !Array.isArray(readiness.registrations))) {
      throw new Error(INCOMPLETE);
    }
  }
  return { windows: windowsPayload.windows, readiness, accessNote };
}

/** The application of my club for this window (the server gives one per window). */
export function applicationFor(readiness, window) {
  return (readiness?.registrations || []).find((r) => r.registration_window_id === window?.id) || null;
}

/** One status key per window + application, used for the status line and its tone. */
export function windowStatus(window, application) {
  const phase = window?.phase;
  const appStatus = String(application?.status || '').toLowerCase();
  if (appStatus === 'withdrawn') return 'withdrawn';
  if (appStatus === 'rejected' || appStatus === 'removed') return 'rejected';
  if (appStatus === 'waitlisted') return 'waitlisted';
  if (application) {
    if (application.participation_status === 'confirmed') {
      return application.assigned_league_id ? 'confirmedAssigned' : 'confirmedPending';
    }
    return phase === 'closed' ? 'confirmationClosed' : 'registered';
  }
  if (phase === 'registration') return 'open';
  if (phase === 'upcoming') return 'upcoming';
  if (phase === 'confirmation') return 'confirmationOnly';
  return 'closed';
}

/** What the president can do now on this window. */
export function windowActions(window, application, readiness, now = Date.now()) {
  const none = { canRegister: false, canConfirm: false, canReserve: false };
  if (!readiness?.can_manage_registration) return none;
  const phase = window?.phase;
  const canRegister = phase === 'registration' && (!application || application.status === 'withdrawn');
  const canConfirm = application?.status === 'pending' && phase === 'confirmation';
  const invitation = application?.reserve_invitation;
  const canReserve = Boolean(
    application?.status === 'pending'
    && invitation
    && !application.reserve_response
    && phase === 'closed'
    && now < Date.parse(invitation.deadline),
  );
  return { canRegister, canConfirm, canReserve };
}

const PLAYER_STATUS_KEYS = {
  eligible: 'eligible',
  plus_required: 'plusRequired',
  plus_expired: 'plusExpired',
  subscription_review: 'subscriptionReview',
  registered_elsewhere: 'registeredElsewhere',
};

export function playerStatusKey(status) {
  return PLAYER_STATUS_KEYS[status] || 'review';
}

function assertPlayers(playerIds) {
  const ids = Array.isArray(playerIds) ? playerIds : [];
  if (new Set(ids).size < MIN_CONFIRMED_PLAYERS) {
    throw new Error(`Select at least ${MIN_CONFIRMED_PLAYERS} different eligible players.`);
  }
  return ids;
}

export async function applyToWindow({ window, clubId, note = '' }) {
  const body = { club_id: clubId, policy_version: window.policy_version };
  const text = String(note || '').trim();
  if (text) body.note = text;
  return stageClient.http.post(`${BASE}/registration-windows/${encodeURIComponent(window.id)}/apply`, body);
}

export async function confirmParticipation({ window, application, clubId, playerIds }) {
  const ids = assertPlayers(playerIds);
  return stageClient.http.post(`${BASE}/registrations/${encodeURIComponent(application.id)}/confirm`, {
    club_id: clubId,
    policy_version: window.policy_version,
    player_ids: ids,
  });
}

export async function respondReserve({ window, application, clubId, decision, playerIds }) {
  const body = { club_id: clubId, policy_version: window.policy_version, decision };
  if (decision === 'accept') body.player_ids = assertPlayers(playerIds);
  return stageClient.http.post(`${BASE}/registrations/${encodeURIComponent(application.id)}/reserve`, body);
}

/** Display name of a region slug; unknown slugs are title-cased, never guessed. */
export function regionLabel(slug) {
  const hit = REGIONS.find((r) => r.slug === slug);
  if (hit) return hit.name;
  return String(slug || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
