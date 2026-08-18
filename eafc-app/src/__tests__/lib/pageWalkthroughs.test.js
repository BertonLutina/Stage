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
    expect(getPageWalkthrough('/apps/news', 'en').key).toBe('news');
    expect(getPageWalkthrough('/matches', 'en').key).toBe('matches');
    expect(getPageWalkthrough('/profile', 'en').key).toBe('profile');
    expect(getPageWalkthrough('/apps/settings', 'en')).toBeNull();
    expect(getPageWalkthrough('/auth/onboarding', 'en')).toBeNull();
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
