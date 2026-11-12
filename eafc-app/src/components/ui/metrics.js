/** Stage UI sizes shared by the ui/ primitives (px). Colours live in tokens, not here. */
export const SCREEN_GUTTER = 20;
export const CARD_PADDING = 16;
export const BUTTON_HEIGHT = 52;
export const BUTTON_RADIUS = 14;
/** Chamfer on primary CTA (mockup clip-path 12px top-left / bottom-right). */
export const BUTTON_CUT = 12;
export const ICON_BUTTON_SIZE = 44;
export const ICON_BUTTON_RADIUS = 12;
export const CHIP_HEIGHT = 34;
export const CHIP_RADIUS = 999;
export const AVATAR_SIZE = 44;
export const AVATAR_RADIUS = 12;
export const ICON_SIZE = 22;
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_BOTTOM = 24;
export const TAB_BAR_CLEARANCE = 16;
export const MIN_TOUCH = 44;
export const INPUT_HEIGHT = 50;
export const INPUT_RADIUS = 12;

/**
 * Bottom offset of the global Guide button (PageWalkthrough): it floats just above the floating tab bar.
 * Single source of truth, shared with guideFabClearance so the two cannot drift.
 */
export function guideFabBottom(insetBottom = 0) {
  return Math.max(insetBottom, TAB_BAR_BOTTOM) + TAB_BAR_HEIGHT + TAB_BAR_CLEARANCE;
}

/** Scroll bottom padding that keeps content clear of the Guide button: its bottom + its height + 16 breathing room. */
export function guideFabClearance(insetBottom = 0) {
  return guideFabBottom(insetBottom) + MIN_TOUCH + 16;
}

/** Guide button offset on stack screens that have no tab bar (/apps/*): it sits at the bottom safe edge. */
export function guideFabBottomStack(insetBottom = 0) {
  return Math.max(insetBottom, TAB_BAR_BOTTOM);
}

/** Scroll bottom padding that keeps stack-screen content clear of the Guide button. */
export function guideFabClearanceStack(insetBottom = 0) {
  return guideFabBottomStack(insetBottom) + MIN_TOUCH + 16;
}
