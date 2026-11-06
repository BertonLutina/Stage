import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TournamentCard from '../../../components/tournament/TournamentCard';
import useTournamentsList from '../../../hooks/useTournamentsList';
import useThemeStore from '@/store/themeStore';
import { Screen, SectionLabel } from '@/components/ui';
import PageTile, { PageTitle, SilverPill } from '@/components/theme/PageTile';

const COMMUNITY_TABS = [
  { id: 'open', label: 'Open' },
  { id: 'live', label: 'Live' },
  { id: 'done', label: 'Done' },
];

export default function TournamentListScreen() {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const {
    loading,
    error,
    reload,
    stageTournaments,
    open,
    live,
    done,
    trophyShowcase,
    trophyItems,
    canCreate,
  } = useTournamentsList();
  const [tab, setTab] = useState('open');
  const [refreshing, setRefreshing] = useState(false);

  const communityData = tab === 'open' ? open : tab === 'live' ? live : done;

  const tabs = useMemo(
    () => COMMUNITY_TABS.map((t) => ({
      ...t,
      badge: String(
        t.id === 'open' ? open.length : t.id === 'live' ? live.length : done.length,
      ),
    })),
    [open.length, live.length, done.length],
  );

  const openTournament = (id) => {
    router.push({
      pathname: '/(tabs)/tournaments/tournamentdetailscreen',
      params: { tournamentId: id },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const trophyUrlFor = (t) =>
    t.trophy_url || trophyItems.find((i) => String(i.id) === String(t.trophy_item_id))?.image_url;

  if (loading && !refreshing) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.cyan} size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.cyan} />
      }
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <PageTitle
              title="TOURNAMENTS"
              subtitle={`${stageTournaments.length} official · ${open.length + live.length} active`}
              padded={false}
              style={{ paddingBottom: 0 }}
            />
          </View>
          {canCreate ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create cup"
              onPress={() => router.push('/(tabs)/tournaments/createtournamentscreen')}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tokens.cyan,
                backgroundColor: pressed ? tokens.cyanHi : tokens.cyan,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Ionicons name="add" size={22} color={tokens.onCyan} />
            </Pressable>
          ) : null}
        </View>

        <PageTile
          tileKey="tournaments"
          tileTitle="TOURNAMENTS"
          contentStyle={{ paddingHorizontal: 12, gap: 16 }}
        >
          <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 18 }}>
            GOST, regional leagues, and community cups. Register here, play on Game Day.
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <SilverPill
              label="GOST"
              onPress={() => router.push('/apps/competitions')}
            />
            <SilverPill
              label="Register"
              onPress={() => router.push('/apps/register')}
            />
            {!canCreate ? (
              <SilverPill
                label="STAGE Plus to create"
                onPress={() => router.push('/apps/store')}
              />
            ) : null}
          </View>

          {error ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: tokens.danger, fontSize: 12 }}>{error}</Text>
              <View style={{ flexDirection: 'row' }}>
                <SilverPill label="Retry" onPress={reload} />
              </View>
            </View>
          ) : null}

          {trophyShowcase.length > 0 ? (
            <View style={{ gap: 12 }}>
              <SectionLabel>Prize pool · Trophies at stake</SectionLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                {trophyShowcase.map((t) => {
                  const url = trophyUrlFor(t);
                  if (!url) return null;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => openTournament(t.id)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t.name}
                      style={{ width: 76, alignItems: 'center' }}
                    >
                      <View style={{
                        width: 64,
                        height: 64,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: tokens.border,
                        backgroundColor: tokens.bgDeep,
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 6,
                      }}
                      >
                        <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: tokens.muted,
                          fontSize: 11,
                          marginTop: 6,
                          textAlign: 'center',
                          fontWeight: '600',
                        }}
                      >
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {stageTournaments.length > 0 ? (
            <View style={{ gap: 12 }}>
              <SectionLabel>By stage · Open tournaments</SectionLabel>
              <View style={{ gap: 12 }}>
                {stageTournaments.map((t) => (
                  <TournamentCard
                    key={t.id}
                    tournament={t}
                    trophyItems={trophyItems}
                    onPress={() => openTournament(t.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ gap: 12 }}>
            <SectionLabel>Community · Open competition</SectionLabel>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {tabs.map((item) => (
                <SilverPill
                  key={item.id}
                  label={item.label}
                  badge={item.badge}
                  active={tab === item.id}
                  onPress={() => setTab(item.id)}
                />
              ))}
            </ScrollView>

            {communityData.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32, gap: 10 }}>
                <Ionicons name="trophy-outline" size={36} color={tokens.muted} />
                <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '600' }}>
                  {`No ${tab} tournaments`}
                </Text>
                <Text style={{ color: tokens.muted, fontSize: 13, textAlign: 'center', paddingHorizontal: 12 }}>
                  {canCreate
                    ? 'Create a community cup, or check back for open ones.'
                    : 'Check back soon for open cups, or unlock create with STAGE Plus.'}
                </Text>
                {canCreate ? (
                  <SilverPill
                    label="Create cup"
                    onPress={() => router.push('/(tabs)/tournaments/createtournamentscreen')}
                  />
                ) : null}
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {communityData.map((t) => (
                  <TournamentCard
                    key={t.id}
                    tournament={t}
                    trophyItems={trophyItems}
                    onPress={() => openTournament(t.id)}
                  />
                ))}
              </View>
            )}
          </View>
        </PageTile>
      </View>
    </Screen>
  );
}
