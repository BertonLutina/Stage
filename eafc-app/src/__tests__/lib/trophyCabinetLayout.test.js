import {
  CABINET_ASPECT_RATIO,
  normalizePlacementCoords,
  trophyPixelSize,
} from '../../lib/trophyCabinetLayout';

describe('trophyCabinetLayout', () => {
  test('normalizes coordinates to server decimal precision', () => {
    expect(normalizePlacementCoords({
      x_percent: 12.3456,
      y_percent: 88.999,
      scale: 1.23456,
    })).toEqual({ x_percent: 12.35, y_percent: 89, scale: 1.235 });
  });

  test('trophy size grows with cabinet width for phone, tablet and large displays', () => {
    const phone = trophyPixelSize(320, 1);
    const tablet = trophyPixelSize(768, 1);
    const large = trophyPixelSize(1600, 1);
    expect(tablet).toBeGreaterThan(phone);
    expect(large).toBeGreaterThan(tablet);
    expect(trophyPixelSize(1000, 2)).toBe(trophyPixelSize(1000, 1) * 2);
  });

  test('cabinet aspect ratio stays stable for responsive height', () => {
    expect(CABINET_ASPECT_RATIO).toBeCloseTo(1017 / 674, 5);
  });
});
