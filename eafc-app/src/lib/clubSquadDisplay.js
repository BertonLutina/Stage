import { getContractTargetPlayerId, getContractType, normalizePlayerContracts } from '@/lib/playerContractFields';
import { getPrimaryClubRole, normalizeClubRole } from '@/lib/clubStaffRoles';

const CLUB_ROLE_FALLBACK_LABELS = {
  president: 'President',
  captain: 'Captain',
  vice_captain: 'Vice-Captain',
  recruiter: 'Staff',
  finance_manager: 'Staff',
  match_coordinator: 'Staff',
  member: 'Member',
};

const CONTRACT_EXPIRING_SOON_MS = 14 * 24 * 60 * 60 * 1000;

export function clubRoleLabel(role) {
  const normalized = normalizeClubRole(role) || 'member';
  return CLUB_ROLE_FALLBACK_LABELS[normalized] || normalized.replace(/_/g, ' ');
}

export function getPlayerContracts(contracts = [], playerId) {
  return normalizePlayerContracts(contracts).filter((contract) => (
    String(getContractTargetPlayerId(contract) || '') === String(playerId || '')
  ));
}

function isContractExpiringSoon(contract) {
  if (!contract?.end_date) return false;
  const end = new Date(contract.end_date).getTime();
  return Number.isFinite(end) && end >= Date.now() && end <= Date.now() + CONTRACT_EXPIRING_SOON_MS;
}

export function getSquadContractSummary(contracts = []) {
  const safeContracts = normalizePlayerContracts(contracts);
  const active = safeContracts.find((contract) => contract.status === 'active');
  if (active) {
    if (getContractType(active) === 'trial') return { key: 'trial', label: 'Trial', color: '#67E8F9' };
    if (isContractExpiringSoon(active)) return { key: 'expiring', label: 'Expiring Soon', color: '#FBBF24' };
    return { key: 'active', label: 'Active Contract', color: '#6EE7B7' };
  }
  const pending = safeContracts.find((contract) => ['pending', 'pending_window', 'negotiating'].includes(contract.status));
  if (pending) {
    if (getContractType(pending) === 'trial') return { key: 'trial', label: 'Trial', color: '#67E8F9' };
    return { key: 'pending', label: 'Pending Offer', color: '#F5C542' };
  }
  return { key: 'none', label: 'No Contract', color: 'rgba(255,255,255,0.45)' };
}

export function getSquadAvailabilitySummary(row, nextFixture) {
  if (!nextFixture?.id) {
    return { key: 'no_match', label: 'No match scheduled', color: 'rgba(255,255,255,0.45)' };
  }
  const status = String(row?.status || 'no_response').toLowerCase();
  if (status === 'available') return { key: 'available', label: 'Available', color: '#6EE7B7' };
  if (status === 'maybe') return { key: 'maybe', label: 'Maybe', color: '#FBBF24' };
  if (status === 'unavailable') return { key: 'unavailable', label: 'Unavailable', color: '#FCA5A5' };
  return { key: 'no_response', label: 'No Response', color: 'rgba(255,255,255,0.45)' };
}

export function getPrimaryRole(player) {
  return getPrimaryClubRole(player);
}

export function formatOvr(value) {
  const ovr = value;
  if (ovr == null || ovr === '') return '--';
  return Number.isInteger(Number(ovr)) ? String(Math.round(Number(ovr))) : (Math.round(Number(ovr) * 10) / 10).toFixed(1);
}

export function resolveClubAccess({ isOwner, isCaptain, isPresident, isViceCaptain, isMember }) {
  const canOpenClubOffice = isOwner || isCaptain || isPresident || isViceCaptain;
  const canViewTeamAvailability = canOpenClubOffice;
  const canSetAvailability = isMember;
  const showChat = isMember;
  return { canOpenClubOffice, canViewTeamAvailability, canSetAvailability, showChat };
}
