const fs = require('fs');
const path = require('path');
import { goBackInPlace, goBackOr } from '../../lib/navigationBack';

function read(rel) {
  return fs.readFileSync(path.join(__dirname, rel), 'utf8');
}

describe('back stays on the current flow', () => {
  test('root layout stacks screens on top of tabs instead of replacing them', () => {
    const source = read('../../app/_layout.jsx');
    expect(source).toMatch(/<Stack\b/);
    expect(source).not.toMatch(/<Slot\s*\/>/);
  });

  test('tab navigators pop history instead of jumping to the Home tab', () => {
    const source = read('../../app/(tabs)/_layout.jsx');
    expect(source).toMatch(/backBehavior=["']history["']/);
    expect(source).not.toMatch(/backBehavior=["']initialRoute["']/);
    expect(source).not.toMatch(/backBehavior=["']firstRoute["']/);
  });

  test('goBackInPlace pops one screen and never falls back to Home', () => {
    const back = jest.fn();
    const replace = jest.fn();
    const router = { canGoBack: () => true, back, replace };

    expect(goBackInPlace(router)).toBe('back');
    expect(back).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  test('goBackInPlace stays put when there is no history', () => {
    const back = jest.fn();
    const replace = jest.fn();
    const router = { canGoBack: () => false, back, replace };

    expect(goBackInPlace(router)).toBe('stay');
    expect(back).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  test('goBackOr pops when there is history', () => {
    const router = { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn() };
    expect(goBackOr(router, '/apps')).toBe('back');
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  test('goBackOr replaces with the fallback when there is no history', () => {
    const router = { canGoBack: jest.fn(() => false), back: jest.fn(), replace: jest.fn() };
    expect(goBackOr(router, '/apps')).toBe('replaced');
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/apps');
  });

  test('goBackOr tolerates a router without canGoBack or replace', () => {
    expect(goBackOr({}, '/apps')).toBe('replaced');
    expect(goBackOr(undefined, '/apps')).toBe('replaced');
  });
});
