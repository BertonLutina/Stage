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
  matchscreens: 'match_screens',
  matchdetails: 'match_details',
  dressingroom: 'dressing_room',
};

export function normalizePageTileKey(raw) {
  const key = String(raw || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return TILE_KEY_ALIASES[key] || key;
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
