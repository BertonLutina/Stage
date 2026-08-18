import {
  canShowContractOfferButton,
  canShowLoanRequestButton,
  getSignedClubIdForPlayer,
} from '../../lib/contractOfferVisibility';

describe('contract and loan request visibility', () => {
  test('signed players do not show the contract offer button', () => {
    expect(canShowContractOfferButton({
      player: { id: 'player-1', club_id: 'club-current' },
      viewerClub: { id: 'club-viewer' },
      playerContracts: [],
    })).toBe(false);
  });

  test('an active accepted contract links the player to its club even when player.club_id is stale', () => {
    const contracts = [
      { id: 'contract-1', user_id: 'player-1', team_id: 'club-signed', status: 'active' },
    ];
    expect(getSignedClubIdForPlayer({ id: 'player-1' }, contracts)).toBe('club-signed');
    expect(canShowContractOfferButton({
      player: { id: 'player-1' },
      viewerClub: { id: 'club-viewer' },
      playerContracts: contracts,
    })).toBe(false);
  });

  test('signed players show Request Loan to a different club, not a contract offer', () => {
    const player = { id: 'player-1', club_id: 'club-a' };
    const viewerClub = { id: 'club-b' };
    const playerContracts = [
      { id: 'contract-1', user_id: 'player-1', team_id: 'club-a', status: 'active' },
    ];
    expect(canShowContractOfferButton({ player, viewerClub, playerContracts })).toBe(false);
    expect(canShowLoanRequestButton({ player, viewerClub, playerContracts })).toBe(true);
  });

  test('a club cannot request a loan for its own contracted player', () => {
    expect(canShowLoanRequestButton({
      player: { id: 'player-1', club_id: 'club-a' },
      viewerClub: { id: 'club-a' },
      playerContracts: [],
    })).toBe(false);
  });

  test('free agents do not get a loan request button', () => {
    expect(canShowLoanRequestButton({
      player: { id: 'player-free' },
      viewerClub: { id: 'club-b' },
      playerContracts: [],
    })).toBe(false);
  });

  test('the loan request button is hidden for a player who already has a live loan', () => {
    const player = { id: 'player-1', club_id: 'club-a' };
    const viewerClub = { id: 'club-b' };
    expect(canShowLoanRequestButton({ player, viewerClub, loans: [] })).toBe(true);
    for (const status of ['PROPOSED', 'AWAITING_PLAYER', 'PENDING_WINDOW', 'ACTIVE']) {
      expect(canShowLoanRequestButton({
        player,
        viewerClub,
        loans: [{ player_id: 'player-1', status }],
      })).toBe(false);
    }
    for (const status of ['COMPLETED', 'PURCHASED', 'RECALLED', 'TERMINATED_EARLY']) {
      expect(canShowLoanRequestButton({
        player,
        viewerClub,
        loans: [{ player_id: 'player-1', status }],
      })).toBe(true);
    }
  });
});
