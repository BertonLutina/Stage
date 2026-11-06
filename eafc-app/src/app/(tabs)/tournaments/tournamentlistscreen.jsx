import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StatusBar, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TournamentCard from '@/components/tournament/TournamentCard';
import useTournamentsList from '@/hooks/useTournamentsList';
import useThemeStore from '@/store/themeStore';
import { Button, Card, Screen, SectionLabel, SegmentedControl } from '@/components/ui';
import { headingStyleLg } from '@/lib/fonts';

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'my', label: 'My tournaments' },
  { key: 'finished', label: 'Finished' },
];

export default function TournamentListScreen() {
  const router = useRouter();
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

  const openTournament = (id) => router.push({
    pathname: '/(tabs)/tournaments/tournamentdetailscreen',
    params: { tournamentId: id },
  });

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} />
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
            Tournaments
          </Text>
          {canCreate ? (
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
          accessibilityLabel="Tournament status"
          options={TABS}
          value={tab}
          onChange={setTab}
        />

        {loading ? (
          <View style={{ paddingVertical: 56, alignItems: 'center' }}>
            <ActivityIndicator color={tokens.cyan} size="large" />
          </View>
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
          </Card>
        )}

        <View style={{ gap: 10, paddingTop: 4 }}>
          <SectionLabel>Tournament tools</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button title="GOST leagues" variant="secondary" onPress={() => router.push('/apps/competitions')} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Register" variant="secondary" onPress={() => router.push('/apps/register')} />
            </View>
          </View>
          {!canCreate ? (
            <Button title="Unlock tournament creation" variant="secondary" onPress={() => router.push('/apps/store')} />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
