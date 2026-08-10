/**
 * Stage heading font — matches web `EA Sports 15` (EASPORTS15.ttf).
 * ASCII-focused display face; keep headers uppercase Latin where possible.
 */

export const FONT_EA_SPORTS = 'EASports15';

export const headingStyle = {
  fontFamily: FONT_EA_SPORTS,
  fontSize: 20,
  fontWeight: '400',
  letterSpacing: 0.6,
  textTransform: 'uppercase',
};

export const headingStyleLg = {
  ...headingStyle,
  fontSize: 26,
  letterSpacing: 0.4,
};

export const headingStyleSm = {
  ...headingStyle,
  fontSize: 14,
  letterSpacing: 1.2,
};
