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
    expect(source).toMatch(/intent === 'both'\)\s*setStep\('founder_terms'\)/);
    expect(source).toMatch(/FounderPlayerTermsSetup/);
    expect(source).toMatch(/playerContract=\{founderPlayerTerms\}/);
    expect(source).toMatch(/<PresidentContractSetup[\s\S]*playerContract=\{founderPlayerTerms\}/);
  });

  it('keeps the tutorial as a centered modal, not a bottom sheet', () => {
    const tutorial = fs.readFileSync(
      path.join(__dirname, '../../components/onboarding/TutorialPopup.jsx'),
      'utf8',
    );
    expect(tutorial).toMatch(/animationType="fade"/);
    expect(tutorial).toMatch(/justifyContent: 'center'/);
    expect(tutorial).toMatch(/Your path/);
    expect(tutorial).not.toMatch(/justifyContent: 'flex-end'/);
  });

  it('does not skip onboarding just because an OAuth stub already has a gamertag', () => {
    expect(source).toMatch(/isFinishedOnboardingProfile/);
    expect(source).not.toMatch(/pl\?\.country \|\| pl\?\.gamertag/);
    expect(source).not.toMatch(/u\?\.player_id \|\| pl\?\.id\) && !force && \(pl\?\.country \|\| pl\?\.gamertag\)/);
  });

  it('uses a phone-first shell instead of a centered web card', () => {
    expect(source).toMatch(/StepDots/);
    expect(source).toMatch(/KeyboardAvoidingView/);
    expect(source).not.toMatch(/maxWidth:\s*440/);
    expect(source).not.toMatch(/How do you play\?/);
  });
});
