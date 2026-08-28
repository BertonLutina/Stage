import {
  PAGE_TILE_KEYS,
  STAGE_PLUS_TILE_BACKGROUND_ERROR,
  canUseTileBackgrounds,
  getGameDayTileBackgroundConfig,
  hasCustomGameDayTileBackground,
  isPageTileKey,
  normalizePageTileKey,
  pageTileKeyFields,
  parseGameDayTileBackgrounds,
  resolvePageTileKey,
} from '../../lib/gameDayTileBackgrounds';

describe('Game Day tile backgrounds', () => {
  it('reads a custom match_details tile from the player JSON', () => {
    const player = {
      game_day_tile_backgrounds: {
        match_details: { type: 'official', background_id: 'bg-1', url: 'https://cdn.example/trophy.jpg', position: '40% 60%', zoom: 140 },
      },
    };
    const config = getGameDayTileBackgroundConfig(player, 'match_details');
    expect(config.url).toBe('https://cdn.example/trophy.jpg');
    expect(hasCustomGameDayTileBackground(config)).toBe(true);
    expect(getGameDayTileBackgroundConfig(player, 'match_screens').type).toBe('default');
  });

  it('parses string JSON the same way the server stores it', () => {
    const parsed = parseGameDayTileBackgrounds('{"dressing_room":{"type":"custom","url":"https://cdn.example/x.jpg"}}');
    expect(parsed.dressing_room.url).toContain('cdn.example');
  });

  it('allows only these stored tile keys', () => {
    expect(PAGE_TILE_KEYS).toEqual([
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
    ]);
    expect(isPageTileKey('profile')).toBe(true);
    expect(isPageTileKey('FIND PLAYERS')).toBe(true);
    expect(isPageTileKey('find_clubs')).toBe(true);
    expect(isPageTileKey('not_a_tile')).toBe(false);
    expect(resolvePageTileKey('not_a_tile', 'PROFILE')).toBe('profile');
    expect(pageTileKeyFields('home')).toEqual({
      tile_key: 'home',
      tileKey: 'home',
      title_key: 'home',
      titleKey: 'home',
    });
    const config = getGameDayTileBackgroundConfig(
      { game_day_tile_backgrounds: { home: { type: 'custom', url: 'https://cdn.example/home.jpg' } } },
      'home',
    );
    expect(hasCustomGameDayTileBackground(config)).toBe(true);
  });

  it('normalizes titles and aliases to the stored tile_key', () => {
    expect(normalizePageTileKey('HOME')).toBe('home');
    expect(normalizePageTileKey('Match Screens')).toBe('match_screens');
    expect(normalizePageTileKey('GOST')).toBe('competitions');
    expect(normalizePageTileKey('TRANSFER HUB')).toBe('transfers');
    expect(normalizePageTileKey('Find Players')).toBe('find_players');
    expect(normalizePageTileKey('Find Clubs')).toBe('find_clubs');
    expect(normalizePageTileKey('find_player')).toBe('find_players');
  });

  it('requires STAGE Plus to use a custom tile background', () => {
    expect(canUseTileBackgrounds({ subscription: 'stage_plus' })).toBe(true);
    expect(canUseTileBackgrounds({ subscription: 'free' })).toBe(false);
    expect(canUseTileBackgrounds({})).toBe(false);
    expect(STAGE_PLUS_TILE_BACKGROUND_ERROR).toMatch(/STAGE Plus is required/);
  });
});
