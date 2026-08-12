const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../../app/auth/onboarding.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

describe('mobile onboarding intent parity', () => {
  it('keeps Player and Player + President as the normal onboarding choices', () => {
    expect(source).toMatch(/>Player</);
    expect(source).toMatch(/>Player \+ President</);
  });

  it('does not expose a normal President-only onboarding path', () => {
    expect(source).not.toMatch(/setOnboardingIntent\('president'/);
    expect(source).not.toMatch(/setStep\('owner_club'\)/);
    expect(source).not.toMatch(/step === 'owner_club'/);
  });

  it('routes Player + President through player setup before club setup', () => {
    expect(source).toMatch(/setOnboardingIntent\('both',\s*'player'\)/);
    expect(source).toMatch(/intent === 'both'\)\s*setStep\('club'\)/);
  });
});
