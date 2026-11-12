import React, { useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, StatusBar, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/store/themeStore';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import { Button, Card, IconButton, ResourceState, Screen, SectionLabel, SegmentedControl } from '@/components/ui';
import { PageTitle } from '@/components/theme/PageTile';
import useStoreScreen from '@/hooks/useStoreScreen';
import useT, { getStoredLanguage } from '@/hooks/useT';
import { formatStc } from '@/components/lifestyle/lifestyleFormat';
import {
  creditPacks, describePlus, formatPlusDate, outcomeNotice, plusPrices,
} from '@/lib/store';
import {
  cancelStagePlusSubscription,
  completeStoreCheckoutFromUrl,
  startCreditPackCheckout,
  startStagePlusCheckout,
} from '@/lib/stripeCheckout';

function formatPrice(value) {
  return Number(value).toFixed(2);
}

/** Store: STAGE Plus subscription and credit packs. Nothing else is sold here. */
export default function StoreScreen() {
  const router = useRouter();
  const t = useT();
  const language = getStoredLanguage();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const returnParams = useLocalSearchParams();
  const handledReturn = useRef(false);
  const { data, loading, error, refreshing, refetch } = useStoreScreen();
  const [billing, setBilling] = useState('monthly');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(null);

  const showNotice = (n) => setNotice({ ...n, text: t(`stage.store.${n.key}`, n.params) });
  const showError = (text) => setNotice({ tone: 'error', key: 'error', text });

  useEffect(() => {
    const sub = String(returnParams?.sub || '');
    const payment = String(returnParams?.payment || '');
    const sessionId = String(returnParams?.session_id || '');
    if (handledReturn.current || (!sub && !payment)) return;
    handledReturn.current = true;
    const qs = new URLSearchParams({
      ...(sub ? { sub } : {}),
      ...(payment ? { payment } : {}),
      ...(sessionId ? { session_id: sessionId } : {}),
    }).toString();
    (async () => {
      try {
        const outcome = await completeStoreCheckoutFromUrl(`stage://apps/store?${qs}`);
        showNotice(outcomeNotice(outcome, payment ? 'pack' : 'plus'));
        if (outcome.status !== 'cancelled') await refetch();
      } catch (err) {
        showError(err?.message || t('stage.store.checkoutError'));
      } finally {
        router.replace('/apps/store');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnParams?.payment, returnParams?.session_id, returnParams?.sub]);

  const config = data?.config || {};
  const player = data?.player || null;
  const plus = describePlus({ player });
  const prices = plusPrices(config);
  const packs = creditPacks();
  const renewDate = formatPlusDate(plus.renewsAt, language);

  const requirePlayer = () => {
    if (player?.id) return true;
    showError(t('stage.store.needPlayer'));
    return false;
  };

  const run = async (id, kind, start, pack) => {
    if (busy || !requirePlayer()) return;
    setBusy(id);
    setNotice(null);
    try {
      const outcome = await start();
      showNotice(outcomeNotice(outcome, kind, pack));
      if (outcome?.status !== 'cancelled') await refetch();
    } catch (err) {
      showError(err?.message || t('stage.store.checkoutError'));
    } finally {
      setBusy('');
    }
  };

  const subscribe = () => run('plus', 'plus', () => startStagePlusCheckout({ billing }));
  const buyPack = (pack) => run(pack.id, 'pack', () => startCreditPackCheckout(pack), pack);

  const cancelPlus = () => {
    if (plus.state !== 'active' || busy) return;
    Alert.alert(
      t('stage.store.cancelTitle'),
      renewDate ? t('stage.store.cancelBodyDate', { date: renewDate }) : t('stage.store.cancelBody'),
      [
        { text: t('stage.store.keepPlus'), style: 'cancel' },
        {
          text: t('stage.store.confirmCancel'),
          style: 'destructive',
          onPress: async () => {
            setBusy('cancel');
            setNotice(null);
            try {
              await cancelStagePlusSubscription();
              showNotice({ tone: 'neutral', key: 'cancelDone', params: {} });
              await refetch();
            } catch (err) {
              showError(err?.message || t('stage.store.checkoutError'));
            } finally {
              setBusy('');
            }
          },
        },
      ],
    );
  };

  const credits = Number(data?.credits || 0);
  const noticeColor = notice?.tone === 'error' ? tokens.danger : notice?.tone === 'success' ? tokens.success : tokens.textSoft;
  const amber = tokens.warning || tokens.cyan;

  const plusPriceText = billing === 'yearly'
    ? t('stage.store.perYear', { price: formatPrice(prices.yearly) })
    : t('stage.store.perMonth', { price: formatPrice(prices.monthly) });

  const plusLine = plus.state === 'active'
    ? (renewDate ? t('stage.store.activeRenews', { date: renewDate }) : t('stage.store.activeNoDate'))
    : plus.state === 'ending'
      ? (renewDate ? t('stage.store.activeEnds', { date: renewDate }) : t('stage.store.activeNoDate'))
      : null;

  return (
    <Screen
      tabBar={false}
      scroll={!loading}
      style={{ paddingBottom: guideFabClearanceStack(insets.bottom) }}
      refreshControl={loading ? undefined : (
        <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} colors={[tokens.cyan]} />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <IconButton icon="arrow-back" accessibilityLabel={t('stage.state.back')} onPress={() => router.back()} />
        <SectionLabel>{t('stage.store.eyebrow')}</SectionLabel>
        {data ? (
          <View
            accessibilityLabel={t('stage.store.balanceLabel', { credits: formatStc(data.stc ?? credits) })}
            style={{
              height: 44, borderRadius: 999, borderWidth: 1, borderColor: tokens.border, backgroundColor: tokens.card,
              paddingHorizontal: 16, justifyContent: 'center',
            }}
          >
            <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '700' }}>
              {t('stage.store.balance', { credits: formatStc(data.stc ?? credits) })}
            </Text>
          </View>
        ) : <View style={{ width: 44, height: 44 }} />}
      </View>
      <PageTitle title={t('stage.store.title').toUpperCase()} padded={false} />

      <View style={{ gap: 14 }}>
        <ResourceState loading={loading && !data} error={data ? null : error} onRetry={refetch}>
          {data ? (
            <>
              {notice ? (
                <View accessibilityRole="alert" style={{ gap: 8 }}>
                  <Text style={{ color: noticeColor, fontSize: 13 }}>{notice.text}</Text>
                  {notice.tone === 'pending' ? (
                    <View style={{ alignSelf: 'flex-start', minWidth: 140 }}>
                      <Button title={t('stage.store.checkAgain')} variant="secondary" onPress={refetch} />
                    </View>
                  ) : null}
                </View>
              ) : null}

              <Card style={{ gap: 12, borderColor: amber }} testID="plus-card">
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ color: amber, fontSize: 20, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', flexShrink: 1 }}>
                    {config.name || t('stage.store.plusName')}
                  </Text>
                  {plus.state === 'inactive' ? (
                    <View style={{ borderWidth: 1, borderColor: amber, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: amber, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                        {billing === 'yearly' ? t('stage.store.badgeYearly') : t('stage.store.badgeMonthly')}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: tokens.textSoft, fontSize: 13, lineHeight: 19 }}>
                  {config.headline || t('stage.store.plusHeadline')}
                </Text>

                {plus.state === 'inactive' ? (
                  <>
                    <SegmentedControl
                      accessibilityLabel={t('stage.store.billingLabel')}
                      options={[
                        { key: 'monthly', label: t('stage.store.monthly') },
                        { key: 'yearly', label: t('stage.store.yearly') },
                      ]}
                      value={billing}
                      onChange={setBilling}
                    />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ flex: 1, color: tokens.text, fontSize: 24, fontWeight: '800' }}>{plusPriceText}</Text>
                      <View style={{ minWidth: 128 }}>
                        <Button
                          title={t('stage.store.subscribe').toUpperCase()}
                          accessibilityLabel={t('stage.store.subscribe')}
                          loading={busy === 'plus'}
                          disabled={Boolean(busy) && busy !== 'plus'}
                          onPress={subscribe}
                        />
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={{ color: tokens.success, fontSize: 14, fontWeight: '700' }}>{plusLine}</Text>
                    <Button
                      title={plus.state === 'ending' ? t('stage.store.renewalOff') : t('stage.store.cancelRenewal')}
                      variant={plus.state === 'ending' ? 'secondary' : 'danger'}
                      loading={busy === 'cancel'}
                      disabled={plus.state === 'ending' || (Boolean(busy) && busy !== 'cancel')}
                      onPress={cancelPlus}
                    />
                  </>
                )}
              </Card>

              <SectionLabel>{t('stage.store.packsLabel')}</SectionLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {packs.map((pack, index) => {
                  const popular = index === 1;
                  return (
                    <Card
                      key={pack.id}
                      style={{ width: '47%', flexGrow: 1, gap: 8, borderColor: popular ? tokens.cyan : tokens.border }}
                      testID={`pack-${pack.id}`}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: tokens.text, fontSize: 26, fontWeight: '800' }}>{formatStc(pack.credits)}</Text>
                          <Text style={{ color: tokens.textSoft, fontSize: 12 }}>{t('stage.store.packCredits')}</Text>
                        </View>
                        {popular ? (
                          <View style={{ borderRadius: 6, backgroundColor: tokens.bgDeep, paddingHorizontal: 7, paddingVertical: 3 }}>
                            <Text style={{ color: tokens.cyan, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
                              {t('stage.store.popular').toUpperCase()}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Button
                        title={`€${formatPrice(pack.price_eur)}`}
                        accessibilityLabel={t('stage.store.buyPack', { label: pack.label })}
                        loading={busy === pack.id}
                        disabled={Boolean(busy) && busy !== pack.id}
                        onPress={() => buyPack(pack)}
                      />
                    </Card>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Ionicons name="lock-closed-outline" size={16} color={tokens.textSoft} />
                <Text style={{ color: tokens.textSoft, fontSize: 12, flex: 1 }}>{t('stage.store.secure')}</Text>
              </View>
            </>
          ) : null}
        </ResourceState>
      </View>
    </Screen>
  );
}
