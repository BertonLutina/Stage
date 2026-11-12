import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StatusBar, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TournamentCard from '@/components/tournament/TournamentCard';
import useTournamentsList from '@/hooks/useTournamentsList';
import useThemeStore from '@/store/themeStore';
import { Button, Card, Screen, SegmentedControl, SkeletonList } from '@/components/ui';
import CompetitionsView from '@/components/competitions/CompetitionsView';
import RankingsView from '@/components/rankings/RankingsView';
import useT from '@/hooks/useT';
import { headingStyleLg } from '@/lib/fonts';

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'my', label: 'My tournaments' },
  { key: 'finished', label: 'Finished' },
];

const SECTION_KEYS = ['tournaments', 'competitions', 'rankings'];

const IDLE_REFRESH = { refreshing: false, refetch: null };

/**
 * Tournaments tab. Three straight screen tabs (Tournaments | Competitions | Rankings),
 * not a new bottom tab: the bottom bar keeps its five entries.
 */
export default function TournamentListScreen() {
  const router = useRouter();
  const t = useT();
  const [section, setSection] = useState('tournaments');
  const [childRefresh, setChildRefresh] = useState(IDLE_REFRESH);
  const tokens = useThemeStore((state) => state.tokens);
  const {
    loading,
    error,
    refreshing,
    refetch,
    trophyItems,
    canCreate,
    open,
    my,
    finished,
  } = useTournamentsList();
  const [tab, setTab] = useState('open');
  const data = useMemo(
    () => (tab === 'my' ? my : tab === 'finished' ? finished : open),
    [finished, my, open, tab],
  );

  const sections = useMemo(
    () => SECTION_KEYS.map((key) => ({ key, label: t(`stage.hub.${key}`) })),
    [t],
  );
  const onSection = (key) => {
    setChildRefresh(IDLE_REFRESH);
    setSection(key);
  };
  const activeRefresh = section === 'tournaments'
    ? { refreshing, refetch }
    : childRefresh;

  const openTournament = (id) => router.push({
    pathname: '/(tabs)/tournaments/tournamentdetailscreen',
    params: { tournamentId: id },
  });

  const tournamentsBody = (
    <>
        <SegmentedControl
          accessibilityLabel="Tournament status"
          options={TABS}
          value={tab}
          onChange={setTab}
        />

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <Card style={{ gap: 14, alignItems: 'center' }}>
            <Ionicons name="cloud-offline-outline" size={30} color={tokens.muted} />
            <Text style={{ color: tokens.danger, textAlign: 'center' }}>{error}</Text>
            <Button title="Retry" variant="secondary" onPress={refetch} />
          </Card>
        ) : data.length ? (
          <View style={{ gap: 12 }}>
            {data.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                trophyItems={trophyItems}
                joined={tab === 'my'}
                onPress={() => openTournament(tournament.id)}
              />
            ))}
          </View>
        ) : (
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
            <Ionicons name="trophy-outline" size={34} color={tokens.muted} />
            <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>
              {tab === 'my' ? 'No tournaments joined' : tab === 'finished' ? 'No finished tournaments' : 'No open tournaments'}
            </Text>
            <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' }}>
              {tab === 'open'
                ? 'Check back soon for new Stage competitions.'
                : 'Tournament activity will appear here automatically.'}
            </Text>
            {!canCreate && tab === 'open' ? (
              <Button title="Unlock tournament creation" variant="secondary" onPress={() => router.push('/apps/store')} />
            ) : null}
          </Card>
        )}
    </>
  );

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={activeRefresh.refreshing}
          onRefresh={() => activeRefresh.refetch && activeRefresh.refetch()}
          tintColor={tokens.cyan}
        />
      }
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.7}
            style={[headingStyleLg, { flex: 1, color: tokens.text, fontSize: 34, letterSpacing: 1 }]}
          >
            {t(`stage.hub.${section}`)}
          </Text>
          {canCreate && section === 'tournaments' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create tournament"
              onPress={() => router.push('/(tabs)/tournaments/createtournamentscreen')}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: pressed ? tokens.cyanHi : tokens.cyan,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Ionicons name="add" size={24} color={tokens.onCyan} />
            </Pressable>
          ) : null}
        </View>

        <SegmentedControl
          testID="tournaments-sections"
          accessibilityLabel={t('stage.hub.tabsLabel')}
          options={sections}
          value={section}
          onChange={onSection}
        />

        {section === 'competitions' ? (
          <CompetitionsView onRefreshState={setChildRefresh} showTitle={false} />
        ) : section === 'rankings' ? (
          <RankingsView onRefreshState={setChildRefresh} />
        ) : (
          tournamentsBody
        )}
      </View>
    </Screen>
  );
}
