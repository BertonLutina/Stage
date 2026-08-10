/**
 * Club Office formations — portrait pitch (attack ↑).
 * Each slot: leftPct / topPct (0–100) relative to the pitch card.
 * Tweak these values to adjust spacing without touching the card UI.
 */

function slots(list) {
  return list.map((row, i) => ({
    slot: i,
    label: row[0],
    leftPct: row[1],
    topPct: row[2],
  }));
}

/** Shared back fours / threes / fives for consistency */
const BACK4 = [
  ['LB', 14, 70],
  ['CB', 38, 72],
  ['CB', 62, 72],
  ['RB', 86, 70],
];

const BACK3 = [
  ['CB', 22, 71],
  ['CB', 50, 73],
  ['CB', 78, 71],
];

const BACK5 = [
  ['LWB', 10, 66],
  ['CB', 30, 72],
  ['CB', 50, 74],
  ['CB', 70, 72],
  ['RWB', 90, 66],
];

const GK = ['GK', 50, 88];

export const CLUB_FORMATIONS = {
  '4-3-3': slots([
    GK,
    ...BACK4,
    ['LCM', 22, 48],
    ['CM', 50, 52],
    ['RCM', 78, 48],
    ['LW', 16, 22],
    ['ST', 50, 14],
    ['RW', 84, 22],
  ]),

  '4-4-2': slots([
    GK,
    ...BACK4,
    ['LM', 12, 46],
    ['LCM', 36, 50],
    ['RCM', 64, 50],
    ['RM', 88, 46],
    ['LST', 36, 16],
    ['RST', 64, 16],
  ]),

  '4-2-3-1': slots([
    GK,
    ...BACK4,
    ['CDM', 36, 58],
    ['CDM', 64, 58],
    ['LW', 14, 30],
    ['CAM', 50, 34],
    ['RW', 86, 30],
    ['ST', 50, 12],
  ]),

  '4-3-2-1': slots([
    GK,
    ...BACK4,
    ['LCM', 24, 52],
    ['CM', 50, 56],
    ['RCM', 76, 52],
    ['LF', 34, 28],
    ['RF', 66, 28],
    ['ST', 50, 12],
  ]),

  '4-1-2-1-2': slots([
    GK,
    ...BACK4,
    ['CDM', 50, 60],
    ['LM', 20, 42],
    ['RM', 80, 42],
    ['CAM', 50, 32],
    ['LST', 36, 14],
    ['RST', 64, 14],
  ]),

  '4-1-4-1': slots([
    GK,
    ...BACK4,
    ['CDM', 50, 60],
    ['LM', 12, 40],
    ['LCM', 36, 44],
    ['RCM', 64, 44],
    ['RM', 88, 40],
    ['ST', 50, 14],
  ]),

  '4-5-1': slots([
    GK,
    ...BACK4,
    ['LM', 10, 40],
    ['LCM', 30, 48],
    ['CM', 50, 52],
    ['RCM', 70, 48],
    ['RM', 90, 40],
    ['ST', 50, 14],
  ]),

  '4-4-2 Diamond': slots([
    GK,
    ...BACK4,
    ['CDM', 50, 60],
    ['LM', 18, 42],
    ['RM', 82, 42],
    ['CAM', 50, 30],
    ['LST', 36, 14],
    ['RST', 64, 14],
  ]),

  '3-5-2': slots([
    GK,
    ...BACK3,
    ['LWB', 8, 48],
    ['LCM', 32, 50],
    ['CM', 50, 54],
    ['RCM', 68, 50],
    ['RWB', 92, 48],
    ['LST', 36, 16],
    ['RST', 64, 16],
  ]),

  '3-4-3': slots([
    GK,
    ...BACK3,
    ['LM', 12, 46],
    ['LCM', 38, 50],
    ['RCM', 62, 50],
    ['RM', 88, 46],
    ['LW', 16, 20],
    ['ST', 50, 12],
    ['RW', 84, 20],
  ]),

  '3-4-2-1': slots([
    GK,
    ...BACK3,
    ['LWB', 10, 48],
    ['LCM', 38, 52],
    ['RCM', 62, 52],
    ['RWB', 90, 48],
    ['LF', 34, 28],
    ['RF', 66, 28],
    ['ST', 50, 12],
  ]),

  '5-3-2': slots([
    GK,
    ...BACK5,
    ['LCM', 28, 44],
    ['CM', 50, 48],
    ['RCM', 72, 44],
    ['LST', 36, 16],
    ['RST', 64, 16],
  ]),

  '5-4-1': slots([
    GK,
    ...BACK5,
    ['LM', 12, 40],
    ['LCM', 36, 46],
    ['RCM', 64, 46],
    ['RM', 88, 40],
    ['ST', 50, 14],
  ]),

  '5-2-1-2': slots([
    GK,
    ...BACK5,
    ['LCM', 34, 48],
    ['RCM', 66, 48],
    ['CAM', 50, 30],
    ['LST', 36, 14],
    ['RST', 64, 14],
  ]),

  '5-2-3': slots([
    GK,
    ...BACK5,
    ['LCM', 34, 48],
    ['RCM', 66, 48],
    ['LW', 16, 20],
    ['ST', 50, 12],
    ['RW', 84, 20],
  ]),

  '4-2-2-2': slots([
    GK,
    ...BACK4,
    ['CDM', 36, 58],
    ['CDM', 64, 58],
    ['LAM', 28, 34],
    ['RAM', 72, 34],
    ['LST', 36, 14],
    ['RST', 64, 14],
  ]),

  '4-3-1-2': slots([
    GK,
    ...BACK4,
    ['LCM', 24, 52],
    ['CM', 50, 56],
    ['RCM', 76, 52],
    ['CAM', 50, 32],
    ['LST', 36, 14],
    ['RST', 64, 14],
  ]),
};

