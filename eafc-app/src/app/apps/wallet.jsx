import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { stageClient } from '@/api/stageClient';
import AppDirectoryScreen, { DirectoryRow, FilterChips } from '@/components/apps/AppDirectoryScreen';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import { formatSTC, loadWallet, timeAgo, walletTxLabel } from '@/lib/stageDirectories';

const TX_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'income', label: 'In' },
  { id: 'expense', label: 'Out' },
];

export default function WalletScreen() {
  const [wallet, setWallet] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setWallet(await loadWallet());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const collectSalary = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await stageClient.functions.invoke('playerWallet', { action: 'pay_salary' });
      await load();
    } catch (err) {
      Alert.alert('Wallet', err?.message || 'Could not collect salary');
    } finally {
      setBusy(false);
    }
  };

  const txs = (wallet?.transactions || []).filter((tx) => {
    if (filter === 'income') return Number(tx.amount) > 0;
    if (filter === 'expense') return Number(tx.amount) < 0;
    return true;
  });

  return (
    <AppDirectoryScreen
      title="Wallet"
      subtitle={wallet?.player?.gamertag || 'STC balance'}
      chips={TX_FILTERS}
      chipValue={filter}
      onChip={setFilter}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={txs}
      keyExtractor={(item, index) => String(item.id || index)}
      emptyIcon="flash-outline"
      emptyText="No transactions yet"
      ListHeaderComponent={(
        <View style={{ gap: 10, marginBottom: 6 }}>
          <View style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: 'rgba(0,240,255,0.28)',
            backgroundColor: 'rgba(0,240,255,0.08)',
            padding: 18,
          }}
          >
            <Text style={{ color: CYAN, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 }}>STC</Text>
            <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 4 }}>
              {formatSTC(wallet?.balance)}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 6, fontSize: 12 }}>
              Weekly salary {formatSTC(wallet?.weeklySalary)}
              {wallet?.nextSalaryDays != null ? ` · next in ${wallet.nextSalaryDays}d` : ''}
            </Text>
            <TouchableOpacity
              onPress={collectSalary}
              disabled={busy}
              style={{
                marginTop: 14,
                alignSelf: 'flex-start',
                borderRadius: 12,
                backgroundColor: CYAN,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: '#041018', fontWeight: '800' }}>
                {busy ? 'Collecting…' : 'Collect salary'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      renderItem={({ item }) => {
        const amount = Number(item.amount || 0);
        return (
          <DirectoryRow
            title={item.description || walletTxLabel(item.category)}
            subtitle={[walletTxLabel(item.category), timeAgo(item.created_date)].filter(Boolean).join(' · ')}
            fallbackIcon={amount >= 0 ? 'arrow-up-outline' : 'arrow-down-outline'}
            badge={`${amount >= 0 ? '+' : ''}${formatSTC(amount)}`}
            badgeColor={amount >= 0 ? '#34D399' : '#FB7185'}
          />
        );
      }}
    />
  );
}
