import { PAGE_GUIDE_STEPS_EN } from '../../lib/pageWalkthroughCopy';
import { getPageWalkthrough } from '../../lib/pageWalkthroughs';
import { getTutorialSteps } from '../../lib/tutorialSteps';

describe('page walkthroughs', () => {
  test('every English guide is a full path, not three lines', () => {
    const keys = Object.keys(PAGE_GUIDE_STEPS_EN);
    expect(keys.length).toBeGreaterThan(20);
    for (const key of keys) {
      expect(PAGE_GUIDE_STEPS_EN[key].length).toBeGreaterThanOrEqual(6);
    }
  });

  test('maps mobile routes to the matching guide', () => {
    expect(getPageWalkthrough('/apps/inbox', 'en').key).toBe('inbox');
    expect(getPageWalkthrough('/apps/competitions', 'en').key).toBe('compete');
    expect(getPageWalkthrough('/matches', 'en').key).toBe('matches');
    expect(getPageWalkthrough('/profile', 'en').key).toBe('profile');
    expect(getPageWalkthrough('/apps/settings', 'en')).toBeNull();
    expect(getPageWalkthrough('/auth/onboarding', 'en')).toBeNull();
  });

  test('guide chrome uses Stage tokens and primitives, not Game Day silver tiles or cyan pills', () => {
    const src = require('fs').readFileSync(
      require('path').resolve(__dirname, '../../components/onboarding/PageWalkthrough.jsx'),
      'utf8',
    );
    expect(src).toMatch(/useThemeStore/);
    expect(src).toMatch(/tokens\.card\b/);
    expect(src).toMatch(/tokens\.border\b/);
    expect(src).toMatch(/tokens\.cardRadius/);
    expect(src).toMatch(/<IconButton[^>]*accessibilityLabel="Close guide"/);
    expect(src).not.toMatch(/GAME_DAY_SILVER|TILE_BORDER|TILE_FILL/);
    expect(src).not.toMatch(/borderRadius: 999/);
    expect(src).not.toMatch(/backgroundColor: CYAN/);
    expect(src).not.toMatch(/#[0-9A-Fa-f]{6}\b/);
  });

  test('inbox path tells the user where to accept contracts and loans', () => {
    const guide = getPageWalkthrough('/apps/inbox', 'en');
    const blob = guide.steps.join(' ');
    expect(blob).toMatch(/Inbox/);
    expect(blob).toMatch(/Loan/i);
    expect(blob).toMatch(/Contract/i);
  });
});

describe('onboarding tutorial paths', () => {
  test('player, president and both tutorials have enough slides to find a path', () => {
    for (const intent of ['player', 'president', 'both']) {
      const steps = getTutorialSteps(intent);
      expect(steps.length).toBeGreaterThanOrEqual(7);
      for (const step of steps) {
        expect(step.points.length).toBeGreaterThanOrEqual(6);
        expect(step.where).toBeTruthy();
      }
    }
  });
});
