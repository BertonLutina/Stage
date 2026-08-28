import {
  PAGE_TILE_KEYS,
  getGameDayTileBackgroundConfig,
  hasCustomGameDayTileBackground,
  normalizePageTileKey,
  parseGameDayTileBackgrounds,
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

  it('allows page tiles on the same JSON column as Game Day', () => {
    expect(PAGE_TILE_KEYS).toEqual(expect.arrayContaining([
      'home', 'tournaments', 'profile', 'apps', 'inbox', 'competitions', 'transfers',
    ]));
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
  });
});
