import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, ScrollView, Text, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { loadPlayerDashboard, getMatchOpponent } from '@/lib/dashboardData';
import {
  GamerProfileShell,
  useGamerTokens,
} from '@/components/profile/gamer/GamerProfileUI';
import { SectionCard } from '@/components/dashboard/CommandCenterUI';
import { DashboardLayoutBody } from '@/components/dashboard/DashboardLayoutLab';
import { DashboardHomeLayoutSheet } from '@/components/dashboard/DashboardHomeLayoutPicker';
import { useTransferWindowStatus } from '@/hooks/useTransferWindowStatus';
import useDashboardLayoutStore from '@/store/dashboardLayoutStore';

/**
 * Home — Stage Command Center.
 */
export default function PlayerDashboardScreen() {
  const router = useRouter();
  const tokens = useGamerTokens();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const layout = useDashboardLayoutStore((s) => s.layout);
  const needsOnboarding = useDashboardLayoutStore((s) => s.needsOnboarding);
  const initializeLayout = useDashboardLayoutStore((s) => s.initialize);
  const completeOnboarding = useDashboardLayoutStore((s) => s.completeOnboarding);
  const { windowOpen } = useTransferWindowStatus();

  useEffect(() => {
    initializeLayout();
  }, [initializeLayout]);

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
    };
  }, [data, open, windowOpen]);

  if (loading && !data) {
    return (
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.cyan} size="large" />
        </View>
      </GamerProfileShell>
    );
  }

  return (
    <GamerProfileShell>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScrollView
          key={layout}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160, gap: 14 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.cyan} />}
        >
          {!vm.player?.id ? (
            <SectionCard>
              <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>
                Finish player onboarding to unlock your Command Center widgets.
              </Text>
              <TouchableOpacity
                onPress={() => open('/auth/onboarding')}
                accessibilityRole="button"
                accessibilityLabel="Continue player setup"
                style={{
                  marginTop: 14, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(0,240,255,0.14)', borderWidth: 1, borderColor: 'rgba(0,240,255,0.35)',
                }}
              >
                <Text style={{ color: tokens.cyan, fontWeight: '800' }}>Continue setup</Text>
              </TouchableOpacity>
            </SectionCard>
          ) : (
            <DashboardLayoutBody layout={layout} vm={vm} />
          )}
        </ScrollView>
        <DashboardHomeLayoutSheet
          visible={needsOnboarding}
          layout={layout}
          onConfirm={completeOnboarding}
          onDismiss={() => completeOnboarding(layout)}
        />
      </SafeAreaView>
    </GamerProfileShell>
  );
}
