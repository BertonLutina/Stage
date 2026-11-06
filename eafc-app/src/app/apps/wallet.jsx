import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { Button, Card, SectionLabel } from '@/components/ui';
import AppDirectoryScreen, { DirectoryRow } from '@/components/apps/AppDirectoryScreen';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { formatSTC, loadWallet, timeAgo, walletTxLabel } from '@/lib/stageDirectories';

const TX_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'income', label: 'In' },
  { id: 'expense', label: 'Out' },
];

export default function WalletScreen() {
  const tokens = useThemeStore((s) => s.tokens);
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
        <View style={{ gap: 16, marginBottom: 6 }}>
          <Card highlight style={{ paddingVertical: 22, paddingHorizontal: 20, gap: 6 }}>
            <SectionLabel>Your balance</SectionLabel>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                style={{
                  flexShrink: 1,
                  color: tokens.text,
                  fontFamily: FONT_EA_SPORTS,
                  fontSize: 54,
                  lineHeight: 58,
                  letterSpacing: 54 * 0.03,
                  textTransform: 'uppercase',
                }}
              >
                {formatSTC(wallet?.balance)}
              </Text>
              <Text
                style={{
                  color: tokens.cyan,
                  fontFamily: FONT_EA_SPORTS,
                  fontSize: 22,
                  letterSpacing: 22 * 0.03,
                  textTransform: 'uppercase',
                }}
              >
                STC
              </Text>
            </View>
            <Text numberOfLines={2} style={{ color: tokens.muted, fontSize: 13 }}>
              Weekly salary {formatSTC(wallet?.weeklySalary)}
              {wallet?.nextSalaryDays != null ? ` · next in ${wallet.nextSalaryDays}d` : ''}
            </Text>
            <View style={{ marginTop: 12 }}>
              <Button
                title={busy ? 'Collecting…' : 'Collect salary'}
                icon="cash-outline"
                onPress={collectSalary}
                disabled={busy}
              />
            </View>
          </Card>
          <SectionLabel>Activity</SectionLabel>
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
            badgeColor={amount >= 0 ? tokens.success : tokens.danger}
          />
        );
      }}
    />
  );
}
