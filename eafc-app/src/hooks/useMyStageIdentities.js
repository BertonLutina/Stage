import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import { readAccountIntent, writeAccountIntent } from '@/lib/accountIntent';
import { readAccountMode, writeAccountMode } from '@/lib/accountMode';
import useAuthStore from '@/store/authStore';

/**
 * Resolves Stage player / president / club identities and heals
 * accountIntent + accountMode to match onboarding + live data.
 *
 * Intent (what you chose): player | president | both
 * Mode (what you're acting as): player | club  — only meaningful when both
 */
export default function useMyStageIdentities() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState({
    player: null,
    club: null,
    presidentClub: null,
    president: null,
    activeRoles: [],
  });
  const [intent, setIntent] = useState('player');
  const [mode, setMode] = useState('player');

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setBundle({ player: null, club: null, presidentClub: null, president: null, activeRoles: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const resolved = await resolveMyPlayerAndClub();
      const player = resolved?.player || null;
      const presidentClub = resolved?.presidentClub || null;
      const president = resolved?.president || null;
      const signedClub = player?.club_id
        ? (resolved?.club && String(resolved.club.id) === String(player.club_id) ? resolved.club : null)
        : null;

      let nextIntent = readAccountIntent(user.id);
      if (player && presidentClub && nextIntent !== 'both') {
        nextIntent = 'both';
        writeAccountIntent('both', user.id);
      } else if (!player && presidentClub && nextIntent === 'player') {
        nextIntent = 'president';
        writeAccountIntent('president', user.id);
      }

      let nextMode = readAccountMode();
      if (player && !presidentClub) nextMode = 'player';
      else if (!player && presidentClub) nextMode = 'club';
      writeAccountMode(nextMode);

      setBundle({
        player,
        club: signedClub || resolved?.club || null,
        presidentClub,
        president,
        activeRoles: resolved?.activeRoles || [],
      });
      setIntent(nextIntent);
      setMode(nextMode);
    } catch {
      setIntent(readAccountIntent(user.id));
      setMode(readAccountMode());
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const switchMode = useCallback((next) => {
    const value = next === 'club' ? 'club' : 'player';
    writeAccountMode(value);
    setMode(value);
  }, []);

  const surfaces = useMemo(() => {
    const canPlayer = intent !== 'president' && Boolean(bundle.player);
    const canPresident = intent !== 'player' && Boolean(bundle.president?.id || bundle.presidentClub);
    const canClub = intent !== 'player' && Boolean(bundle.presidentClub?.id);
    // Player may also open their signed club (membership), separate from president club
    const signedClubId = bundle.player?.club_id || null;
    return {
      canPlayer,
      canPresident,
      canClub,
      signedClubId,
      presidentClubId: bundle.presidentClub?.id || null,
      presidentId: bundle.president?.id || null,
      playerId: bundle.player?.id || null,
    };
  }, [intent, bundle]);

  const defaultSurface = useMemo(() => {
    if (mode === 'club') {
      if (surfaces.canClub) return 'club';
      if (surfaces.canPresident) return 'president';
    }
    if (surfaces.canPlayer) return 'player';
    if (surfaces.canClub) return 'club';
    if (surfaces.canPresident) return 'president';
    return 'player';
  }, [mode, surfaces]);

  return {
    loading,
    user,
    intent,
    mode,
    switchMode,
    refresh,
    ...bundle,
    ...surfaces,
    defaultSurface,
    isDual: intent === 'both' && Boolean(bundle.player) && Boolean(bundle.presidentClub),
  };
}
