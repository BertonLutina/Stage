import {
  canRenegotiateFounderPlayerContract,
  isFounderPlayerContract,
  isLifecycleOwnedContract,
} from '../../lib/playerContractFields';

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
});
