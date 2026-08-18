import { stageClient } from '@/api/stageClient';

export const NEWS_SECTION_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'mercato', label: 'Mercato' },
  { id: 'club_news', label: 'Club News' },
  { id: 'player_news', label: 'Player News' },
  { id: 'tournament', label: 'Tournaments' },
  { id: 'competitions', label: 'Competitions' },
  { id: 'daily_news', label: 'Daily News' },
  { id: 'world_news', label: 'World News' },
];

export const DESK_FILTERS = {
  club_news: [
    { id: 'all', label: 'All' },
    { id: 'stadium', label: 'Stadium' },
    { id: 'shirts', label: 'Shirts' },
    { id: 'contract', label: 'Contracts' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'trophy', label: 'Trophies' },
  ],
  player_news: [
    { id: 'all', label: 'All' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'ranking', label: 'Rankings' },
    { id: 'signed', label: 'Signed' },
    { id: 'motm', label: 'MOTM' },
  ],
  tournament: [
    { id: 'all', label: 'All' },
    { id: 'field', label: 'The field' },
    { id: 'phase', label: 'Phases' },
    { id: 'champion', label: 'Champions' },
  ],
  competitions: [
    { id: 'all', label: 'All' },
    { id: 'field', label: 'The table' },
    { id: 'phase', label: 'Matchdays' },
    { id: 'champion', label: 'Titles' },
  ],
  daily_news: [
    { id: 'all', label: 'All' },
    { id: 'club_news', label: 'Club' },
    { id: 'player_news', label: 'Player' },
    { id: 'tournament', label: 'Tournament' },
    { id: 'competitions', label: 'Competition' },
    { id: 'mercato', label: 'Mercato' },
    { id: 'press', label: 'Press' },
  ],
};

export const MERCATO_STATUS_LABELS = {
  rumour: 'RUMOUR',
  reported: 'REPORTED',
  negotiation: 'IN NEGOTIATION',
  agreement_close: 'CLOSE TO AGREEMENT',
  agreement: 'AGREEMENT REACHED',
  medical: 'MEDICAL',
  signed: 'SIGNED',
  official: 'OFFICIAL',
  failed: 'DEAL OFF',
};

export const MERCATO_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'official', label: 'Official' },
  { id: 'rumours', label: 'Rumours' },
  { id: 'negotiations', label: 'Negotiations' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
  { id: 'loans', label: 'Loans' },
  { id: 'free_agents', label: 'Free Agents' },
  { id: 'contract_extensions', label: 'Extensions' },
];

export const MERCATO_PRICE_BANDS = [
  { id: 'any', label: 'Any fee', min: 0, max: 0 },
  { id: 'u1m', label: 'Under 1M', min: 0, max: 1_000_000 },
  { id: '1to10', label: '1M–10M', min: 1_000_000, max: 10_000_000 },
  { id: '10to50', label: '10M–50M', min: 10_000_000, max: 50_000_000 },
  { id: '50plus', label: '50M+', min: 50_000_000, max: 0 },
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EMPTY_DESK = { feed: [], fields: [], board: {}, continents: [], kicker: 'Desk', line: '' };
const EMPTY_MERCATO = { feed: [], top: {}, rankings: {}, deadline: { active: false } };

export function unwrapDesk(payload, fallback = EMPTY_DESK) {
  if (!payload || typeof payload !== 'object') return { ...fallback };
  if (payload.feed || payload.fields || payload.continents || payload.top || payload.deadline) {
    return payload;
  }
  if (payload.data && typeof payload.data === 'object') return unwrapDesk(payload.data, fallback);
  return { ...fallback, ...payload };
}

export function formatNewspaperDate(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return `${WEEKDAYS[value.getUTCDay()]}, ${value.getUTCDate()} ${MONTHS[value.getUTCMonth()]} ${value.getUTCFullYear()}`;
}

export function newspaperVolume(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  return Number.isNaN(value.getTime()) ? '' : String(value.getUTCFullYear());
}

export function formatDeskClock(date) {
  if (!date) return '';
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDeskAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return '';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M STC`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K STC`;
  return `${value.toLocaleString()} STC`;
}

export function mercatoStatusLabel(status) {
  return MERCATO_STATUS_LABELS[status] || String(status || '').toUpperCase();
}

export function formatMercatoFee(amount, currency = 'STC') {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return 'Undisclosed';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M ${currency}`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K ${currency}`;
  return `${value.toLocaleString()} ${currency}`;
}

export function formatMercatoDate(date) {
  if (!date) return '';
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return value.toLocaleDateString('en-GB');
}

export function formatDeadlineCountdown(remainingMs) {
  const ms = Math.max(0, Number(remainingMs) || 0);
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function matchesDeskFilter(row, filterId = 'all') {
  if (!filterId || filterId === 'all') return true;
  if (row?.beat === filterId) return true;
  return row?.kind === filterId || row?.stamp === String(filterId).toUpperCase();
}

export function filterDeskFeed(rows, { filter = 'all', query = '' } = {}) {
  const q = String(query || '').trim().toLowerCase();
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (!matchesDeskFilter(row, filter)) return false;
    if (!q) return true;
    const hay = `${row.title || ''} ${row.body || ''} ${row.club_name || ''} ${row.player_name || ''} ${row.tournament_name || ''} ${row.name || ''}`.toLowerCase();
    return hay.includes(q);
  });
}

