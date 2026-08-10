/** Stage player_contracts use team_id (+ user_id as the player id). */

const TYPE_LABELS = {
  trial: 'Trial',
  academy: 'Academy',
  squad: 'Squad',
  important: 'Important',
  star: 'Star',
  ownership: 'Club President',
};

export function getContractTargetPlayerId(contract) {
  return contract?.target_player_id || contract?.user_id || null;
}

export function getContractType(contract) {
  const raw = typeof contract?.contract_type === 'string' ? contract.contract_type.trim() : '';
  return TYPE_LABELS[raw] ? raw : 'squad';
}

export function getContractTypeLabel(contract) {
  return TYPE_LABELS[getContractType(contract)] || 'Squad';
}

export function normalizePlayerContract(contract) {
  if (!contract || typeof contract !== 'object') return null;
  return {
    ...contract,
    contract_type: getContractType(contract),
    status: contract.status || 'pending',
  };
}

export function normalizePlayerContracts(value) {
  return Array.isArray(value)
    ? value.map(normalizePlayerContract).filter(Boolean)
    : [];
}

export const OFFER_STATUS_TABS = [
  { id: 'sent', label: 'Sent', statuses: ['pending', 'pending_window'] },
  { id: 'accepted', label: 'Accepted', statuses: ['active'] },
  { id: 'declined', label: 'Declined', statuses: ['rejected'] },
  { id: 'negotiable', label: 'Talks', statuses: ['negotiating'] },
];

export const SIGNED_STATUSES = ['active'];

export function statusLabel(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending' || s === 'pending_window') return 'Sent';
  if (s === 'active') return 'Active';
  if (s === 'rejected') return 'Declined';
  if (s === 'negotiating') return 'Talks';
  if (s === 'cancelled') return 'Cancelled';
  if (s === 'terminated') return 'Terminated';
  if (s === 'expired' || s === 'completed') return 'Ended';
  return s ? s.replace(/_/g, ' ') : '—';
}

export function weeklyWage(contract) {
  const n = Number(contract?.weekly_salary_stc ?? contract?.wage ?? 0);
  return Number.isFinite(n) && n > 0 ? n : null;
}
