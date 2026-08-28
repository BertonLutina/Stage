const fs = require('fs');
const path = require('path');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, rel), 'utf8');
}

describe('page tiles', () => {
  test('dialog still patches the shared tile-background endpoint', () => {
    expect(read('../../components/matches/GameDayTileBackgroundDialog.jsx')).toMatch(/game-day-tile-background/);
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
  });
});
