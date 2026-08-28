import {
  displayNamedFounder,
  FOUNDER_CONTRACT_LABEL,
  FOUNDER_PLAYER_CONTRACT_LABEL,
  isNamedFounder,
} from '../../lib/founderDisplay';

describe('named founder display', () => {
  it('writes Player everywhere except the contract document', () => {
    expect(isNamedFounder('founder')).toBe(true);
    expect(isNamedFounder('founder_player')).toBe(true);
    expect(isNamedFounder('president')).toBe(false);
    expect(displayNamedFounder()).toBe('Player');
    expect(displayNamedFounder({ forContract: true })).toBe(FOUNDER_CONTRACT_LABEL);
    expect(displayNamedFounder({ forContract: true, type: 'founder_player' })).toBe(FOUNDER_PLAYER_CONTRACT_LABEL);
  });
});
