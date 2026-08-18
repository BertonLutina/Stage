import { isFinishedOnboardingProfile } from '../../lib/onboardingGate';

describe('onboardingGate', () => {
  it('does not treat an OAuth stub gamertag as a finished profile', () => {
    expect(isFinishedOnboardingProfile({ gamertag: 'Alex', oauth_provider: 'google' })).toBe(false);
    expect(isFinishedOnboardingProfile({ id: 'p-1', gamertag: 'Alex' })).toBe(false);
    expect(isFinishedOnboardingProfile(null)).toBe(false);
  });

  it('treats a country as a finished onboarding profile', () => {
    expect(isFinishedOnboardingProfile({ gamertag: 'Alex', country: 'Belgium' })).toBe(true);
  });
});
