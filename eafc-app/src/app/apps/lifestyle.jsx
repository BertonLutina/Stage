import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { stageClient } from '@/api/stageClient';
import AppDirectoryScreen, { DirectoryRow, FilterChips } from '@/components/apps/AppDirectoryScreen';
import {
  LIFESTYLE_CATEGORIES,
  formatSTC,
  loadLifestyle,
  resolveLifestyleCategory,
} from '@/lib/stageDirectories';

export default function LifestyleScreen() {
  const [tab, setTab] = useState('store');
  const [category, setCategory] = useState('all');
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await loadLifestyle();
    setItems(data.items);
    setPurchases(data.purchases);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    if (tab === 'owned') return purchases;
    return items.filter((item) => (
      category === 'all' || resolveLifestyleCategory(item.category) === category
    ));
  }, [tab, items, purchases, category]);

  const buy = (item) => {
    Alert.alert(item.name || 'Lifestyle', `Buy for ${formatSTC(item.price_stc || item.price || 0)} STC?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Buy',
        onPress: async () => {
          try {
            await stageClient.functions.invoke('buyLifestyleItem', { item_id: item.id });
            await load();
          } catch (err) {
            Alert.alert('Lifestyle', err?.message || 'Purchase failed');
          }
        },
      },
    ]);
  };

  return (
    <AppDirectoryScreen
      title="Lifestyle"
      subtitle={tab === 'store' ? `${rows.length} assets` : `${purchases.length} owned`}
      chips={[{ id: 'store', label: 'Store' }, { id: 'owned', label: 'Owned' }]}
      chipValue={tab}
      onChip={(value) => {
        setTab(value);
        setCategory(value === 'owned' ? 'owned' : 'all');
      }}
      extraFilters={tab === 'store' ? (
        <FilterChips
          options={[{ id: 'all', label: 'All' }, ...LIFESTYLE_CATEGORIES]}
          value={category}
          onChange={setCategory}
        />
      ) : null}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={rows}
      keyExtractor={(item) => String(item.id)}
      emptyIcon="cafe-outline"
      emptyText={tab === 'owned' ? 'No owned assets' : 'No lifestyle items'}
      renderItem={({ item }) => (
        tab === 'store' ? (
          <DirectoryRow
            title={item.name}
            subtitle={[LIFESTYLE_CATEGORIES.find((cat) => cat.id === resolveLifestyleCategory(item.category))?.label, item.tier].filter(Boolean).join(' · ')}
            imageUrl={item.image_url}
            fallbackIcon="cafe-outline"
            badge={`${formatSTC(item.price_stc || item.price || 0)} STC`}
            actionLabel="Buy"
            onAction={() => buy(item)}
            onPress={() => buy(item)}
          />
        ) : (
          <DirectoryRow
            title={item.item_name || item.name || 'Asset'}
            subtitle={item.status || 'owned'}
            imageUrl={item.image_url}
            fallbackIcon="cafe-outline"
            badge={item.status}
          />
        )
      )}
    />
  );
}
