import { resolveMyPlayerAndClub, stageClient } from '@/api/stageClient';
import {
  acceptTournamentRules,
  fetchTournamentPublic,
  isPlayerTournament,
  registerTournamentClub,
  withdrawTournamentClub,
} from '@/api/tournamentActions';
import { resolveTournamentRules } from '@/lib/tournamentRuleTemplates';

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

function clubInitials(name) {
  const raw = String(name || '').trim();
  if (!raw) return '?';
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  return raw.slice(0, 3).toUpperCase();
}

function formatType(tournament) {
  const type = String(tournament?.type || '').replace(/_/g, ' ');
  const platform = tournament?.platform || tournament?.platforms || '';
  const clubs = asList(tournament?.registered_clubs);
  const max = tournament?.max_participants || tournament?.max_clubs || null;
  const bits = [];
  if (type) bits.push(type);
  if (platform) bits.push(String(platform).toUpperCase());
  if (max) bits.push(`${clubs.length} / ${max} clubs`);
  else if (clubs.length) bits.push(`${clubs.length} clubs`);
  return bits.join(' · ');
}

function normalizeSlot(slot, index) {
  if (typeof slot === 'string') {
    return { id: slot, label: slot, selected: false };
  }
  const id = String(slot?.id || slot?.value || slot?.label || `slot-${index}`);
  return {
    id,
    label: slot?.label || slot?.name || id,
    selected: Boolean(slot?.selected),
  };
}

export async function loadTournamentRegister({ tournamentId } = {}) {
  if (!tournamentId) throw new Error('Missing tournament');
  const identity = await resolveMyPlayerAndClub().catch(() => ({}));
  const tournament = await fetchTournamentPublic(tournamentId);
  if (!tournament) throw new Error('Tournament not found');

  const registrationClub = identity.presidentClub || null;
  const playerTournament = isPlayerTournament(tournament);
  const clubs = asList(tournament.registered_clubs).map(String);
  const pending = asList(tournament.pending_clubs || tournament.pending_registrations).map((row) => (
    String(row?.club_id || row?.id || row)
  ));
  const clubEntered = Boolean(registrationClub && clubs.includes(String(registrationClub.id)));
  const clubPending = Boolean(registrationClub && pending.includes(String(registrationClub.id)));
  const isPresident = Boolean(registrationClub);
  const canRegister = tournament.status === 'registration'
    && !playerTournament
    && isPresident
    && !clubEntered
    && !clubPending;

  const rules = resolveTournamentRules(tournament);
  let slots = [];
  let selectedSlotIds = [];
  try {
    const avail = await stageClient.functions.invoke('tournamentClubAvailability', {
      action: 'get',
      tournament_id: tournamentId,
      club_id: registrationClub?.id || null,
    });
    const data = avail?.data ?? avail;
    slots = asList(data?.slots || data?.options || data?.availability).map(normalizeSlot);
    selectedSlotIds = asList(data?.selected || data?.selected_slot_ids || data?.club_slots)
      .map((s) => String(s?.id || s));
  } catch {
    slots = [];
  }

  if (selectedSlotIds.length) {
    const set = new Set(selectedSlotIds);
    slots = slots.map((s) => ({ ...s, selected: set.has(s.id) }));
  }

  const max = tournament.max_participants || tournament.max_clubs || null;
  const full = Boolean(max && clubs.length >= Number(max));
  const open = tournament.status === 'registration' && !full;

  return {
    tournament,
    club: registrationClub,
    player: identity.player || null,
    isPresident,
    playerTournament,
    canRegister,
    clubEntered,
    clubPending,
    full,
    open,
    metaLine: formatType(tournament),
    clubInitials: clubInitials(registrationClub?.name),
    rules,
    rulesRevision: rules?.revision || tournament.rules_revision || tournament.rules_template_revision || null,
    slots,
    selectedSlotIds: slots.filter((s) => s.selected).map((s) => s.id),
    identity,
  };
}

export async function saveTournamentSlots({ tournamentId, clubId, slotIds }) {
  return stageClient.functions.invoke('tournamentClubAvailability', {
    action: 'set',
    tournament_id: tournamentId,
    club_id: clubId,
    slot_ids: slotIds,
  });
}

export async function submitTournamentRegistration({
  tournamentId,
  clubId,
  slotIds,
  rulesAccepted,
  rulesTemplateId,
  tournament,
}) {
  if (slotIds?.length) {
    await saveTournamentSlots({ tournamentId, clubId, slotIds }).catch(() => null);
  }
  await acceptTournamentRules(tournamentId, {
    rulesAccepted: true,
    tournament,
    rulesTemplateId,
    clubId,
  });
  return registerTournamentClub(tournamentId, clubId, {
    rulesAccepted: true,
    rulesTemplateId,
  });
}

export async function withdrawTournamentRegistration(tournamentId, clubId) {
  return withdrawTournamentClub(tournamentId, clubId);
}
