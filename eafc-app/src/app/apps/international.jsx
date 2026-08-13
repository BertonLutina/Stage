import React, { useCallback, useEffect, useState } from 'react';
import AppDirectoryScreen, { DirectoryRow } from '@/components/apps/AppDirectoryScreen';
import { loadInternational } from '@/lib/stageDirectories';

export default function InternationalScreen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await loadInternational();
    setRows(data.tournaments);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AppDirectoryScreen
      title="International"
      subtitle={`${rows.length} tournaments`}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={rows}
      keyExtractor={(item) => String(item.id)}
      emptyIcon="globe-outline"
      emptyText="No international tournaments open"
      renderItem={({ item }) => (
        <DirectoryRow
          title={item.name || item.title || 'International'}
          subtitle={[item.status, item.season, item.phase].filter(Boolean).join(' · ')}
          fallbackIcon="globe-outline"
          badge={item.status || 'Open'}
        />
      )}
    />
  );
}
