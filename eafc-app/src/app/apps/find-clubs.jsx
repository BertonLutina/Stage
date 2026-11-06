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
import DirectoryClubPhotoCard from '@/components/directory/DirectoryClubPhotoCard';
import DirectoryDetailSheet from '@/components/directory/DirectoryDetailSheet';
import DirectorySearchField from '@/components/directory/DirectorySearchField';
import FilterListBox from '@/components/directory/FilterListBox';
import { DirectoryClubList } from '@/components/directory/DirectoryLists';
import {
  CLUB_REGIONS,
  OVR_FLOOR_OPTIONS,
  PLATFORMS,
  clubDisplayName,
  clubOverallRating,
  filterClubDirectory,
  loadClubDirectory,
} from '@/lib/stageDirectories';

const VIEW_OPTIONS = [
  { key: 'carousel', label: 'Carousel' },
  { key: 'list', label: 'List' },
];

export default function FindClubsScreen() {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const [clubs, setClubs] = useState([]);
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('All');
  const [region, setRegion] = useState('All');
  const [minOvr, setMinOvr] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('carousel');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setClubs(await loadClubDirectory());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(
    () => filterClubDirectory(clubs, { query, platform, region, minOvr }),
    [clubs, query, platform, region, minOvr],
  );

  useEffect(() => {
    if (rows.length === 0) {
      setSelected(null);
      return;
    }
    setSelected((prev) => {
      const match = prev && rows.find((club) => String(club.id) === String(prev.id));
      return match || rows[0];
    });
  }, [rows]);

  const selectClub = useCallback((club, { openDetails = false } = {}) => {
    setSelected(club);
    if (openDetails) setDetailsOpen(true);
  }, []);

  const openClub = () => {
    if (!selected?.id) return;
    setDetailsOpen(false);
    router.push({ pathname: '/apps/club/[id]', params: { id: String(selected.id) } });
  };

  const challenge = () => {
    if (!selected?.id) return;
    setDetailsOpen(false);
    router.push({
      pathname: '/(tabs)/matches',
      params: {
        arrange: '1',
        opponentKind: 'club',
        opponentId: selected.id,
        opponentName: clubDisplayName(selected),
        opponentTag: selected.tag || '',
        opponentEmail: selected.owner_email || '',
      },
    });
  };

  const initials = String(selected?.tag || clubDisplayName(selected) || 'C').slice(0, 3).toUpperCase();

  return (
    <Screen scroll={false} tabBar={false} guideFab>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flex: 1, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel="Back" />
        </View>

        <PageTitle title="FIND CLUBS" padded={false} style={{ paddingBottom: 0 }} />

        <PageTile
          tileKey="find_clubs"
          tileTitle="FIND CLUBS"
          style={{ flex: 1 }}
          contentStyle={{ flex: 1, paddingHorizontal: 12, gap: 12 }}
        >
          <DirectorySearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Search name or tag"
            autoCorrect={false}
            autoCapitalize="none"
          />

          <SegmentedControl options={VIEW_OPTIONS} value={viewMode} onChange={setViewMode} />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <FilterListBox label="CONSOLE" value={platform} options={PLATFORMS} onChange={setPlatform} />
            <FilterListBox label="REGION" value={region} options={CLUB_REGIONS} onChange={setRegion} />
            <FilterListBox label="OVR" value={minOvr} options={OVR_FLOOR_OPTIONS} onChange={setMinOvr} />
          </View>

          <SectionLabel>{`${rows.length} club${rows.length === 1 ? '' : 's'}`}</SectionLabel>

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
              <DirectoryClubList
                clubs={rows}
                selectedId={selected?.id}
                onSelect={selectClub}
              />
            </ScrollView>
          ) : (
            <DirectoryCarousel
              items={rows}
              selectedId={selected?.id}
              getId={(club) => club.id}
              getName={clubDisplayName}
              emptyIcon="shield-outline"
              emptyText="No clubs match"
              prevLabel="Previous club"
              nextLabel="Next club"
              onSelect={selectClub}
              renderCard={(club, focused, width) => (
                <DirectoryClubPhotoCard club={club} focused={focused} width={width} />
              )}
            />
          )}
        </PageTile>
      </View>

      <DirectoryDetailSheet
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        eyebrow="Club details"
        title={selected ? clubDisplayName(selected) : ''}
        imageUrl={selected?.logo_url}
        initials={initials}
        stats={[
          { label: 'REGION', value: selected?.region },
          { label: 'OVR', value: clubOverallRating(selected) },
          { label: 'PLATFORM', value: selected?.platform },
        ]}
        primaryLabel="View club"
        onPrimary={openClub}
        secondaryLabel="VS"
        onSecondary={challenge}
      />
    </Screen>
  );
}
