import { getPrimaryClubRole } from '../../lib/clubStaffRoles';

describe('getPrimaryClubRole', () => {
  test('treats a missing player as a member instead of crashing', () => {
    expect(getPrimaryClubRole()).toBe('member');
    expect(getPrimaryClubRole(null)).toBe('member');
    expect(getPrimaryClubRole(undefined)).toBe('member');
  });

  test('prefers president over other staff roles', () => {
    expect(getPrimaryClubRole({ role: 'captain', club_roles: ['president'] })).toBe('president');
  });
});
