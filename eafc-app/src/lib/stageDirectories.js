import { stageClient, resolveMyPlayerAndClub } from '@/api/stageClient';
import { internationalTournamentsApi } from '@/api/internationalTournaments';
import { asObjectArray } from '@/lib/clubProfileData';
import { filterPublicPlayerProfiles, isPublicPlayerProfile } from '@/lib/playerDirectory';
import {
  buildPlayerPresidentDirectoryRows,
  matchesPlayerPresidentQuery,
} from '@/lib/presidentDirectory';
import {
  buildTransferMarketEntries,
  normalizeTransferMarketPlayers,
} from '@/lib/transferMarketEntries';
import { normalizePlayerContracts } from '@/lib/playerContractFields';

export const PLAYER_POSITIONS = ['All', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'];
export const PLATFORMS = ['All', 'PlayStation', 'Xbox', 'PC'];
export const CLUB_REGIONS = ['All', 'Europe', 'North America', 'South America', 'Asia', 'Oceania', 'Middle East'];

export const LIFESTYLE_CATEGORIES = [
  { id: 'houses', label: 'Houses & Apts', emoji: '🏠' },
  { id: 'cars', label: 'Cars', emoji: '🚗' },
  { id: 'watches', label: 'Watches', emoji: '⌚' },
  { id: 'fashion', label: 'Fashion', emoji: '👔' },
  { id: 'vip_experiences', label: 'VIP', emoji: '🌟' },
  { id: 'personal_services', label: 'Services', emoji: '💼' },
];

const CATEGORY_DISPLAY_MAP = {
  real_estate: 'houses',
  vehicle: 'cars',
  clothing: 'fashion',
  extras: 'watches',
  lifestyle: 'personal_services',
  event: 'vip_experiences',
  charity: 'personal_services',
};

export const NEWS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'transfers', label: 'Transfers' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'club_news', label: 'Club' },
  { id: 'player_news', label: 'Players' },
  { id: 'market', label: 'Market' },
  { id: 'tournament', label: 'Tournaments' },
  { id: 'press_conference', label: 'Press' },
];

export const CREDIT_PACKS = [
  { id: 'credits_entry', credits: 50, price_eur: 1.99, label: 'Entry Pack' },
  { id: 'credits_starter', credits: 100, price_eur: 2.99, label: 'Starter Pack' },
  { id: 'credits_competitor', credits: 250, price_eur: 5.99, label: 'Competitor Pack' },
  { id: 'credits_club', credits: 600, price_eur: 10.99, label: 'Club Pack' },
];

export const STAGE_PLUS_PRICE = { monthly: 4.99, yearly: 49.99 };
export const STAGE_PLUS_MONTHLY_CREDITS = 150;

function unwrapFunction(result) {
  if (!result || typeof result !== 'object') return {};
  return result.data && typeof result.data === 'object' ? result.data : result;
}

