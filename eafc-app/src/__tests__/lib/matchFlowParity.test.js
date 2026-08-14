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
    expect(read('../../app/apps/find-players.jsx')).toMatch(/opponentKind: 'player'/);
    expect(read('../../app/apps/find-clubs.jsx')).toMatch(/opponentKind: 'club'/);
    expect(read('../../app/(tabs)/search/searchplayer.jsx')).not.toMatch(/TODO: Implement challenge/);
  });

  test('apps directory screens load Stage web data', () => {
    expect(read('../../app/apps/find-players.jsx')).toMatch(/loadPlayerDirectory/);
    expect(read('../../app/apps/find-clubs.jsx')).toMatch(/loadClubDirectory/);
    expect(read('../../app/apps/presidents.jsx')).toMatch(/loadPresidentDirectory/);
    expect(read('../../app/apps/transfers.jsx')).toMatch(/loadTransferMarket/);
    expect(read('../../app/apps/wallet.jsx')).toMatch(/loadWallet/);
    expect(read('../../app/apps/rankings.jsx')).toMatch(/loadRankings/);
    expect(read('../../app/apps/rankings.jsx')).not.toMatch(/router\.replace\('\/apps\/competitions'\)/);
  });

  test('tournament detail uses Stage registration and Game Day matches', () => {
    const source = read('../../app/(tabs)/tournaments/tournamentdetailscreen.jsx');
    expect(source).toMatch(/registerTournamentClub/);
    expect(source).toMatch(/initializeTournamentDraw/);
    expect(source).toMatch(/advanceTournamentRound/);
    expect(source).toMatch(/matchdetailscreen/);
    expect(source).toMatch(/isPlayerTournament/);
    expect(source).not.toMatch(/api\.get\(`\/tournaments\//);
    expect(source).not.toMatch(/tournament\.mode !== 'club'/);
  });

  test('match hub and tournament list use Game Day / Open Tournaments labels', () => {
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/KICKOFF/);
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/Game Day/);
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/GameDayKickoffArena/);
    expect(read('../../app/(tabs)/matches/index.jsx')).not.toMatch(/MATCH CENTER/);
    expect(read('../../app/(tabs)/_layout.jsx')).toMatch(/title: 'Game Day'/);
    expect(read('../../app/(tabs)/tournaments/tournamentlistscreen.jsx')).toMatch(/Open tournaments/);
    expect(read('../../app/(tabs)/tournaments/tournamentlistscreen.jsx')).not.toMatch(/Stage cups/);
  });

  test('season and competition screens exist', () => {
    expect(read('../../app/apps/register.jsx')).toMatch(/applyForLeague/);
    expect(read('../../app/apps/competitions.jsx')).toMatch(/loadCompetitionsHub/);
    expect(read('../../app/apps/competitions/[slug].jsx')).toMatch(/createMatchFromFixture/);
    expect(read('../../app/apps/leagues/[slug].jsx')).toMatch(/regional_league/);
  });
});
