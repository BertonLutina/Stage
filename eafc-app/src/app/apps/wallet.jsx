import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, StatusBar, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { Button, Card, EmptyState, ErrorState, IconButton, ResourceState, Screen, SectionLabel } from '@/components/ui';
import useT from '@/hooks/useT';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { formatSTC, loadWallet, timeAgo, walletTxLabel } from '@/lib/stageDirectories';

function QuickAction({ icon, label, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ alignItems: 'center', gap: 8, flex: 1, minHeight: 44 }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.card,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={26} color={tokens.cyan} />
      </View>
      <Text style={{ color: tokens.textSoft, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

function monthDelta(transactions) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  let sum = 0;
  for (const tx of transactions || []) {
    const at = tx?.created_date ? new Date(tx.created_date) : null;
    if (!at || Number.isNaN(at.getTime()) || at < start) continue;
    sum += Number(tx.amount) || 0;
  }
  return sum;
}

export default function WalletScreen() {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setWallet(await loadWallet());
      setError('');
    } catch (err) {
      setError(err?.message || t('stage.wallet.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const txs = wallet?.transactions || [];
  const delta = useMemo(() => monthDelta(txs), [txs]);
  const deltaLabel = `${delta >= 0 ? '+' : ''}${formatSTC(delta)} STC this month`;

  return (
    <Screen
      tabBar={false}
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={tokens.cyan}
          colors={[tokens.cyan]}
        />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <IconButton icon="arrow-back" accessibilityLabel="Back" onPress={() => router.back()} />
        <SectionLabel>Wallet</SectionLabel>
        <View style={{ width: 44, height: 44 }} />
      </View>

      <ResourceState
        loading={loading && !wallet}
        error={wallet ? null : error}
        onRetry={() => { setError(''); setLoading(true); load(); }}
      >
        {wallet ? (
          <View style={{ gap: 16 }}>
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
                  {formatSTC(wallet.balance)}
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
              <Text style={{ color: tokens.muted, fontSize: 13 }}>{deltaLabel}</Text>
              <Text numberOfLines={2} style={{ color: tokens.muted, fontSize: 13 }}>
                Weekly salary {formatSTC(wallet.weeklySalary)}
                {wallet.nextSalaryDays != null ? ` · next in ${wallet.nextSalaryDays}d` : ''}
              </Text>
              <View style={{ marginTop: 12 }}>
                <Button
                  title={busy ? 'Collecting…' : 'Collect salary'}
                  accessibilityLabel="Collect salary"
                  icon="cash-outline"
                  onPress={collectSalary}
                  disabled={busy}
                />
              </View>
            </Card>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <QuickAction icon="add" label={t('stage.wallet.topUp')} onPress={() => router.push('/apps/store')} />
              <QuickAction icon="download-outline" label={t('stage.wallet.collect')} onPress={() => router.push('/apps/lifestyle')} />
              <QuickAction icon="bag-outline" label={t('stage.wallet.store')} onPress={() => router.push('/apps/store')} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <SectionLabel>Activity</SectionLabel>
              <Text style={{ color: tokens.muted, fontSize: 12 }}>{t('stage.wallet.thisMonth')}</Text>
            </View>

            {txs.length === 0 ? (
              <EmptyState icon="flash-outline" title="No transactions yet" />
            ) : txs.map((item) => {
              const amount = Number(item.amount || 0);
              return (
                <View
                  key={String(item.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: tokens.border,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: tokens.border,
                      backgroundColor: tokens.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={amount >= 0 ? 'trophy-outline' : 'bag-outline'}
                      size={20}
                      color={amount >= 0 ? tokens.success : tokens.danger}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>
                      {item.description || walletTxLabel(item.category)}
                    </Text>
                    <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12 }}>
                      {[walletTxLabel(item.category), timeAgo(item.created_date)].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Text style={{ color: amount >= 0 ? tokens.success : tokens.danger, fontSize: 16, fontWeight: '700' }}>
                    {`${amount >= 0 ? '+' : ''}${formatSTC(amount)}`}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </ResourceState>
    </Screen>
  );
}
