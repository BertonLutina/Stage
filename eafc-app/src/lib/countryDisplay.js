import { COUNTRIES } from '@/lib/countries';

const COUNTRY_CODE_ALIASES = {
  BEL: 'BE',
  CAN: 'CA',
  COD: 'CD',
  COG: 'CG',
  DEU: 'DE',
  DRC: 'CD',
  ENG: 'ENG',
  ESP: 'ES',
  FRA: 'FR',
  GBR: 'GB',
  GER: 'DE',
  ITA: 'IT',
  NED: 'NL',
  NLD: 'NL',
  NIR: 'NIR',
  POR: 'PT',
  SCO: 'SCO',
  USA: 'US',
  WAL: 'WAL',
};

const DISPLAY_NAME_OVERRIDES = {
  CD: 'DR Congo',
  CG: 'Congo',
  CZ: 'Czechia',
  GB: 'United Kingdom',
  NL: 'Netherlands',
  KR: 'South Korea',
  KP: 'North Korea',
  US: 'United States',
  ENG: 'England',
  SCO: 'Scotland',
  WAL: 'Wales',
  NIR: 'Northern Ireland',
  CA: 'Canada',
};

const NAME_TO_CODE_HINTS = [
  [/canada/i, 'CA'],
  [/democratic republic of (the )?congo|dr congo|drc|congo kinshasa/i, 'CD'],
  [/england/i, 'ENG'],
  [/holland|netherlands|dutch/i, 'NL'],
  [/scotland/i, 'SCO'],
  [/united states|usa|america/i, 'US'],
  [/wales/i, 'WAL'],
];

const fifaCountryNames = new Map(
  COUNTRIES.map((country) => [
    String(country.code || '').toUpperCase(),
    String(country.name || '').replace(/^\p{Regional_Indicator}{2}\s*/u, '').trim(),
  ]),
);

export function normalizeCountryCode(code, country) {
  const raw = String(code || '').trim().toUpperCase();
  if (raw && (raw.length <= 3 || COUNTRY_CODE_ALIASES[raw])) return COUNTRY_CODE_ALIASES[raw] || raw;
  const name = String(country || code || '').trim();
  if (!name) return '';
  const withoutEmoji = name.replace(/^\p{Regional_Indicator}{2}\s*/u, '').trim();
  const listed = COUNTRIES.find((entry) => (
    String(entry.name || '').replace(/^\p{Regional_Indicator}{2}\s*/u, '').trim().toLowerCase() === withoutEmoji.toLowerCase()
  ));
  if (listed?.code) return listed.code;
  const hint = NAME_TO_CODE_HINTS.find(([pattern]) => pattern.test(withoutEmoji));
  return hint?.[1] || '';
}

export function getCountryDisplayName(code, country) {
  const normalized = normalizeCountryCode(code, country);
  if (DISPLAY_NAME_OVERRIDES[normalized]) return DISPLAY_NAME_OVERRIDES[normalized];
  const fromFifa = fifaCountryNames.get(normalized);
  if (fromFifa) return fromFifa;
  const raw = String(country || code || '').replace(/^\p{Regional_Indicator}{2}\s*/u, '').trim();
  return raw || 'Unknown';
}

export function getPlayerNationality(player) {
  const code = normalizeCountryCode(player?.country_code, player?.country);
  return {
    code,
    label: getCountryDisplayName(code || player?.country_code, player?.country),
  };
}

export const COUNTRY_FLAG_PALETTES = {
  CA: ['#d52b1e', '#f7f7f7', '#d52b1e'],
  CD: ['#19a7e0', '#f5d547', '#d72638'],
  DE: ['#050505', '#dd0000', '#ffce00'],
  ENG: ['#f7f7f7', '#c8102e', '#f7f7f7'],
  ES: ['#aa151b', '#f1bf00', '#aa151b'],
  FR: ['#123c8c', '#f7f7f7', '#d72638'],
  NL: ['#ae1c28', '#f7f7f7', '#21468b'],
  US: ['#3c3b6e', '#f7f7f7', '#b22234'],
  GB: ['#f7f7f7', '#c8102e', '#012169'],
  SCO: ['#005eb8', '#ffffff', '#005eb8'],
  WAL: ['#ffffff', '#00a650', '#c8102e'],
  NIR: ['#ffffff', '#c8102e', '#ffffff'],
  BE: ['#050505', '#f5d547', '#d72638'],
  BR: ['#009b3a', '#ffdf00', '#002776'],
};

export function getCountryFlagColors(code) {
  const normalized = normalizeCountryCode(code);
  return COUNTRY_FLAG_PALETTES[normalized] || ['rgba(0,229,255,0.18)', 'rgba(255,255,255,0.08)', 'rgba(245,197,66,0.12)'];
}
