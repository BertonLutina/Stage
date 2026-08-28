import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GamerProfileShell, GlassIconButton } from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleSm } from '@/lib/fonts';
import PageTile, { PageTitle } from '@/components/theme/PageTile';
import { useTransferWindowStatus } from '@/hooks/useTransferWindowStatus';
import {
  filterTransferEntries,
  loadTransferMarket,
} from '@/lib/stageDirectories';
import TransferDetailSheet from '@/components/transfer/TransferDetailSheet';
import TransferFilters from '@/components/transfer/TransferFilters';
import TransferPlayerCarousel from '@/components/transfer/TransferPlayerCarousel';
import TransferPlayerList from '@/components/transfer/TransferPlayerList';
import TransferWindowBanner from '@/components/transfer/TransferWindowBanner';
import { SILVER } from '@/components/transfer/transferHubTheme';

function HubToggle({ label, icon, active, badge, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 36,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: active ? 'rgba(248,251,255,0.55)' : 'rgba(255,255,255,0.12)',
        backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.35)',
      }}
    >
      <Ionicons name={icon} size={14} color={active ? SILVER : 'rgba(255,255,255,0.5)'} />
      <Text style={[headingStyleSm, { fontSize: 11, letterSpacing: 1.6, color: active ? SILVER : 'rgba(255,255,255,0.5)' }]}>
        {label}
      </Text>
      {badge > 0 ? (
        <Text style={{ color: active ? SILVER : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800' }}>
          {badge}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function TransfersScreen() {
  const router = useRouter();
  const { currentWindow } = useTransferWindowStatus();
  const [entries, setEntries] = useState([]);
  const [freeCount, setFreeCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [position, setPosition] = useState('All');
  const [platform, setPlatform] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('carousel');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    const market = await loadTransferMarket();
    setEntries(market.entries);
    setFreeCount(market.freeAgents?.length || 0);
    setExpiringCount(market.expiringPlayers?.length || 0);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(
    () => filterTransferEntries(entries, { query, status, position, platform }),
    [entries, query, status, position, platform],
  );

  useEffect(() => {
    if (rows.length === 0) {
      setSelected(null);
      return;
    }
    setSelected((prev) => {
      const match = prev && rows.find((entry) => entry.player.id === prev.player.id);
      return match || rows[0];
    });
  }, [rows]);

  const selectEntry = useCallback((entry, { openDetails = false } = {}) => {
    setSelected(entry);
    if (openDetails) setDetailsOpen(true);
  }, []);

  const filterCount = [query, position !== 'All' ? position : '', platform !== 'All' ? platform : '']
    .filter(Boolean).length + (status !== 'all' ? 1 : 0);

  const openProfile = () => {
    if (!selected?.player?.id) return;
    setDetailsOpen(false);
    router.push({
      pathname: '/(tabs)/profile/profilescreen',
      params: { playerId: String(selected.player.id) },
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
          eyebrow="TRANSFER HUB"
          title="TRANSFERS"
          subtitle={`${rows.length} player${rows.length === 1 ? '' : 's'} found  •  ${freeCount} free  •  ${expiringCount} expiring`}
        />

        <PageTile
          tileKey="transfers"
          tileTitle="TRANSFER HUB"
          style={{ flex: 1, marginHorizontal: 12, marginBottom: 12 }}
          contentStyle={{ flex: 1, paddingHorizontal: 12, gap: 12 }}
        >
          <View style={{ gap: 12 }}>
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
              <HubToggle
                label="Filters"
                icon="options-outline"
                badge={filterCount}
                onPress={() => setFiltersOpen(true)}
              />
            </View>
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
              <TransferPlayerList
                players={rows}
                selectedId={selected?.player?.id}
                onSelect={selectEntry}
              />
            </ScrollView>
          ) : (
            <TransferPlayerCarousel
              entries={rows}
              selectedId={selected?.player?.id}
              onSelect={selectEntry}
            />
          )}
        </PageTile>
      </SafeAreaView>

      <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.62)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setFiltersOpen(false)} />
          <View style={{ backgroundColor: '#071018', borderTopWidth: 1, borderColor: 'rgba(238,243,251,0.22)', maxHeight: '86%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 }}>
              <Text style={[headingStyleSm, { color: SILVER, letterSpacing: 2.4 }]}>Filters</Text>
              <TouchableOpacity onPress={() => setFiltersOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}>
              <TransferWindowBanner window={currentWindow} />
              <TransferFilters
                search={query}
                onSearch={setQuery}
                position={position}
                onPosition={setPosition}
                statusFilter={status}
                onStatus={setStatus}
                platform={platform}
                onPlatform={setPlatform}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TransferDetailSheet
        visible={detailsOpen}
        entry={selected}
        onClose={() => setDetailsOpen(false)}
        onViewProfile={openProfile}
      />
    </GamerProfileShell>
  );
}
