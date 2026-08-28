const fs = require('fs');
const path = require('path');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, rel), 'utf8');
}

describe('page tiles', () => {
  test('dialog still patches the shared tile-background endpoint', () => {
    const dialog = read('../../components/matches/GameDayTileBackgroundDialog.jsx');
    expect(dialog).toMatch(/game-day-tile-background/);
    expect(dialog).toMatch(/title_key/);
    expect(dialog).toMatch(/pageTileKeyFields/);
    expect(dialog).toMatch(/STAGE_PLUS_TILE_BACKGROUND_ERROR/);
    expect(dialog).toMatch(/canCustomize/);
    expect(read('../../components/theme/PageTile.jsx')).toMatch(/canUseTileBackgrounds/);
    expect(read('../../components/theme/PageTile.jsx')).toMatch(/GameDayTileBackgroundDialog/);
    expect(read('../../components/theme/PageTile.jsx')).toMatch(/tileKey/);
  });

  test('Tournaments uses the silver page tile, not gold neon', () => {
    const list = read('../../app/(tabs)/tournaments/tournamentlistscreen.jsx');
    expect(list).toMatch(/tileKey="tournaments"/);
    expect(list).toMatch(/PageTile/);
    expect(list).not.toMatch(/PitchAtmosphere/);
    expect(list).not.toMatch(/FUT\.gold/);
    expect(list).not.toMatch(/GamerTabNav/);
    const card = read('../../components/tournament/TournamentCard.jsx');
    expect(card).not.toMatch(/TYPE_COLOR/);
    expect(card).not.toMatch(/LiveGlass/);
    expect(card).toMatch(/GAME_DAY_SILVER/);
  });

  test('Home, Profile, Apps, Inbox, and GOST wrap content in PageTile', () => {
    expect(read('../../components/dashboard/DashboardLayoutLab.jsx')).toMatch(/tileKey="home"/);
    expect(read('../../app/(tabs)/profile/profilescreen.jsx')).toMatch(/tileKey="profile"/);
    expect(read('../../app/(tabs)/search/index.jsx')).toMatch(/tileKey="apps"/);
    expect(read('../../app/apps/inbox/index.jsx')).toMatch(/tileKey="inbox"/);
    expect(read('../../app/apps/competitions.jsx')).toMatch(/tileKey="competitions"/);
    expect(read('../../app/apps/competitions.jsx')).not.toMatch(/PitchAtmosphere/);
    expect(read('../../app/apps/transfers.jsx')).toMatch(/tileKey="transfers"/);
    expect(read('../../app/apps/transfers.jsx')).toMatch(/PageTile/);
    expect(read('../../app/apps/find-players.jsx')).toMatch(/tileKey="find_players"/);
    expect(read('../../app/apps/find-clubs.jsx')).toMatch(/tileKey="find_clubs"/);
  });

  test('page titles sit outside the tile background', () => {
    const files = [
      '../../components/theme/PageTile.jsx',
      '../../app/apps/transfers.jsx',
      '../../app/apps/inbox/index.jsx',
      '../../app/apps/competitions.jsx',
      '../../app/apps/register.jsx',
      '../../app/(tabs)/search/index.jsx',
      '../../app/(tabs)/tournaments/tournamentlistscreen.jsx',
      '../../app/(tabs)/tournaments/tournamentdetailscreen.jsx',
      '../../app/apps/find-players.jsx',
      '../../app/apps/find-clubs.jsx',
    ];
    expect(read(files[0])).toMatch(/export function PageTitle/);
    files.slice(1).forEach((rel) => {
      const src = read(rel);
      expect(src).toMatch(/<PageTitle/);
      const open = src.match(/<PageTile\b[\s\S]*?>/);
      expect(open).toBeTruthy();
      expect(open[0]).not.toMatch(/\beyebrow=/);
      expect(open[0]).toMatch(/tileTitle=/);
    });
    const home = read('../../components/dashboard/DashboardLayoutLab.jsx');
    expect(home).toMatch(/<PageTile\b[\s\S]*?tileTitle="HOME"/);
    expect(home).not.toMatch(/<PageTitle/);
    const profile = read('../../app/(tabs)/profile/profilescreen.jsx');
    expect(profile).toMatch(/tileTitle="PROFILE"/);
    expect(profile).not.toMatch(/<PageTitle/);
  });
});
