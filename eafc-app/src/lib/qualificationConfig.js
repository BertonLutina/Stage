export const REGIONS = [
  { slug: 'uk-ireland', name: 'UK & Ireland', countryCode: 'GB', region: 'Europe' },
  { slug: 'france', name: 'France', countryCode: 'FR', region: 'Europe' },
  { slug: 'germany', name: 'Germany', countryCode: 'DE', region: 'Europe' },
  { slug: 'benelux', name: 'Benelux', countryCode: 'BE', region: 'Europe' },
  { slug: 'spain', name: 'Spain', countryCode: 'ES', region: 'Europe' },
  { slug: 'north-america', name: 'North America', countryCode: 'US', region: 'North America' },
];

/** Division 1 final standings → official STAGE tournament qualification. */
export const STAGE_QUALIFICATION_RULES = [
  { positions: [1, 2, 3, 4, 5, 6], competitionSlug: 'supreme', competitionName: 'STAGE Supreme League' },
  { positions: [7, 8, 9, 10, 11, 12], competitionSlug: 'elite', competitionName: 'STAGE Elite League' },
  { positions: [13, 14, 15, 16, 17, 18], competitionSlug: 'challenger', competitionName: 'STAGE Challenger League' },
];

export const REGIONAL_LEAGUE_MAX_CLUBS = 20;
export const OFFICIAL_STAGE_TOURNAMENT_MAX_CLUBS = 36;
export const RELEGATION_SPOTS = 2;
export const PROMOTION_SPOTS = 2;

export const CROSS_COMPETITION_QUALIFICATION_RULES = [
  { fromSlug: 'elite', toSlug: 'supreme', toName: 'STAGE Supreme League', positions: [1] },
  { fromSlug: 'challenger', toSlug: 'elite', toName: 'STAGE Elite League', positions: [1] },
];
