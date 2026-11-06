import { stageClient } from '../api/stageClient';
import { loadClubProfile } from '../lib/clubProfileData';
import useAsyncResource from './useAsyncResource';

export function buildTeamView(bundle = {}) {
  const club = bundle?.club || null;
  const created = club?.founded_at || club?.created_date || club?.created_at;
  const year = created ? new Date(created).getFullYear() : null;
  return {
    bundle,
    club,
    name: club?.name || club?.club_name || null,
    tag: club?.tag || club?.handle || null,
    platform: club?.platform || null,
    region: club?.region || club?.country || null,
    foundedYear: Number.isFinite(year) ? year : null,
    players: Array.isArray(bundle?.players) ? bundle.players : [],
    playerCount: Array.isArray(bundle?.players) ? bundle.players.length : null,
    trophyCount: Array.isArray(bundle?.trophies) ? bundle.trophies.length : null,
    wins: Number(bundle?.record?.totalGames) > 0 ? Number(bundle?.record?.wins) : null,
  };
}

export default function useTeam(teamId) {
  return useAsyncResource(
    async () => buildTeamView(await loadClubProfile(String(teamId), stageClient)),
    [teamId],
    { initialData: null, immediate: Boolean(teamId) },
  );
}
