import {
  formatPlatformLabel,
  matchesPlatformFilter,
  normalizeConsoleChoice,
  platformFamily,
} from '../../lib/platformDisplay';
import { countryCodeToFlagEmoji } from '../../lib/countryDisplay';

describe('platformDisplay', () => {
  test('maps PlayStation family values to a specific console', () => {
    expect(formatPlatformLabel('PlayStation')).toBe('PS5');
    expect(formatPlatformLabel('PS')).toBe('PS5');
    expect(formatPlatformLabel('ps4')).toBe('PS4');
    expect(formatPlatformLabel('Xbox')).toBe('Xbox Series');
    expect(formatPlatformLabel('Xbox One')).toBe('Xbox One');
    expect(normalizeConsoleChoice('PlayStation')).toBe('PS5');
  });

  test('keeps family filters while matching exact consoles', () => {
    expect(platformFamily('PS5')).toBe('PlayStation');
    expect(matchesPlatformFilter('PS5', 'PlayStation')).toBe(true);
    expect(matchesPlatformFilter('PS4', 'PlayStation')).toBe(true);
    expect(matchesPlatformFilter('PS4', 'PS5')).toBe(false);
    expect(matchesPlatformFilter('PC', 'PlayStation')).toBe(false);
  });
});

describe('country flags', () => {
  test('returns a flag emoji for ISO and home-nation codes', () => {
    expect(countryCodeToFlagEmoji('BE')).toBe('🇧🇪');
    expect(countryCodeToFlagEmoji('CD')).toBe('🇨🇩');
    expect(countryCodeToFlagEmoji('ENG')).toBeTruthy();
  });
});
