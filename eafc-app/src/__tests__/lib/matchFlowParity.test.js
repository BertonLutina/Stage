const fs = require('fs');
const path = require('path');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, rel), 'utf8');
}

describe('mobile match / tournament / season parity wiring', () => {
  test('hub materializes confirmed league fixtures', () => {
    const source = read('../../hooks/useMatchesHub.js');
    expect(source).toMatch(/presidentClub/);
    expect(source).toMatch(/uniqueIdentityClubs/);
    expect(source).toMatch(/materializeConfirmedFixtures/);
    expect(source).toMatch(/loadPendingCompetitionFixtures/);
    expect(source).toMatch(/useFocusEffect/);
    expect(source).toMatch(/isKickoffEligibleMatch/);
  });

  test('inbox league_schedule uses scheduleEngine accept/propose', () => {
    const source = read('../../lib/inboxData.js');
    expect(source).toMatch(/league_schedule/);
    expect(source).toMatch(/acceptProposal/);
    expect(source).toMatch(/proposeTime/);
    expect(source).toMatch(/uniqueIdentityClubs/);
    expect(source).toMatch(/presidentClub/);
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
    expect(read('../../app/apps/transfers.jsx')).toMatch(/loadTransferMarket/);
    expect(read('../../app/apps/wallet.jsx')).toMatch(/loadWallet/);
    expect(read('../../app/apps/store.jsx')).toMatch(/startStagePlusCheckout/);
    expect(read('../../app/apps/store.jsx')).toMatch(/startCreditPackCheckout/);
    expect(read('../../app/apps/store.jsx')).toMatch(/completeStoreCheckoutFromUrl/);
    expect(read('../../lib/stripeCheckout.js')).toMatch(/stripeSubscription/);
    expect(read('../../lib/stripeCheckout.js')).toMatch(/auth\/store-return/);
    expect(read('../../lib/stripeCheckout.js')).toMatch(/makeRedirectUri/);
    expect(read('../../app/_layout.jsx')).toMatch(/apps\\\/store/);
  });

  test('tournament detail uses Stage registration and Game Day matches', () => {
    const source = read('../../app/(tabs)/tournaments/tournamentdetailscreen.jsx');
    expect(source).toMatch(/registerTournamentClub/);
    expect(source).toMatch(/initializeTournamentDraw/);
    expect(source).toMatch(/advanceTournamentRound/);
    expect(source).toMatch(/matchdetailscreen/);
    expect(source).toMatch(/isPlayerTournament/);
    expect(source).toMatch(/eaClubName/);
    expect(source).toMatch(/presidentClub/);
    expect(source).not.toMatch(/api\.get\(`\/tournaments\//);
    expect(source).not.toMatch(/tournament\.mode !== 'club'/);
  });

  test('match hub and tournament list use Game Day / Open Tournaments labels', () => {
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/KICKOFF/);
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/Game Day/);
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/MATCH SCREENS/);
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/MATCH DETAILS/);
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/GameDayKickoffArena/);
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/GameDayKickoffActions/);
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/GameDayScoreReport/);
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/GameDayResultSheet/);
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/GameDayTileBackgroundDialog/);
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/Pending GOST/);
    expect(read('../../app/(tabs)/matches/index.jsx')).toMatch(/FixtureScheduleActions/);
    expect(read('../../app/(tabs)/matches/index.jsx')).not.toMatch(/GameDayDressingRoomPanel/);
    expect(read('../../components/matches/GameDayKickoffArena.jsx')).toMatch(/onChangeBackground/);
    expect(read('../../components/matches/GameDayTileBackgroundDialog.jsx')).toMatch(/game-day-tile-background/);
    expect(read('../../app/(tabs)/matches/index.jsx')).not.toMatch(/MATCH CENTER/);
    expect(read('../../app/(tabs)/_layout.jsx')).toMatch(/title: 'Game Day'/);
    expect(read('../../app/(tabs)/tournaments/tournamentlistscreen.jsx')).toMatch(/Open tournaments/);
    expect(read('../../app/(tabs)/tournaments/tournamentlistscreen.jsx')).toMatch(/GOST/);
    expect(read('../../app/(tabs)/tournaments/tournamentlistscreen.jsx')).toMatch(/\/apps\/register/);
    expect(read('../../app/(tabs)/tournaments/tournamentlistscreen.jsx')).toMatch(/createtournamentscreen/);
    expect(read('../../app/(tabs)/tournaments/createtournamentscreen.jsx')).toMatch(/buildCommunityTournamentPayload/);
    expect(read('../../app/(tabs)/tournaments/createtournamentscreen.jsx')).toMatch(/TOURNAMENT_CREDIT_COST/);
    expect(read('../../app/(tabs)/tournaments/tournamentlistscreen.jsx')).not.toMatch(/Stage cups/);
  });

  test('season and competition screens exist', () => {
    expect(read('../../app/apps/register.jsx')).toMatch(/applyForLeague/);
    expect(read('../../app/apps/register.jsx')).toMatch(/entityHasStagePlus/);
    expect(read('../../app/apps/register.jsx')).toMatch(/presidentClub/);
    expect(read('../../app/(tabs)/profile/editprofilescreen.jsx')).not.toMatch(/President\.update/);
    expect(read('../../lib/clubProfileData.js')).not.toMatch(/entities\.President/);
    expect(read('../../app/apps/competitions.jsx')).toMatch(/loadCompetitionsHub/);
    expect(read('../../app/apps/competitions/[slug].jsx')).toMatch(/createMatchFromFixture/);
    expect(read('../../app/apps/competitions/[slug].jsx')).toMatch(/canOpenGameDayFromFixture/);
    expect(read('../../app/apps/competitions/[slug].jsx')).not.toMatch(/status === 'scheduled'/);
    expect(read('../../app/apps/leagues/[slug].jsx')).toMatch(/regional_league/);
    expect(read('../../app/apps/leagues/[slug].jsx')).toMatch(/uniqueIdentityClubs/);
    expect(read('../../app/apps/leagues/[slug].jsx')).toMatch(/canOpenGameDayFromFixture/);
    expect(read('../../app/apps/leagues/[slug].jsx')).toMatch(/presidentClub/);
    expect(read('../../lib/gameDayIntegration.js')).toMatch(/scheduling_status \|\| ''\)\.toLowerCase\(\) !== 'confirmed'/);
    expect(read('../../lib/scheduleEngine.js')).toMatch(/scheduling_status: 'confirmed'/);
    expect(read('../../lib/scheduleEngine.js')).toMatch(/scheduled_date: confirmedDate/);
  });

  test('mobile socket joins STAGE rooms and Game Day pages subscribe', () => {
    const socket = read('../../lib/SocketContext.js');
    const protocol = read('../../lib/socketRealtime.js');
    expect(protocol).toMatch(/JOINLEAVEROOM/);
    expect(socket).toMatch(/io\(/);
    expect(socket).toMatch(/SocketProvider/);
    expect(socket).toMatch(/['"]update['"]/);
    expect(read('../../app/_layout.jsx')).toMatch(/SocketProvider/);
    expect(read('../../app/_layout.jsx')).toMatch(/<Toast /);
    expect(read('../../components/common/Toast.jsx')).toMatch(/FullWindowOverlay/);
    expect(read('../../hooks/useMatchesHub.js')).toMatch(/settleClubMatches/);
    expect(read('../../hooks/useMatchesHub.js')).toMatch(/matchBelongsToIdentity/);
    expect(read('../../hooks/useGameDayMatchRealtime.js')).toMatch(/entities\.Match\.subscribe/);
    expect(read('../../hooks/useGameDayMatchRealtime.js')).toMatch(/if \(!resolved\) return/);
    expect(read('../../hooks/useGameDayMatchRealtime.js')).not.toMatch(/DressingRoom/);
    expect(read('../../app/(tabs)/matches/matchdetailscreen.jsx')).toMatch(/useGameDayMatchRealtime/);
    expect(read('../../app/(tabs)/matches/matchdetailscreen.jsx')).not.toMatch(/GameDayDressingRoomPanel/);
  });
});
