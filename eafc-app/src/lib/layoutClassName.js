/**
 * Keeps only the classes that position a component in its parent (margin, width, flex, self-*).
 * Padding, radius, colour, border and text classes describe the old look, so they are dropped
 * before a legacy `className` reaches a wrapper around a ui/ primitive.
 */
const LAYOUT_CLASS = /^-?(m[trblxyse]?-\S+|w-\S+|flex|flex-\S+|grow|grow-\S+|shrink|shrink-\S+|self-\S+)$/;

export function layoutClassName(className = '') {
  return String(className || '')
    .split(/\s+/)
    .filter((c) => c && LAYOUT_CLASS.test(c))
    .join(' ');
}
