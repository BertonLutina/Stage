/**
 * Android 3-button / gesture nav height varies by device. Use the system
 * inset when it exists, and never go below 30 so content clears the bar.
 */
export const PAGE_BOTTOM_PAD = 30;

export function pageBottomPad(insetsBottom = 0) {
  return Math.max(Number(insetsBottom) || 0, PAGE_BOTTOM_PAD);
}