export function filterCompetitionFields(rows, { filter = 'all', query = '' } = {}) {
  const q = String(query || '').trim().toLowerCase();
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (filter === 'champion' && !row.winner_name) return false;
    if (filter === 'field' && String(row.status) === 'completed') return false;
    if (filter === 'phase' && !(row.phases || []).length) return false;
    if (!q) return true;
    const hay = `${row.name || ''} ${(row.countries || []).map((item) => item.code).join(' ')} ${row.trophy_name || ''} ${row.winner_name || ''}`.toLowerCase();
    return hay.includes(q);
  });
}

export function filterMercatoFeed(rows, { filter = 'all', query = '', priceBand = 'any' } = {}) {
  const band = MERCATO_PRICE_BANDS.find((item) => item.id === priceBand) || MERCATO_PRICE_BANDS[0];
  const q = String(query || '').trim().toLowerCase();
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (filter !== 'all') {
      const groups = {
        official: ['official', 'signed'],
        rumours: ['rumour', 'reported'],
        negotiations: ['negotiation', 'agreement_close', 'agreement', 'medical'],
        completed: ['official', 'signed'],
        failed: ['failed'],
      };
      if (groups[filter] && !groups[filter].includes(row.status)) return false;
      if (filter === 'loans' && !String(row.deal_type || '').includes('loan')) return false;
      if (filter === 'free_agents' && row.deal_type !== 'free' && row.from_club_id) return false;
      if (filter === 'contract_extensions' && row.deal_type !== 'extension') return false;
    }
    if (q) {
      const hay = `${row.player_name || ''} ${row.from_club_name || ''} ${row.to_club_name || ''} ${row.headline || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    const fee = Number(row.transfer_fee || 0);
    if (band.min && fee < band.min) return false;
    if (band.max && fee > band.max) return false;
    return true;
  });
}

export function stampColor(kind) {
  const key = String(kind || '').toLowerCase();
  if (['official', 'shirts', 'tickets', 'contract'].includes(key)) return '#0f6b3a';
  if (key === 'failed') return '#111111';
  if (['rumour', 'reported', 'stadium', 'trophy', 'champion'].includes(key)) return '#8a6a12';
  if (['lifestyle', 'motm', 'signed'].includes(key)) return '#4b1f73';
  if (['press', 'commentary'].includes(key)) return '#b40d22';
  return '#c70f2b';
}

export async function loadNewsDesk(section, client = stageClient) {
  try {
    const data = await client.http.get(`/news-desks/${encodeURIComponent(section)}`);
    return unwrapDesk(data, { ...EMPTY_DESK, kicker: section });
  } catch {
    return { ...EMPTY_DESK, kicker: 'Desk', line: '' };
  }
}

export async function loadMercatoDesk(client = stageClient) {
  try {
    const data = await client.http.get('/mercato-transfers/desk');
    return unwrapDesk(data, EMPTY_MERCATO);
  } catch {
    return { ...EMPTY_MERCATO };
  }
}

export async function loadMercatoTransfer(id, client = stageClient) {
  if (!id) return null;
  try {
    const data = await client.http.get(`/mercato-transfers/${encodeURIComponent(id)}`);
    return unwrapDesk(data, data) || null;
  } catch {
    return null;
  }
}

export function transferToNewspaperItem(transfer) {
  if (!transfer) return null;
  const title = transfer.headline
    || [transfer.player_name, transfer.to_club_name].filter(Boolean).join(' to ');
  return {
    id: transfer.id,
    title,
    body: transfer.body || '',
    player_name: transfer.player_name,
    player_id: transfer.player_id,
    player_avatar_url: transfer.player_avatar_url,
    photo_url: transfer.player_photo_url || transfer.player_avatar_url,
    photo_position: transfer.photo_position || '50% 18%',
    club_name: transfer.to_club_name,
    club_id: transfer.to_club_id,
    club_logo_url: transfer.to_club_logo_url,
    transfer_fee_stc: transfer.transfer_fee,
    published_at: transfer.last_updated_at || transfer.published_at,
    _category: transfer.status === 'rumour' || transfer.status === 'reported' ? 'market' : 'transfers',
  };
}

const UK_HOME_NATIONS = new Set(['GB', 'UK', 'ENG', 'SCO', 'WAL', 'NIR']);

export function countryMatches(rowCode, selected) {
  const a = String(rowCode || '').toUpperCase();
  const b = String(selected || '').toUpperCase();
  if (!b) return true;
  if (a === b) return true;
  return UK_HOME_NATIONS.has(a) && UK_HOME_NATIONS.has(b);
}

export function clubRoute(clubId) {
  if (!clubId) return null;
  return { pathname: '/apps/club/[id]', params: { id: String(clubId) } };
}

export function playerRoute(playerId) {
  if (!playerId) return null;
  return { pathname: '/(tabs)/profile/profilescreen', params: { playerId: String(playerId) } };
}

export function tournamentRoute(tournamentId) {
  if (!tournamentId) return null;
  return { pathname: '/(tabs)/tournaments/tournamentdetailscreen', params: { tournamentId: String(tournamentId) } };
}
