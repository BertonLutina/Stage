import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { IconButton, SectionLabel } from '@/components/ui';
import HubToggle from '@/components/directory/HubToggle';
import {
  filterTransferEntries,
  loadTransferMarket,
} from '@/lib/stageDirectories';
import TransferDetailSheet from '@/components/transfer/TransferDetailSheet';
import TransferFilters from '@/components/transfer/TransferFilters';
import TransferPlayerCarousel from '@/components/transfer/TransferPlayerCarousel';
import TransferPlayerList from '@/components/transfer/TransferPlayerList';
import TransferWindowBanner from '@/components/transfer/TransferWindowBanner';

/**
 * Free agents tab: the market that used to be the whole Transfers screen
 * (carousel / list, filters sheet, player details). Unchanged behaviour.
 */
export default function FreeAgentsView({ currentWindow = null }) {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
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
    <View style={{ flex: 1, gap: 12 }}>
      <Text style={{ color: tokens.muted, fontSize: 12 }}>
        {`${rows.length} player${rows.length === 1 ? '' : 's'} found  •  ${freeCount} free  •  ${expiringCount} expiring`}
      </Text>
      <View style={{ flex: 1, gap: 12 }}>
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

          {loading ? (
            <ActivityIndicator color={tokens.cyan} style={{ marginTop: 48 }} />
          ) : viewMode === 'list' ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingVertical: 12, paddingBottom: 40 }}
              refreshControl={(
                <RefreshControl
                  refreshing={Boolean(refreshing)}
                  onRefresh={() => { setRefreshing(true); load(); }}
                  tintColor={tokens.cyan}
                  colors={[tokens.cyan]}
                />
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
      </View>

      <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: tokens.overlay }}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setFiltersOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss filters"
            />
            <View
              style={{
                backgroundColor: tokens.bgDeep,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderColor: tokens.border,
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
                maxHeight: '86%',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 12, paddingTop: 12, paddingBottom: 8 }}>
                <SectionLabel>Filters</SectionLabel>
                <IconButton icon="close" onPress={() => setFiltersOpen(false)} accessibilityLabel="Close filters" />
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
        </KeyboardAvoidingView>
      </Modal>

      <TransferDetailSheet
        visible={detailsOpen}
        entry={selected}
        onClose={() => setDetailsOpen(false)}
        onViewProfile={openProfile}
      />
    </View>
  );
}
