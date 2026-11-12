import React, { useMemo, useState } from 'react';
import { RefreshControl, StatusBar, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/store/themeStore';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import {
  Button, Card, Chip, EmptyState, IconButton, ResourceState, Screen, SectionLabel,
} from '@/components/ui';
import { AssetCard, ShopCard } from '@/components/lifestyle/LifestyleCards';
import { countdownText, formatStc } from '@/components/lifestyle/lifestyleFormat';
import { NewsTabs } from '@/components/news/NewsStageParts';
import useLifestyle from '@/hooks/useLifestyle';
import useT from '@/hooks/useT';
import {
  buyItem, collectInvestment, collectPassiveIncome, filterShop, investInItem,
  passiveIncomeStatus, rentItem, sellAsset,
} from '@/lib/lifestyle';

const FILTERS = ['all', 'buy', 'rent', 'invest'];
const ACT = { buy: buyItem, rent: rentItem, invest: investInItem };
const DONE_KEY = { buy: 'bought', rent: 'rented2', invest: 'invested2' };

/** Lifestyle: shop (buy / rent / invest), my assets, passive income to collect. */
export default function LifestyleScreen() {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { data, loading, error, refreshing, refetch } = useLifestyle();
  const [tab, setTab] = useState('shop');
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [collectError, setCollectError] = useState('');

  const items = data?.items || [];
  const purchases = data?.purchases || [];
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const shop = useMemo(() => filterShop(items, filter), [items, filter]);
  const passive = useMemo(() => passiveIncomeStatus(purchases, items), [purchases, items]);

  const sections = [
    { key: 'shop', label: t('stage.lifestyle.shop') },
    { key: 'assets', label: purchases.length ? t('stage.lifestyle.myAssetsCount', { count: purchases.length }) : t('stage.lifestyle.myAssets') },
  ];

  const topUp = () => router.push('/apps/store');

  const act = async (kind, item, cost) => {
    await ACT[kind](item.id);
    setNotice(t(`stage.lifestyle.${DONE_KEY[kind]}`, { name: item.name, amount: formatStc(cost) }));
    await refetch();
  };

  const sell = async (purchase, info) => {
    const name = purchase.custom_name || purchase.item_name || '';
    await sellAsset(purchase.id);
    setNotice(t('stage.lifestyle.sold', { name, amount: formatStc(info.sellPrice) }));
    await refetch();
  };

  const collectInvest = async (purchase, info) => {
    await collectInvestment(purchase.id);
    setNotice(t('stage.lifestyle.collectedInvestment', { amount: formatStc(info.payout) }));
    await refetch();
  };

  const collect = async () => {
    setCollecting(true);
    setCollectError('');
    try {
      const result = await collectPassiveIncome();
      setNotice(t('stage.lifestyle.collectedPassive', { amount: formatStc(result.collected || 0) }));
      await refetch();
    } catch (err) {
      setCollectError(err?.message || t('stage.state.error'));
    } finally {
      setCollecting(false);
    }
  };

  const balanceChip = data?.balance != null ? (
    <View
      accessibilityLabel={t('stage.lifestyle.balanceLabel', { amount: formatStc(data.balance) })}
      style={{
        height: 44, borderRadius: 999, borderWidth: 1, borderColor: tokens.border, backgroundColor: tokens.card,
        paddingHorizontal: 16, justifyContent: 'center',
      }}
    >
      <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '700' }}>
        {t('stage.lifestyle.amount', { amount: formatStc(data.balance) })}
      </Text>
    </View>
  ) : null;

  const noPlayer = Boolean(data) && !data.player;

  return (
    <Screen
      tabBar={false}
      scroll={!loading}
      style={{ paddingBottom: guideFabClearanceStack(insets.bottom) }}
      refreshControl={loading ? undefined : (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setNotice(''); refetch(); }}
          tintColor={tokens.cyan}
          colors={[tokens.cyan]}
        />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <IconButton icon="arrow-back" accessibilityLabel={t('stage.state.back')} onPress={() => router.back()} />
        <SectionLabel>{t('stage.lifestyle.title')}</SectionLabel>
        {balanceChip || <View style={{ width: 44, height: 44 }} />}
      </View>

      <View style={{ gap: 14 }}>
        <ResourceState loading={loading && !data} error={data ? null : error} onRetry={refetch}>
          {noPlayer ? (
            <EmptyState icon="person-outline" title={t('stage.lifestyle.noPlayer')} />
          ) : (
            <>
              {passive.readyAmount > 0 ? (
                <Card
                  highlight
                  testID="passive-ready"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderColor: tokens.success,
                    backgroundColor: tokens.successBg || tokens.card,
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>{t('stage.lifestyle.passiveReady')}</Text>
                    <Text style={{ color: tokens.textSoft, fontSize: 13 }}>
                      {passive.readyCount === 1
                        ? t('stage.lifestyle.passiveFromOne', { amount: formatStc(passive.readyAmount) })
                        : t('stage.lifestyle.passiveFrom', { count: passive.readyCount, amount: formatStc(passive.readyAmount) })}
                    </Text>
                  </View>
                  <View style={{ minWidth: 108 }}>
                    <Button title={t('stage.lifestyle.collect').toUpperCase()} accessibilityLabel={t('stage.lifestyle.collect')} loading={collecting} onPress={collect} />
                  </View>
                </Card>
              ) : passive.hasIncome && passive.nextAt ? (
                <Card testID="passive-next">
                  <Text style={{ color: tokens.textSoft, fontSize: 13 }}>
                    {t('stage.lifestyle.passiveNext', { time: countdownText(passive.nextAt, t) })}
                  </Text>
                </Card>
              ) : null}
              {collectError ? <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 13 }}>{collectError}</Text> : null}

              {notice ? <Text accessibilityRole="alert" style={{ color: tokens.success, fontSize: 13 }}>{notice}</Text> : null}

              <NewsTabs
                accessibilityLabel={t('stage.lifestyle.tabsLabel')}
                tabs={sections}
                value={tab}
                onChange={setTab}
              />

              {tab === 'shop' ? (
                <>
                  <View accessibilityLabel={t('stage.lifestyle.filtersLabel')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {FILTERS.map((key) => (
                      <Chip key={key} label={t(`stage.lifestyle.${key}`)} active={filter === key} onPress={() => setFilter(key)} />
                    ))}
                  </View>
                  {shop.length === 0 ? (
                    <EmptyState
                      icon="bag-handle-outline"
                      title={items.length === 0 ? t('stage.lifestyle.emptyShopAll') : t('stage.lifestyle.emptyShop')}
                    />
                  ) : shop.map((item) => (
                    <ShopCard key={item.id} item={item} balance={data?.balance ?? null} onAct={act} onTopUp={topUp} />
                  ))}
                </>
              ) : purchases.length === 0 ? (
                <EmptyState
                  icon="home-outline"
                  title={t('stage.lifestyle.emptyAssets')}
                  body={t('stage.lifestyle.emptyAssetsBody')}
                />
              ) : purchases.map((purchase) => (
                <AssetCard
                  key={purchase.id}
                  purchase={purchase}
                  item={itemById.get(purchase.item_id) || null}
                  onSell={sell}
                  onCollect={collectInvest}
                />
              ))}
            </>
          )}
        </ResourceState>
      </View>
    </Screen>
  );
}
