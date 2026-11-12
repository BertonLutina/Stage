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

  test('Tournaments uses the rebuild mockup primitives, not the legacy page tile or gold neon', () => {
    const list = read('../../app/(tabs)/tournaments/tournamentlistscreen.jsx');
    expect(list).toMatch(/SegmentedControl/);
    expect(list).toMatch(/TournamentCard/);
    expect(list).not.toMatch(/PageTile/);
    expect(list).not.toMatch(/PitchAtmosphere/);
    expect(list).not.toMatch(/FUT\.gold/);
    expect(list).not.toMatch(/GamerTabNav/);
    const card = read('../../components/tournament/TournamentCard.jsx');
    expect(card).not.toMatch(/TYPE_COLOR/);
    expect(card).not.toMatch(/LiveGlass/);
    expect(card).toMatch(/useThemeStore/);
    expect(card).not.toMatch(/GAME_DAY_SILVER|FUT\./);
  });

  test('Home, Profile, Apps, Inbox, and GOST wrap content in PageTile', () => {
    expect(read('../../components/dashboard/DashboardLayoutLab.jsx')).toMatch(/tileKey="home"/);
    expect(read('../../app/(tabs)/profile/profilescreen.jsx')).toMatch(/tileKey="profile"/);
    // Apps mockup: flat App directory (no PageTile frame).
    expect(read('../../app/apps/index.jsx')).not.toMatch(/<PageTile\b/);
    expect(read('../../app/apps/index.jsx')).toMatch(/APP DIRECTORY/);
    // Inbox mockup: flat list (no PageTile frame).
    expect(read('../../app/apps/inbox/index.jsx')).not.toMatch(/<PageTile\b/);
    expect(read('../../components/competitions/CompetitionsView.jsx')).toMatch(/tileKey="competitions"/);
    expect(read('../../components/competitions/CompetitionsView.jsx')).not.toMatch(/PitchAtmosphere/);
    // Mercato / Season registration follow audit mockups (flat header, no PageTile frame).
    expect(read('../../app/apps/transfers.jsx')).not.toMatch(/<PageTile\b/);
    expect(read('../../app/apps/register.jsx')).not.toMatch(/<PageTile\b/);
    expect(read('../../app/apps/find-players.jsx')).toMatch(/tileKey="find_players"/);
    expect(read('../../app/apps/find-clubs.jsx')).toMatch(/tileKey="find_clubs"/);
  });

  test('page titles sit outside the tile background', () => {
    const files = [
      '../../components/theme/PageTile.jsx',
      '../../components/competitions/CompetitionsView.jsx',
      '../../app/(tabs)/search/index.jsx',
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
    // Audit / Apps mockups: flat headers without PageTile.
    expect(read('../../app/apps/register.jsx')).toMatch(/<PageTitle/);
    expect(read('../../app/apps/transfers.jsx')).toMatch(/SectionLabel/);
    expect(read('../../app/apps/inbox/index.jsx')).toMatch(/<PageTitle/);
    expect(read('../../app/apps/inbox/index.jsx')).not.toMatch(/<PageTile\b/);
    const home = read('../../components/dashboard/DashboardLayoutLab.jsx');
    expect(home).toMatch(/<PageTile\b[\s\S]*?tileTitle="HOME"/);
    expect(home).not.toMatch(/<PageTitle/);
    const profile = read('../../app/(tabs)/profile/profilescreen.jsx');
    expect(profile).toMatch(/tileTitle="PROFILE"/);
    expect(profile).not.toMatch(/<PageTitle/);
  });
});