export function formatSTC(n) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}K`;
  return v.toLocaleString();
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function playerDisplayName(player) {
  return player?.gamertag || player?.display_name || 'Player';
}

export function clubDisplayName(club) {
  return club?.name || club?.club_name || 'Club';
}

export function resolveLifestyleCategory(raw) {
  return CATEGORY_DISPLAY_MAP[raw] || raw || 'fashion';
}

export function mapClubsById(clubs) {
  const map = {};
  asObjectArray(clubs).forEach((club) => {
    if (club?.id) map[club.id] = club;
  });
  return map;
}

export function filterPlayerDirectory(players, { query = '', platform = 'All', position = 'All' } = {}) {
  const q = String(query || '').trim().toLowerCase();
  return asObjectArray(players)
    .filter((player) => {
      const name = `${player.gamertag || ''} ${player.display_name || ''}`.toLowerCase();
      if (q && !name.includes(q)) return false;
      if (platform !== 'All' && player.platform !== platform) return false;
      if (position !== 'All' && player.position !== position && player.secondary_position !== position) return false;
      return true;
    })
    .sort((a, b) => playerDisplayName(a).localeCompare(playerDisplayName(b)));
}

export function filterClubDirectory(clubs, { query = '', platform = 'All', region = 'All' } = {}) {
  const q = String(query || '').trim().toLowerCase();
  return asObjectArray(clubs)
    .filter((club) => {
      const name = (club.name || club.club_name || '').toLowerCase();
      const tag = (club.tag || '').toLowerCase();
      if (q && !name.includes(q) && !tag.includes(q)) return false;
      if (platform !== 'All' && club.platform !== platform) return false;
      if (region !== 'All' && club.region !== region) return false;
      return true;
    })
    .sort((a, b) => clubDisplayName(a).localeCompare(clubDisplayName(b)));
}

export function filterPresidentDirectory(rows, query) {
  return asObjectArray(rows)
    .filter((row) => matchesPlayerPresidentQuery(row, query))
    .sort((a, b) => String(a.display_name || '').localeCompare(String(b.display_name || '')));
}

export function filterTransferEntries(entries, { query = '', position = 'All', status = 'all', platform = 'All' } = {}) {
  const q = String(query || '').trim().toLowerCase();
  return asObjectArray(entries).filter((entry) => {
    const player = entry.player || {};
    if (status !== 'all' && entry.badgeType !== status && !(status === 'expiring' && entry.badgeType === 'expiring_soon')) {
      return false;
    }
    if (q && !playerDisplayName(player).toLowerCase().includes(q)) return false;
    if (position !== 'All' && player.position !== position && player.secondary_position !== position) return false;
    if (platform !== 'All' && player.platform !== platform) return false;
    return true;
  });
}

export function resolveNewsCategory(item) {
  if (item?.category && item.category !== 'general') return item.category;
  const typeMap = {
    transfer: 'transfers',
    contract: 'contracts',
    tournament: 'tournament',
    press: 'press_conference',
    press_conference: 'press_conference',
  };
  return typeMap[item?.type] || item?.category || 'general';
}

export function mergeNewsAndPress(newsItems, pressArticles) {
  const news = asObjectArray(newsItems).map((item) => ({
    ...item,
    _category: resolveNewsCategory(item),
  }));
  const fromPress = asObjectArray(pressArticles).map((article) => ({
    id: `press-${article.id}`,
    title: article.title || article.match_name || 'Press conference',
    body: article.summary || article.body || '',
    category: 'press_conference',
    _category: 'press_conference',
    published_at: article.published_at,
    created_date: article.created_date,
    club_name: article.club_name,
    player_name: article.player_name,
    is_global: true,
  }));
  return [...news, ...fromPress].sort((a, b) => (
    new Date(b.published_at || b.created_date || 0) - new Date(a.published_at || a.created_date || 0)
  ));
}

export function isNewsVisible(item, myPlayer, myClub) {
  if (item?.is_global) return true;
  const hasVisibilityData = (
    (item?.visible_to_club_ids?.length > 0) ||
    (item?.visible_to_player_ids?.length > 0)
  );
  if (!hasVisibilityData) return true;
  if (item._category === 'press_conference') return true;
  if (myClub && item.visible_to_club_ids?.includes(myClub.id)) return true;
  if (myPlayer && item.visible_to_player_ids?.includes(myPlayer.id)) return true;
  return false;
}

export function filterNewsItems(items, filterId = 'all') {
  if (filterId === 'all') return items;
  return items.filter((item) => item._category === filterId);
}

export function normalizeFollowRows(rows) {
  return asObjectArray(rows)
    .map((row) => {
      const type = row.target_type || row.following_type || (row.club_id && !row.player_id ? 'club' : 'player');
      const targetId = row.target_id || row.following_id || row.club_id || row.player_id;
      if (!targetId) return null;
      return {
        id: row.id || `${type}-${targetId}`,
        type: type === 'club' ? 'club' : 'player',
        targetId,
        name: row.target_name || row.club_name || row.gamertag || row.display_name || (type === 'club' ? 'Club' : 'Player'),
        avatar: row.avatar_url || row.logo_url || '',
      };
    })
    .filter(Boolean);
}

export function filterRankings(rows, { scope = 'global', region = '', country = '', position = '' } = {}) {
  return asObjectArray(rows).filter((row) => {
    if (scope === 'regional' && region && row.region !== region) return false;
    if (scope === 'country' && country && row.country_code !== country) return false;
    if (position && row.position !== position) return false;
    return true;
  });
}

export async function loadPlayerDirectory(client = stageClient) {
  const [players, clubs] = await Promise.all([
    client.entities.Player.list(null, 500).catch(() => []),
    client.entities.Club.list(null, 500).catch(() => []),
  ]);
  return {
    players: filterPublicPlayerProfiles(asObjectArray(players)),
    clubs: mapClubsById(clubs),
  };
}

export async function loadClubDirectory(client = stageClient) {
  const clubs = await client.entities.Club.list(null, 500).catch(() => []);
  return asObjectArray(clubs).filter((club) => club.id);
}

export async function loadPresidentDirectory(client = stageClient) {
  const [clubs, players] = await Promise.all([
    client.entities.Club.list(null, 500).catch(() => []),
    client.entities.Player.list('-overall_rating', 500).catch(() => []),
  ]);
  return buildPlayerPresidentDirectoryRows(asObjectArray(clubs), asObjectArray(players));
}

export async function loadTransferMarket(client = stageClient) {
  const marketRes = await client.functions.invoke('getTransferMarket', {}).catch(() => ({ data: {} }));
  const normalized = normalizeTransferMarketPlayers(unwrapFunction(marketRes));
  return {
    ...normalized,
    entries: buildTransferMarketEntries(normalized.freeAgents, normalized.expiringPlayers),
  };
}

export async function loadFreeAgents(client = stageClient) {
  const [allPlayers, allClubs] = await Promise.all([
    client.entities.Player.filter({ status: 'free_agent' }).catch(() => []),
    client.entities.Club.list(null, 500).catch(() => []),
  ]);
  const ownerEmails = new Set(asObjectArray(allClubs).map((club) => club.owner_email).filter(Boolean));
  return asObjectArray(allPlayers).filter((player) => (
    isPublicPlayerProfile(player) && !player.club_id && !ownerEmails.has(player.email)
  ));
}

export async function loadWallet(client = stageClient) {
  const [{ player }, balanceRes, historyRes] = await Promise.all([
    resolveMyPlayerAndClub(),
    client.functions.invoke('playerWallet', { action: 'get_balance' }).catch(() => ({})),
    client.functions.invoke('playerWallet', { action: 'get_history', page: 1, limit: 20 }).catch(() => ({})),
  ]);
  const balanceData = unwrapFunction(balanceRes);
  const historyData = unwrapFunction(historyRes);
  return {
    player,
    balance: balanceData.balance ?? player?.stc ?? 0,
    contract: balanceData.contract || null,
    weeklySalary: Number(balanceData.weekly_salary || 0),
    nextSalaryDays: balanceData.next_salary_days,
    summary: balanceData.summary || [],
    transactions: historyData.transactions || [],
    totalTransactions: historyData.total || 0,
  };
}

export async function loadLifestyle(client = stageClient) {
  const { player } = await resolveMyPlayerAndClub();
  const items = await client.entities.LifestyleItem.filter({ is_active: true }, 'sort_order', 200).catch(() => []);
  let purchases = [];
  if (player?.id) {
    const owned = await client.entities.LifestylePurchase.filter({ player_id: player.id }, '-created_date', 500).catch(() => []);
    purchases = asObjectArray(owned).filter((row) => row.status !== 'sold');
  }
  return { player, items: asObjectArray(items), purchases };
}

export async function loadScouting(query = {}, client = stageClient) {
  const rows = await client.http.get('/player-showcase-videos/scouting', query).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

export async function loadNews(client = stageClient) {
  const { player, club } = await resolveMyPlayerAndClub();
  const [news, press] = await Promise.all([
    client.entities.NewsItem.list('-published_at', 100).catch(() => []),
    client.entities.PressArticle.list('-published_at', 30).catch(() => []),
  ]);
  const merged = mergeNewsAndPress(news, press).filter((item) => isNewsVisible(item, player, club));
  return { items: merged, player, club };
}

export async function loadRankings(client = stageClient) {
  const summary = await client.http.get('/rankings/summary').catch(() => null);
  return summary && typeof summary === 'object'
    ? summary
    : { clubs: [], players: [], positions: [], meta: {} };
}

export async function loadStore(client = stageClient) {
  const { player, club } = await resolveMyPlayerAndClub();
  const cfgRows = await client.entities.StoreConfig.filter(
    { is_active: 1, with_defaults: 1 },
    '-updated_date',
    1,
  ).catch(() => []);
  return {
    player,
    club,
    config: asObjectArray(cfgRows)[0] || null,
    credits: Number(player?.credits || 0),
    stc: Number(player?.stc || 0),
  };
}

export async function loadInternational() {
  const { player, presidentClub } = await resolveMyPlayerAndClub();
  const tournaments = await internationalTournamentsApi.list(100).catch(() => []);
  return {
    player,
    presidentClub: presidentClub || null,
    tournaments: asObjectArray(tournaments),
  };
}

export async function loadClubContracts(client = stageClient) {
  const { presidentClub, club } = await resolveMyPlayerAndClub();
  const target = presidentClub || club;
  if (!target?.id) return { club: null, contracts: [], players: [] };
  const [contracts, players] = await Promise.all([
    client.entities.PlayerContract.filter({ team_id: target.id }).catch(() => []),
    client.entities.Player.filter({ club_id: target.id }).catch(() => []),
  ]);
  return {
    club: target,
    contracts: normalizePlayerContracts(contracts),
    players: asObjectArray(players),
  };
}

export async function loadFollowBack(client = stageClient) {
  const { user, player } = await resolveMyPlayerAndClub();
  const followerId = user?.id || player?.id;
  if (!followerId) return { clubs: [], players: [] };
  const rows = await client.entities.Follow.filter({ follower_id: followerId }, '-created_date', 200).catch(() => []);
  const normalized = normalizeFollowRows(rows);
  return {
    clubs: normalized.filter((row) => row.type === 'club'),
    players: normalized.filter((row) => row.type === 'player'),
  };
}

export function walletTxLabel(category) {
  const labels = {
    initial_grant: 'Welcome bonus',
    salary: 'Weekly salary',
    lifestyle_purchase: 'Lifestyle purchase',
    lifestyle_rent: 'Lifestyle rental',
    lifestyle_passive_income: 'Investment return',
    wager_stake: 'Wager stake',
    wager_win: 'Wager won',
    wager_loss: 'Wager lost',
    wager_refund: 'Wager refunded',
    competition_reward: 'Competition reward',
    signing_bonus: 'Signing bonus',
    admin_credit: 'Admin credit',
    admin_debit: 'Admin debit',
  };
  return labels[category] || category || 'Transaction';
}

export function transferBadgeLabel(badgeType, daysLeft) {
  if (badgeType === 'free_agent') return 'Free agent';
  if (badgeType === 'expiring_soon') return `${daysLeft ?? 0}d left`;
  if (badgeType === 'expiring') return `${daysLeft ?? 0}d left`;
  return badgeType || '';
}
