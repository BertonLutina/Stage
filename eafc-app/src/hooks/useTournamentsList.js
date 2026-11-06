import { useCallback, useMemo } from 'react';
import { resolveMyPlayerAndClub, stageClient } from '../api/stageClient';
import { canCreateCommunityTournament } from '../lib/communityTournamentCreate';
import useAsyncResource from './useAsyncResource';

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sameId(left, right) {
  return left != null && right != null && String(left) === String(right);
}

function containsParticipant(rows, id) {
  return id != null && parseList(rows).some((row) => sameId(row?.id ?? row, id));
}

function isFuture(date) {
  if (!date) return false;
  return new Date(date) > new Date();
}

function isPastOrNow(date) {
  if (!date) return true;
  return new Date(date) <= new Date();
}

export function bucketTournaments(rows, identity = {}) {
  const tournaments = (Array.isArray(rows) ? rows : []).filter(
    (tournament) => !['cancelled', 'archived'].includes(String(tournament?.status || '').toLowerCase()),
  );
  const user = identity?.user || null;
  const player = identity?.player || null;
  const clubs = [identity?.club, identity?.presidentClub].filter(Boolean);
  const belongsToMe = (tournament) => {
    const ownerMatches = [
      tournament?.created_by,
      tournament?.creator_email,
      tournament?.owner_email,
      tournament?.user_id,
    ].some((value) => sameId(value, user?.email) || sameId(value, user?.id));
    return ownerMatches
      || containsParticipant(tournament?.registered_players, player?.id)
      || clubs.some((club) => containsParticipant(tournament?.registered_clubs, club?.id));
  };

  return {
    tournaments,
    open: tournaments.filter((tournament) =>
      tournament?.status === 'registration'
      || (tournament?.status === 'in_progress' && tournament?.start_date && isFuture(tournament.start_date))),
    my: tournaments.filter(belongsToMe),
    finished: tournaments.filter((tournament) => tournament?.status === 'completed'),
  };
}

async function loadTournamentsList() {
  const [rows, trophies, identity] = await Promise.all([
    stageClient.entities.Tournament.list('-created_date', 100),
    stageClient.entities.TrophyItem
      ? stageClient.entities.TrophyItem.list('sort_order', 50).catch(() => [])
      : Promise.resolve([]),
    resolveMyPlayerAndClub().catch(() => ({})),
  ]);
  return {
    rows: Array.isArray(rows) ? rows : [],
    trophyItems: Array.isArray(trophies) ? trophies : [],
    identity: identity || {},
  };
}

const INITIAL_DATA = { rows: [], trophyItems: [], identity: {} };

export default function useTournamentsList() {
  const fetcher = useCallback(() => loadTournamentsList(), []);
  const resource = useAsyncResource(fetcher, [], { initialData: INITIAL_DATA });
  const source = resource.data || INITIAL_DATA;
  const buckets = useMemo(
    () => bucketTournaments(source.rows, source.identity),
    [source.rows, source.identity],
  );
  const stageTournaments = useMemo(
    () => buckets.tournaments.filter((tournament) => !tournament.creator_gamertag),
    [buckets.tournaments],
  );
  const communityTournaments = useMemo(
    () => buckets.tournaments.filter((tournament) => Boolean(tournament.creator_gamertag)),
    [buckets.tournaments],
  );
  const live = useMemo(
    () => communityTournaments.filter((tournament) =>
      tournament.status === 'in_progress'
      && (!tournament.start_date || isPastOrNow(tournament.start_date))),
    [communityTournaments],
  );
  const trophyShowcase = useMemo(
    () => [...stageTournaments, ...communityTournaments]
      .filter((tournament) => tournament.trophy_url || tournament.trophy_item_id)
      .filter((tournament) => tournament.status !== 'completed')
      .slice(0, 12),
    [communityTournaments, stageTournaments],
  );

  return {
    ...resource,
    ...buckets,
    trophyItems: source.trophyItems,
    canCreate: canCreateCommunityTournament({
      user: source.identity?.user,
      player: source.identity?.player,
    }),
    stageTournaments,
    live,
    done: buckets.finished,
    trophyShowcase,
    reload: resource.refetch,
  };
}
