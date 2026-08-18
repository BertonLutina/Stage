import {
  applyLoanAnnotations,
  canExercisePurchaseOption,
  canProposeEarlyEnd,
  getLoanForContract,
  getPlayingClubId,
  isEarlyEndWaitingOnClub,
  isLoanRecallable,
  splitSquadByLoan,
} from '../../lib/playerLoanDisplay';

const loan = {
  id: 'loan-1',
  player_id: 'player-1',
  contract_id: 'contract-1',
  parent_club_id: 'club-a',
  loan_club_id: 'club-b',
  end_date: '2027-06-30',
  status: 'ACTIVE',
};

describe('player loan display', () => {
  test('borrower squad shows a LOAN badge and the owner lists the player as on loan', () => {
    const players = [{ id: 'player-1', gamertag: 'Player X' }];
    const atBorrower = applyLoanAnnotations(players, [loan], 'club-b');
    expect(atBorrower[0].loan_badge).toBe('LOAN');
    expect(atBorrower[0].selectable).toBe(true);

    const atOwner = applyLoanAnnotations(players, [loan], 'club-a');
    const groups = splitSquadByLoan(atOwner);
    expect(groups.selectable).toHaveLength(0);
    expect(groups.onLoan[0].on_loan_club_id).toBe('club-b');
    expect(groups.onLoan[0].loan_end_date).toBe('2027-06-30');
  });

  test('profile current club is the playing club while the parent contract stays the owner', () => {
    expect(getPlayingClubId({ id: 'player-1', club_id: 'club-a' }, [loan])).toBe('club-b');
    expect(getLoanForContract({ id: 'contract-1' }, [loan]).id).toBe('loan-1');
  });

  test('isLoanRecallable is true for an active loan with default recall terms', () => {
    expect(isLoanRecallable(loan, '2027-01-15')).toBe(true);
    expect(isLoanRecallable({ ...loan, recall_allowed: 0 }, '2027-01-15')).toBe(false);
    expect(isLoanRecallable({ ...loan, recall_after_date: '2027-03-01' }, '2027-01-15')).toBe(false);
    expect(isLoanRecallable({ ...loan, recall_after_date: '2027-03-01' }, '2027-03-01')).toBe(true);
  });

  test('early-end proposer is exposed for Request return and Accept return', () => {
    const pending = { ...loan, early_end_proposed_by_club_id: 'club-a' };
    expect(canProposeEarlyEnd(pending, 'club-a')).toBe(true);
    expect(canProposeEarlyEnd(pending, 'club-b')).toBe(false);
    expect(isEarlyEndWaitingOnClub(pending, 'club-b')).toBe(true);
    expect(isEarlyEndWaitingOnClub(pending, 'club-a')).toBe(false);
  });

  test('only the borrowing club can exercise an option before the deadline', () => {
    const optional = {
      status: 'ACTIVE',
      loan_club_id: 'club-b',
      parent_club_id: 'club-a',
      purchase_type: 'OPTIONAL',
      purchase_option_stc: 40000,
      purchase_option_deadline: '2027-06-01',
      end_date: '2027-06-30',
    };
    expect(canExercisePurchaseOption(optional, 'club-b', new Date('2027-03-01'))).toBe(true);
    expect(canExercisePurchaseOption(optional, 'club-a', new Date('2027-03-01'))).toBe(false);
    expect(canExercisePurchaseOption(optional, 'club-b', new Date('2027-06-02'))).toBe(false);
  });
});
