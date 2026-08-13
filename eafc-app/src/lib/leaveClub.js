import { stageClient } from '@/api/stageClient';
import { writeAccountIntent } from '@/lib/accountIntent';
import { localStorage } from '@/lib/polyfillStorage';

const PRESIDENT_SESSION_KEYS = [
  'stage_president_club_id',
  'stage_president_id',
  'stage_owner_id',
];

export function clearPresidentSessionKeys() {
  try {
    PRESIDENT_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

export async function leaveStageClub({ clubId, playerId, userId }) {
  if (!clubId) throw new Error('club_id is required');
  if (!playerId) throw new Error('player_id is required');
  const result = await stageClient.clubs.leave(clubId, { player_id: playerId });
  writeAccountIntent('player', userId);
  clearPresidentSessionKeys();
  return result;
}
