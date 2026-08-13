const fs = require('fs');
const path = require('path');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, rel), 'utf8');
}

describe('mobile match / tournament / season parity wiring', () => {
  test('hub materializes confirmed league fixtures', () => {
    const source = read('../../hooks/useMatchesHub.js');
    expect(source).toMatch(/materializeConfirmedFixtures/);
  });

  test('inbox league_schedule uses scheduleEngine accept/propose', () => {
    const source = read('../../lib/inboxData.js');
    expect(source).toMatch(/league_schedule/);
    expect(source).toMatch(/acceptProposal/);
    expect(source).toMatch(/proposeTime/);
  });

  test('search Challenge opens Arrange VS', () => {
    expect(read('../../app/(tabs)/search/searchplayer.jsx')).toMatch(/opponentKind: 'player'/);
    expect(read('../../app/(tabs)/search/searchclubs.jsx')).toMatch(/opponentKind: 'club'/);
    expect(read('../../app/(tabs)/search/searchplayer.jsx')).not.toMatch(/TODO: Implement challenge/);
  });

  test('tournament detail uses Stage registration and Game Day matches', () => {
    const source = read('../../app/(tabs)/tournaments/tournamentdetailscreen.jsx');
    expect(source).toMatch(/registerTournamentClub/);
    expect(source).toMatch(/initializeTournamentDraw/);
    expect(source).toMatch(/advanceTournamentRound/);
    expect(source).toMatch(/matchdetailscreen/);
    expect(source).not.toMatch(/api\.get\(`\/tournaments\//);
  });

  test('season and competition screens exist', () => {
    expect(read('../../app/apps/register.jsx')).toMatch(/applyForLeague/);
    expect(read('../../app/apps/competitions.jsx')).toMatch(/loadCompetitionsHub/);
    expect(read('../../app/apps/competitions/[slug].jsx')).toMatch(/createMatchFromFixture/);
    expect(read('../../app/apps/leagues/[slug].jsx')).toMatch(/regional_league/);
  });
});
