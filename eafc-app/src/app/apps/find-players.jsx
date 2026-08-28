import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GamerProfileShell, GlassIconButton } from '@/components/profile/gamer/GamerProfileUI';
import PageTile, { PageTitle } from '@/components/theme/PageTile';
import DirectoryCarousel from '@/components/directory/DirectoryCarousel';
import DirectoryDetailSheet from '@/components/directory/DirectoryDetailSheet';
import FilterListBox from '@/components/directory/FilterListBox';
import HubToggle from '@/components/directory/HubToggle';
import { DirectoryPlayerList } from '@/components/directory/DirectoryLists';
import TransferPlayerPhotoCard from '@/components/transfer/TransferPlayerPhotoCard';
import { SILVER, TILE_HAIRLINE } from '@/components/transfer/transferHubTheme';
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

export default function FindPlayersScreen() {
  const router = useRouter();
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
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
        </View>

        <PageTitle
          title="FIND PLAYERS"
          subtitle={`${rows.length} public profile${rows.length === 1 ? '' : 's'}`}
        />

        <PageTile
          tileKey="find_players"
          tileTitle="FIND PLAYERS"
          style={{ flex: 1, marginHorizontal: 12, marginBottom: 12 }}
          contentStyle={{ flex: 1, paddingHorizontal: 12, gap: 12 }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <HubToggle
              label="Carousel"
              icon="images-outline"
              active={viewMode === 'carousel'}
              onPress={() => setViewMode('carousel')}
            />
            <HubToggle
              label="List"
              icon="list-outline"
              active={viewMode === 'list'}
              onPress={() => setViewMode('list')}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: TILE_HAIRLINE,
              backgroundColor: 'rgba(0,0,0,0.4)',
              paddingHorizontal: 12,
              minHeight: 44,
            }}
          >
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search gamertag"
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoCorrect={false}
              autoCapitalize="none"
              style={{ flex: 1, color: '#fff', fontSize: 15, paddingVertical: 10 }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <FilterListBox label="CONSOLE" value={platform} options={PLATFORMS} onChange={setPlatform} />
            <FilterListBox label="POSITION" value={position} options={PLAYER_POSITIONS} onChange={setPosition} />
            <FilterListBox label="OVR" value={minOvr} options={OVR_FLOOR_OPTIONS} onChange={setMinOvr} />
          </View>

          {loading ? (
            <ActivityIndicator color={SILVER} style={{ marginTop: 48 }} />
          ) : viewMode === 'list' ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingVertical: 12, paddingBottom: 40 }}
              refreshControl={(
                <RefreshControl refreshing={Boolean(refreshing)} onRefresh={() => { setRefreshing(true); load(); }} tintColor={SILVER} />
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
      </SafeAreaView>

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
    </GamerProfileShell>
  );
}