export const FORMATION_OPTIONS = Object.keys(CLUB_FORMATIONS);

export function getFormationSlots(name) {
  return CLUB_FORMATIONS[name] || CLUB_FORMATIONS['4-3-3'];
}

/** Keep players on matching role labels when switching shape; drop unmatched. */
export function remapLineupToFormation(lineup, fromFormation, toFormation) {
  const fromSlots = getFormationSlots(fromFormation);
  const nextSlots = getFormationSlots(toFormation);
  const byLabel = {};
  (lineup || []).forEach((entry) => {
    const label = entry.label || fromSlots.find((s) => s.slot === entry.slot)?.label;
    if (label && !byLabel[label]) byLabel[label] = entry;
  });

  const used = new Set();
  const remapped = [];
  nextSlots.forEach((slot) => {
    const match = byLabel[slot.label];
    if (match && !used.has(match.player_id)) {
      used.add(match.player_id);
      remapped.push({
        slot: slot.slot,
        player_id: match.player_id,
        gamertag: match.gamertag,
        position: match.position,
        label: slot.label,
      });
    }
  });
  return remapped;
}

export function slotMatchesPosition(slotLabel, playerPos) {
  const s = String(slotLabel || '').toUpperCase();
  const p = String(playerPos || '').toUpperCase();
  if (!p) return false;
  if (s === p) return true;
  const core = s.replace(/^[LR]/, '').replace(/AM$/, 'AM');
  if (p === core || s.includes(p)) return true;
  const aliases = {
    GK: ['GK'],
    CB: ['CB'],
    LB: ['LB', 'LWB'],
    RB: ['RB', 'RWB'],
    LWB: ['LWB', 'LB', 'LM'],
    RWB: ['RWB', 'RB', 'RM'],
    CDM: ['CDM', 'CM'],
    CM: ['CM', 'CDM', 'CAM'],
    LCM: ['CM', 'CDM', 'CAM', 'LM'],
    RCM: ['CM', 'CDM', 'CAM', 'RM'],
    CAM: ['CAM', 'CM', 'CF'],
    LAM: ['CAM', 'LM', 'LW', 'CM'],
    RAM: ['CAM', 'RM', 'RW', 'CM'],
    LM: ['LM', 'LW', 'CM', 'LWB'],
    RM: ['RM', 'RW', 'CM', 'RWB'],
    LW: ['LW', 'LM', 'ST'],
    RW: ['RW', 'RM', 'ST'],
    ST: ['ST', 'CF'],
    LST: ['ST', 'CF', 'LW'],
    RST: ['ST', 'CF', 'RW'],
    LF: ['ST', 'CF', 'LW', 'CAM'],
    RF: ['ST', 'CF', 'RW', 'CAM'],
  };
  return (aliases[s] || []).includes(p);
}

export function autoFillLineup(formationName, players = []) {
  const formationSlots = getFormationSlots(formationName);
  const pool = [...players];
  const lineup = [];
  formationSlots.forEach((slot) => {
    const idx = pool.findIndex((p) => slotMatchesPosition(slot.label, p.position));
    const pick = idx >= 0 ? pool.splice(idx, 1)[0] : pool.shift();
    if (!pick) return;
    const pid = pick.id || pick.user_id;
    if (!pid) return;
    lineup.push({
      slot: slot.slot,
      player_id: pid,
      gamertag: pick.gamertag || pick.gamer_tag,
      position: pick.position,
      label: slot.label,
    });
  });
  return lineup;
}
