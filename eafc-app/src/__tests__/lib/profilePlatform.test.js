import { formatProfilePlatform } from '../../lib/profilePlatform';

describe('formatProfilePlatform', () => {
  test('normalizes console families for display', () => {
    expect(formatProfilePlatform('PlayStation')).toBe('PS5');
    expect(formatProfilePlatform('ps4')).toBe('PS4');
    expect(formatProfilePlatform('Xbox Series X')).toBe('Xbox');
    expect(formatProfilePlatform('PC')).toBe('PC');
    expect(formatProfilePlatform('')).toBe('—');
  });
});
