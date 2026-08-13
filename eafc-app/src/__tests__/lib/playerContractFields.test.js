import {
  canRenegotiateFounderPlayerContract,
  isFounderPlayerContract,
  isLifecycleOwnedContract,
} from '../../lib/playerContractFields';
import {
  FOUNDER_PLAYER_WEEKLY_SALARY_MAX,
  FOUNDER_PLAYER_WEEKLY_SALARY_MIN,
  isFounderPlayerWageAllowed,
} from '../../lib/founderPlayerTerms';

describe('mobile founder contract helpers', () => {
  it('treats founder_player as lifecycle-owned and renegotiable when active', () => {
    expect(isLifecycleOwnedContract('founder_player')).toBe(true);
    expect(isFounderPlayerContract({ contract_type: 'founder_player' })).toBe(true);
    expect(canRenegotiateFounderPlayerContract(
      { contract_type: 'founder_player', status: 'active' },
      { isMyContract: true },
    )).toBe(true);
  });

  it('does not let ownership or pending founder rows open a type picker renegotiation', () => {
    expect(canRenegotiateFounderPlayerContract(
      { contract_type: 'ownership', status: 'active' },
      { isMyContract: true },
    )).toBe(false);
    expect(canRenegotiateFounderPlayerContract(
      { contract_type: 'founder_player', status: 'pending' },
      { isMyContract: true },
    )).toBe(false);
    expect(canRenegotiateFounderPlayerContract(
      { contract_type: 'squad', status: 'active' },
      { isMyContract: true },
    )).toBe(false);
  });

  it('keeps founder player wages between 40k and 500k', () => {
    expect(FOUNDER_PLAYER_WEEKLY_SALARY_MIN).toBe(40000);
    expect(FOUNDER_PLAYER_WEEKLY_SALARY_MAX).toBe(500000);
    expect(isFounderPlayerWageAllowed(40000)).toBe(true);
    expect(isFounderPlayerWageAllowed(25000)).toBe(false);
    expect(isFounderPlayerWageAllowed(500001)).toBe(false);
  });
});
