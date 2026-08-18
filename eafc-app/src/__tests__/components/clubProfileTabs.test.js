import { readFileSync } from 'fs';
import { resolve } from 'path';

const source = readFileSync(resolve(__dirname, '../../app/(tabs)/profile/clubProfileTabs.jsx'), 'utf8');
const profile = readFileSync(resolve(__dirname, '../../app/(tabs)/profile/profilescreen.jsx'), 'utf8');

describe('club and player parity with Stage web (Aug 15–17)', () => {
  test('Office tab is owner-only, not staff/operations', () => {
    expect(source).toMatch(/if \(item\.id === 'office'\) return isOwner;/);
    expect(source).not.toMatch(/if \(item\.id === 'office'\) return isOwner \|\| canOpenOperations;/);
  });

  test('squad gamecards open profile, contract, release, role, and loan actions', () => {
    expect(source).toMatch(/applyLoanAnnotations/);
    expect(source).toMatch(/splitSquadByLoan/);
    expect(source).toMatch(/View profile/);
    expect(source).toMatch(/View contract/);
    expect(source).toMatch(/Release player/);
    expect(source).toMatch(/Remove role/);
    expect(source).toMatch(/Recall/);
    expect(source).toMatch(/Request return/);
    expect(source).toMatch(/ON LOAN/);
  });

  test('player profile can request a loan from another club', () => {
    expect(profile).toMatch(/canShowLoanRequestButton/);
    expect(profile).toMatch(/RequestLoanDialog/);
    expect(profile).toMatch(/Request loan/);
  });
});
