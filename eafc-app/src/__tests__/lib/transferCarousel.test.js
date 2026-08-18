import { stepCarouselIndex, visibleCarouselSlots, wrapIndex } from '../../lib/transferCarousel';

describe('transfer carousel', () => {
  test('carousel index wraps in both directions', () => {
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(5, 5)).toBe(0);
    expect(stepCarouselIndex(0, 4, -1)).toBe(3);
    expect(stepCarouselIndex(3, 4, 1)).toBe(0);
  });

  test('carousel window keeps the focused card in the center', () => {
    expect(visibleCarouselSlots(1, 0)).toEqual([{ index: 0, offset: 0 }]);
    expect(visibleCarouselSlots(5, 2)).toEqual([
      { index: 0, offset: -2 },
      { index: 1, offset: -1 },
      { index: 2, offset: 0 },
      { index: 3, offset: 1 },
      { index: 4, offset: 2 },
    ]);
  });
});
