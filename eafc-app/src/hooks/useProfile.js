import { resolveMyPlayerAndClub, stageClient } from '../api/stageClient';
import useAsyncResource from './useAsyncResource';

function numberOrNull(value) {
  return value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
}

export function buildProfileView({ user = null, player = null, club = null, career = null } = {}) {
  const clubCareer = career?.club_career || {};
  return {
    user,
    player,
    club,
    career,
    displayName: player?.gamertag || user?.gamer_tag || user?.gamertag || null,
    overall: numberOrNull(player?.overall_rating),
    stats: {
      games: numberOrNull(clubCareer.games),
      goals: numberOrNull(clubCareer.goals),
      assists: numberOrNull(clubCareer.assists),
      rating: numberOrNull(clubCareer.avg_rating),
    },
  };
}

export async function loadOwnProfile() {
  const identity = await resolveMyPlayerAndClub();
  const career = identity?.player?.id
    ? await stageClient.http.get(`/player-careers/${identity.player.id}`).catch(() => null)
    : null;
  return buildProfileView({ ...identity, career });
}

export default function useProfile(enabled = true) {
  return useAsyncResource(loadOwnProfile, [enabled], { initialData: null, immediate: enabled });
}
