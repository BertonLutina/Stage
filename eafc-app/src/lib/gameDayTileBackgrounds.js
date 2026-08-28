import { hasStagePlus } from './subscriptionUtils';

/** Keys stored on player.game_day_tile_backgrounds — Game Day plus the other app pages. */
export const PAGE_TILE_KEYS = [
  'match_screens',
  'match_details',
  'dressing_room',
  'home',
  'tournaments',
  'profile',
  'apps',
  'inbox',
  'competitions',
  'transfers',
  'find_players',
  'find_clubs',
];

export function parseGameDayTileBackgrounds(value) {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

const TILE_KEY_ALIASES = {
  gost: 'competitions',
  transfer_hub: 'transfers',
  findplayers: 'find_players',
  find_player: 'find_players',
  findclubs: 'find_clubs',
  find_club: 'find_clubs',
  matchscreens: 'match_screens',
  matchdetails: 'match_details',
  dressingroom: 'dressing_room',
};

export function normalizePageTileKey(raw) {
  const key = String(raw || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return TILE_KEY_ALIASES[key] || key;
}

export function isPageTileKey(raw) {
  return PAGE_TILE_KEYS.includes(normalizePageTileKey(raw));
}

/** First candidate that maps to a stored page-tile key. */
export function resolvePageTileKey(...candidates) {
  for (const raw of candidates) {
    const key = normalizePageTileKey(raw);
    if (PAGE_TILE_KEYS.includes(key)) return key;
  }
  return '';
}

/** Live and local servers have looked for tile_key, tileKey, and title_key. */
export function pageTileKeyFields(key) {
  return { tile_key: key, tileKey: key, title_key: key, titleKey: key };
}

export function pageTileKeyQuery(key) {
  const encoded = encodeURIComponent(key);
  return `tile_key=${encoded}&tileKey=${encoded}&title_key=${encoded}`;
}

export function getGameDayTileBackgroundConfig(player, tileKey) {
  const backgrounds = parseGameDayTileBackgrounds(player?.game_day_tile_backgrounds);
  const config = backgrounds?.[normalizePageTileKey(tileKey)];
  if (!config || typeof config !== 'object') {
    return { type: 'default', url: '', position: '50% 50%', zoom: 120 };
  }
  return {
    type: config.type || 'default',
    background_id: config.background_id || null,
    url: config.url || '',
    position: config.position || '50% 50%',
    zoom: Number(config.zoom) || 120,
  };
}

export const STAGE_PLUS_TILE_BACKGROUND_ERROR =
  'STAGE Plus is required to change this tile background.';

export function canUseTileBackgrounds(player) {
  return hasStagePlus(player?.subscription);
}

export function hasCustomGameDayTileBackground(config) {
  return Boolean(config?.url && config?.type && config.type !== 'default');
}

export function gameDayTileImageLayout(config) {
  const zoom = Number(config?.zoom) || 120;
  const [xRaw, yRaw] = String(config?.position || '50% 50%').split(/\s+/);
  const x = Number(String(xRaw).replace('%', '')) || 50;
  const y = Number(String(yRaw).replace('%', '')) || 50;
  return {
    position: 'absolute',
    width: `${zoom}%`,
    height: `${zoom}%`,
    left: `${x - zoom / 2}%`,
    top: `${y - zoom / 2}%`,
  };
}
