import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { IconButton, Screen, SectionLabel, SegmentedControl } from '@/components/ui';
import PageTile, { PageTitle } from '@/components/theme/PageTile';
import DirectoryCarousel from '@/components/directory/DirectoryCarousel';
import DirectoryDetailSheet from '@/components/directory/DirectoryDetailSheet';
import DirectorySearchField from '@/components/directory/DirectorySearchField';
import FilterListBox from '@/components/directory/FilterListBox';
import { DirectoryPlayerList } from '@/components/directory/DirectoryLists';
import TransferPlayerPhotoCard from '@/components/transfer/TransferPlayerPhotoCard';
import { playerAvatarInitials, resolvePlayerAvatarUrl } from '@/lib/playerAvatar';
import {
  OVR_FLOOR_OPTIONS,
  PLAYER_POSITIONS,
  PLATFORMS,
  filterPlayerDirectory,
  loadPlayerDirectory,
  playerDisplayName,
  playerOverallRating,
} from '@/lib/stageDirectories';

const VIEW_OPTIONS = [
  { key: 'carousel', label: 'Carousel' },
  { key: 'list', label: 'List' },
];

export default function FindPlayersScreen() {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const [players, setPlayers] = useState([]);
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('All');
  const [position, setPosition] = useState('All');
  const [minOvr, setMinOvr] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('carousel');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    const data = await loadPlayerDirectory();
    setPlayers(data.players);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(
    () => filterPlayerDirectory(players, { query, platform, position, minOvr }),
    [players, query, platform, position, minOvr],
  );

  useEffect(() => {
    if (rows.length === 0) {
      setSelected(null);
      return;
    }
    setSelected((prev) => {
      const match = prev && rows.find((player) => String(player.id) === String(prev.id));
      return match || rows[0];
    });
  }, [rows]);

  const selectPlayer = useCallback((player, { openDetails = false } = {}) => {
    setSelected(player);
    if (openDetails) setDetailsOpen(true);
  }, []);

  const openProfile = () => {
    if (!selected?.id) return;
    setDetailsOpen(false);
    router.push({
      pathname: '/(tabs)/profile/profilescreen',
      params: { playerId: String(selected.id) },
    });
  };

  const challenge = () => {
    if (!selected?.id) return;
    setDetailsOpen(false);
    router.push({
      pathname: '/(tabs)/matches',
      params: {
        arrange: '1',
        opponentKind: 'player',
        opponentId: selected.id,
        opponentName: playerDisplayName(selected),
        opponentEmail: selected.email || '',
      },
    });
  };

  return (
    <Screen scroll={false} tabBar={false} guideFab>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flex: 1, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel="Back" />
        </View>

        <PageTitle title="FIND PLAYERS" padded={false} style={{ paddingBottom: 0 }} />

        <PageTile
          tileKey="find_players"
          tileTitle="FIND PLAYERS"
          style={{ flex: 1 }}
          contentStyle={{ flex: 1, paddingHorizontal: 12, gap: 12 }}
        >
          <DirectorySearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Search gamertag"
            autoCorrect={false}
            autoCapitalize="none"
          />

          <SegmentedControl options={VIEW_OPTIONS} value={viewMode} onChange={setViewMode} />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <FilterListBox label="CONSOLE" value={platform} options={PLATFORMS} onChange={setPlatform} />
            <FilterListBox label="POSITION" value={position} options={PLAYER_POSITIONS} onChange={setPosition} />
            <FilterListBox label="OVR" value={minOvr} options={OVR_FLOOR_OPTIONS} onChange={setMinOvr} />
          </View>

          <SectionLabel>{`${rows.length} public profile${rows.length === 1 ? '' : 's'}`}</SectionLabel>

          {loading ? (
            <ActivityIndicator color={tokens.cyan} style={{ marginTop: 48 }} />
          ) : viewMode === 'list' ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingVertical: 12, paddingBottom: 40 }}
              refreshControl={(
                <RefreshControl refreshing={Boolean(refreshing)} onRefresh={() => { setRefreshing(true); load(); }} tintColor={tokens.cyan} colors={[tokens.cyan]} />
              )}
            >
              <DirectoryPlayerList
                players={rows}
                selectedId={selected?.id}
                onSelect={selectPlayer}
              />
            </ScrollView>
          ) : (
            <DirectoryCarousel
              items={rows}
              selectedId={selected?.id}
              getId={(player) => player.id}
              getName={playerDisplayName}
              emptyIcon="people-outline"
              emptyText="No public players match"
              onSelect={selectPlayer}
              renderCard={(player, focused, width) => (
                <TransferPlayerPhotoCard player={player} focused={focused} width={width} />
              )}
            />
          )}
        </PageTile>
      </View>

      <DirectoryDetailSheet
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        eyebrow="Player details"
        title={selected ? playerDisplayName(selected) : ''}
        imageUrl={resolvePlayerAvatarUrl(selected)}
        initials={playerAvatarInitials(selected)}
        stats={[
          { label: 'POSITION', value: [selected?.position, selected?.secondary_position].filter(Boolean).join(' / ') },
          { label: 'OVR', value: playerOverallRating(selected) },
          { label: 'PLATFORM', value: selected?.platform },
        ]}
        primaryLabel="View full profile"
        onPrimary={openProfile}
        secondaryLabel="VS"
        onSecondary={challenge}
      />
    </Screen>
  );
}
