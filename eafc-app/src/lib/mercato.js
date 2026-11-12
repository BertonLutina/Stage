import { stageClient } from '@/api/stageClient';
import {
  getContractTypeLabel,
  isLifecycleOwnedContract,
  normalizePlayerContracts,
  weeklyWage,
} from '@/lib/playerContractFields';

/**
 * Mercato (task 11):
 *   feed        GET /mercato-transfers/desk      (rumours to official deals)
 *   my offers   PlayerContract entity            (offers I received, offers my club sent)
 * The transfer window and the free-agent market keep their existing sources
 * (`transferWindowActions`, `getTransferMarket`).
 */

const DONE = new Set(['official', 'signed']);
const LIVE_OFFER = new Set(['pending', 'pending_window', 'negotiating']);

function initialsOf(text) {
  return String(text || '').trim().slice(0, 2).toUpperCase();
}

export function describeFeedItem(row = {}) {
  const status = String(row.status || '').toLowerCase();
  const name = row.player_name || row.headline || '';
  const fee = Number(row.transfer_fee);
  const from = row.from_club_name || null;
  return {
    id: row.id,
    playerId: row.player_id || null,
    name,
    initials: initialsOf(row.player_name || ''),
    avatarUrl: row.player_avatar_url || null,
    position: row.player_position || '',
    from,
    fromIsFree: !from && Boolean(row.to_club_name),
    to: row.to_club_name || null,
    status,
    statusLabel: row.status_label || String(row.status || '').toUpperCase(),
    tone: DONE.has(status) ? 'success' : status === 'failed' ? 'danger' : 'warning',
    fee: Number.isFinite(fee) && fee > 0 ? fee : null,
    currency: row.currency || 'STC',
    dealType: row.deal_type_label || '',
    date: row.transfer_date || row.created_date || null,
  };
}

export async function loadMercatoDesk() {
  const desk = await stageClient.http.get('/mercato-transfers/desk');
  if (!Array.isArray(desk?.feed)) throw new Error('Mercato data is incomplete. Please retry.');
  return { window: desk.window || null, feed: desk.feed.map(describeFeedItem) };
}

export function offerIsLive(contract) {
  return LIVE_OFFER.has(String(contract?.status || '').toLowerCase());
}

const dateOf = (c) => String(c.created_date || c.updated_date || '');

/**
 * Offers I received (as a player) and offers my club sent (as president),
 * newest first. The other party's name is read from its record, left empty if unknown.
 */
export async function loadMyOffers({ player = null, presidentClub = null } = {}) {
  const calls = [];
  if (player?.id) calls.push(stageClient.entities.PlayerContract.filter({ target_player_id: player.id }).catch(() => []));
  if (presidentClub?.id) calls.push(stageClient.entities.PlayerContract.filter({ team_id: presidentClub.id }).catch(() => []));
  if (!calls.length) return [];

  const lists = await Promise.all(calls);
  const byId = new Map();
  lists.flat().forEach((contract) => { if (contract?.id) byId.set(contract.id, contract); });

  const offers = normalizePlayerContracts([...byId.values()])
    .filter((contract) => !isLifecycleOwnedContract(contract))
    .map((contract) => ({
      contract,
      direction: presidentClub?.id && contract.team_id === presidentClub.id ? 'sent' : 'received',
    }));

  const clubIds = [...new Set(offers.filter((o) => o.direction === 'received').map((o) => o.contract.team_id).filter(Boolean))];
  const playerIds = [...new Set(offers.filter((o) => o.direction === 'sent').map((o) => o.contract.user_id).filter(Boolean))];
  const [clubs, players] = await Promise.all([
    Promise.all(clubIds.map((id) => stageClient.entities.Club.get(id).catch(() => null))),
    Promise.all(playerIds.map((id) => stageClient.entities.Player.get(id).catch(() => null))),
  ]);
  const clubName = new Map(clubIds.map((id, i) => [id, clubs[i]?.name || '']));
  const playerName = new Map(playerIds.map((id, i) => [id, players[i]?.gamertag || '']));

  return offers
    .sort((a, b) => dateOf(b.contract).localeCompare(dateOf(a.contract)))
    .map(({ contract, direction }) => ({
      id: contract.id,
      direction,
      status: String(contract.status || '').toLowerCase(),
      live: offerIsLive(contract),
      counterpart: direction === 'received'
        ? clubName.get(contract.team_id) || ''
        : playerName.get(contract.user_id) || '',
      playerId: contract.user_id || contract.target_player_id || null,
      typeLabel: getContractTypeLabel(contract),
      weeklyWage: weeklyWage(contract),
    }));
}

export function summarizeOffers(offers = []) {
  return {
    liveCount: offers.filter((o) => o.live).length,
    waitingCount: offers.filter((o) => o.live && o.direction === 'received').length,
  };
}
