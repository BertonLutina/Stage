import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import AppDirectoryScreen, { DirectoryRow } from '@/components/apps/AppDirectoryScreen';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import {
  CREDIT_PACKS,
  STAGE_PLUS_MONTHLY_CREDITS,
  STAGE_PLUS_PRICE,
  loadStore,
} from '@/lib/stageDirectories';

export default function StoreScreen() {
  const [store, setStore] = useState(null);
  const [tab, setTab] = useState('plus');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setStore(await loadStore());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const config = store?.config || {};
  const packs = CREDIT_PACKS;

  return (
    <AppDirectoryScreen
      title="Store"
      subtitle={`${store?.credits || 0} credits · ${store?.stc || 0} STC`}
      chips={[{ id: 'plus', label: 'STAGE Plus' }, { id: 'credits', label: 'Credits' }]}
      chipValue={tab}
      onChip={setTab}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={tab === 'credits' ? packs : [{ id: 'stage-plus' }]}
      keyExtractor={(item) => String(item.id)}
      emptyIcon="bag-outline"
      emptyText="Store unavailable"
      ListHeaderComponent={(
        <View style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(0,240,255,0.25)',
          backgroundColor: 'rgba(0,240,255,0.07)',
          padding: 16,
          marginBottom: 6,
        }}
        >
          <Text style={{ color: CYAN, fontSize: 11, fontWeight: '900' }}>
            {config.name || 'STAGE Plus'}
          </Text>
          <Text style={{ color: '#fff', fontWeight: '800', marginTop: 6 }}>
            {config.headline || 'One membership for serious competitors'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6, lineHeight: 18 }}>
            {config.description || 'Unlock official competitions, full rankings, and a monthly credit refresh.'}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        tab === 'plus' ? (
          <DirectoryRow
            title="STAGE Plus"
            subtitle={`${STAGE_PLUS_MONTHLY_CREDITS} credits / month`}
            fallbackIcon="sparkles-outline"
            badge={`€${config.stage_plus_monthly_price || STAGE_PLUS_PRICE.monthly}`}
          />
        ) : (
          <DirectoryRow
            title={item.label}
            subtitle={`${item.credits} credits`}
            fallbackIcon="diamond-outline"
            badge={`€${item.price_eur}`}
          />
        )
      )}
    />
  );
}
