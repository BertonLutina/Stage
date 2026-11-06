import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { loadPlayerDashboard, getMatchOpponent } from '@/lib/dashboardData';
import { useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { Button, Screen } from '@/components/ui';
import { DASHBOARD_CARD_RADIUS, SectionCard } from '@/components/dashboard/CommandCenterUI';
import { DashboardLayoutBody } from '@/components/dashboard/DashboardLayoutLab';
import { useTransferWindowStatus } from '@/hooks/useTransferWindowStatus';

/**
 * Home — Stage Command Center.
 */
export default function PlayerDashboardScreen() {
  const router = useRouter();
  const tokens = useGamerTokens();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { windowOpen } = useTransferWindowStatus();

  const load = useCallback(async () => {
    try {
      const next = await loadPlayerDashboard();
      setData(next);
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const open = useCallback((href) => {
    if (!href) return;
    router.push(href);
  }, [router]);

  const patchPlayer = useCallback((updated) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, player: { ...(prev.player || {}), ...updated } };
    });
  }, []);

  const vm = useMemo(() => {
    const {
      user, player, club, playerRank, clubRank, nextMatch, upcomingMatches,
      activeTournaments, leagueStandings, activity, tenure,
      glance, form,
    } = data || {};

    const rankedPlayer = playerRank?.row;
    const wins = rankedPlayer?.ranking_wins ?? player?.wins_count ?? player?.wins ?? 0;
    const draws = rankedPlayer?.ranking_draws ?? player?.draws_count ?? player?.draws ?? 0;
    const losses = rankedPlayer?.ranking_losses ?? player?.losses_count ?? player?.losses ?? 0;
    const matchesPlayed = rankedPlayer?.ranking_matches ?? player?.matches_played ?? 0;
    const rankingPoints = rankedPlayer?.ranking_points ?? player?.ranking_points ?? 0;
    const winRate = rankedPlayer?.ranking_win_rate
      ?? (matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0);
    const goals = rankedPlayer?.ranking_goals ?? player?.goals ?? 0;
    const avgRating = rankedPlayer?.ranking_avg_rating ?? player?.avg_rating ?? 0;

    return {
      user, player, club, playerRank, clubRank, nextMatch, upcomingMatches,
      activeTournaments, leagueStandings, activity, tenure,
      glance, form, open,
      wins, draws, losses, matchesPlayed, rankingPoints, winRate, goals, avgRating,
      opponentInfo: getMatchOpponent(nextMatch, player, club),
      gamertag: player?.gamertag || user?.email?.split('@')[0] || 'Guest',
      transferWindowOpen: windowOpen,
      patchPlayer,
    };
  }, [data, open, windowOpen, patchPlayer]);

  if (loading && !data) {
    return (
      <Screen scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.cyan} size="large" />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.cyan} />}
      style={{ gap: 14 }}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      {!vm.player?.id ? (
        <SectionCard radius={DASHBOARD_CARD_RADIUS}>
          <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>
            Finish player onboarding to unlock your Command Center widgets.
          </Text>
          <View style={{ marginTop: 14 }}>
            <Button
              title="Continue setup"
              accessibilityLabel="Continue player setup"
              onPress={() => open('/auth/onboarding')}
            />
          </View>
        </SectionCard>
      ) : (
        <DashboardLayoutBody layout="E" vm={vm} />
      )}
    </Screen>
  );
}
