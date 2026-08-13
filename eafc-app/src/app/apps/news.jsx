import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import AppDirectoryScreen, { DirectoryRow } from '@/components/apps/AppDirectoryScreen';
import { NEWS_FILTERS, filterNewsItems, loadNews, timeAgo } from '@/lib/stageDirectories';

export default function NewsScreen() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await loadNews();
    setItems(data.items);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => filterNewsItems(items, filter), [items, filter]);

  return (
    <AppDirectoryScreen
      title="News"
      subtitle={`${rows.length} stories`}
      chips={NEWS_FILTERS}
      chipValue={filter}
      onChip={setFilter}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={rows}
      keyExtractor={(item) => String(item.id)}
      emptyIcon="newspaper-outline"
      emptyText="No news yet"
      renderItem={({ item }) => (
        <DirectoryRow
          title={item.title || 'Update'}
          subtitle={[item._category?.replace('_', ' '), item.club_name || item.player_name, timeAgo(item.published_at || item.created_date)].filter(Boolean).join(' · ')}
          fallbackIcon="document-text-outline"
          badge={item.is_featured ? 'Featured' : null}
          onPress={() => Alert.alert(item.title || 'News', item.body || item.summary || 'No details')}
        />
      )}
    />
  );
}
