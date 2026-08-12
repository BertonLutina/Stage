const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../../components/onboarding/ClubSetup.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

describe('mobile ClubSetup founder parity', () => {
  it('uses backend-owned founder lifecycle instead of generic Club.create', () => {
    expect(source).toMatch(/stageClient\.clubs\.createFounder/);
    expect(source).not.toMatch(/stageClient\.entities\.Club\.create/);
    expect(source).not.toMatch(/contractManagement/);
  });

  it('requires a player id for Player + President founder club creation', () => {
    expect(source).toMatch(/player\?\.id/);
    expect(source).toMatch(/Player profile is required before creating a founder club/);
  });

  it('passes normalized founder payload fields to the backend', () => {
    expect(source).toMatch(/player_id:\s*player\.id/);
    expect(source).toMatch(/club:\s*{/);
    expect(source).toMatch(/name:\s*name\.trim\(\)/);
    expect(source).toMatch(/tag:\s*tag\.trim\(\)\.toUpperCase\(\)\.slice\(0,\s*5\)/);
  });

  it('returns full founder state to onboarding completion', () => {
    expect(source).toMatch(/onComplete\?\.\(founderState\)/);
    expect(source).toMatch(/founderState\?\.club\?\.id/);
  });
});
