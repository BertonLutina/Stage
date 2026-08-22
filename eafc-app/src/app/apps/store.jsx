import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AppDirectoryScreen, { DirectoryRow, FilterChips } from '@/components/apps/AppDirectoryScreen';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import { hasStagePlus } from '@/lib/subscriptionUtils';
import {
  CREDIT_PACKS,
  STAGE_PLUS_MONTHLY_CREDITS,
  STAGE_PLUS_PRICE,
  loadStore,
} from '@/lib/stageDirectories';
import {
  cancelStagePlusSubscription,
  completeStoreCheckoutFromUrl,
  startCreditPackCheckout,
  startStagePlusCheckout,
} from '@/lib/stripeCheckout';

export default function StoreScreen() {
  const router = useRouter();
  const returnParams = useLocalSearchParams();
  const handledReturn = useRef(false);
  const [store, setStore] = useState(null);
  const [tab, setTab] = useState('plus');
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setStore(await loadStore());
    } catch (err) {
      setError(err?.message || 'Failed to load store');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const sub = String(returnParams.sub || '');
    const payment = String(returnParams.payment || '');
    const sessionId = String(returnParams.session_id || '');
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
        if (outcome.status === 'activated') {
          setMessage(payment === 'success'
            ? (outcome.data?.credits_added ? `+${outcome.data.credits_added} credits added.` : 'Credits added.')
            : 'STAGE Plus activated.');
          await load();
        } else if (outcome.status === 'cancelled') {
          setError('Checkout cancelled.');
        } else {
          setMessage('Payment received — pull to refresh if it is not visible yet.');
          await load();
        }
      } catch (err) {
        setError(err?.message || 'Could not finish checkout');
      } finally {
        router.replace('/apps/store');
      }
    })();
  }, [load, returnParams.payment, returnParams.session_id, returnParams.sub, router]);

  const config = store?.config || {};
  const player = store?.player || null;
  const plusActive = hasStagePlus(player?.subscription);
  const plusCancelling = Number(player?.subscription_cancel_at_period_end) === 1;
  const expiresLabel = player?.subscription_expires_at
    ? new Date(player.subscription_expires_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : null;
  const monthlyPrice = Number(config.stage_plus_monthly_price || STAGE_PLUS_PRICE.monthly);
  const yearlyPrice = Number(config.stage_plus_yearly_price || STAGE_PLUS_PRICE.yearly);
  const price = billing === 'yearly' ? yearlyPrice : monthlyPrice;

  const requirePlayer = () => {
    if (player?.id) return true;
    setError('Create a player profile first.');
    return false;
  };

  const buyPlus = async () => {
    if (!requirePlayer()) return;
    if (plusActive && player?.subscription_expires_at && new Date(player.subscription_expires_at) > new Date()) {
      setError(expiresLabel ? `STAGE Plus is active until ${expiresLabel}.` : 'STAGE Plus is already active.');
      return;
    }
    setPurchasing('plus');
    setError('');
    setMessage('');
    try {
      const outcome = await startStagePlusCheckout({ billing });
      if (outcome.status === 'activated') {
        setMessage('STAGE Plus activated.');
        await load();
      } else if (outcome.status === 'cancelled') {
        setError('Checkout cancelled.');
      } else {
        setMessage('Payment received — STAGE Plus will appear shortly. Pull to refresh.');
        await load();
      }
    } catch (err) {
      setError(err?.message || 'Checkout error');
    } finally {
      setPurchasing('');
    }
  };

  const buyPack = async (pack) => {
    if (!requirePlayer()) return;
    setPurchasing(pack.id);
    setError('');
    setMessage('');
    try {
      const outcome = await startCreditPackCheckout(pack);
      if (outcome.status === 'activated') {
        setMessage(`+${outcome.data?.credits_added || pack.credits} credits added.`);
        await load();
      } else if (outcome.status === 'cancelled') {
        setError('Checkout cancelled.');
      } else {
        setMessage('Payment received — credits will appear shortly. Pull to refresh.');
        await load();
      }
    } catch (err) {
      setError(err?.message || 'Checkout error');
    } finally {
      setPurchasing('');
    }
  };

  const cancelPlus = () => {
    if (!plusActive || plusCancelling) return;
    Alert.alert(
      'Cancel STAGE Plus',
      expiresLabel
        ? `You keep Plus until ${expiresLabel}. Stripe will not renew after that.`
        : 'You keep Plus until the end of the current period. Stripe will not renew after that.',
      [
        { text: 'Keep Plus', style: 'cancel' },
        {
          text: 'Cancel renewal',
          style: 'destructive',
          onPress: async () => {
            setPurchasing('cancel');
            setError('');
            try {
              await cancelStagePlusSubscription();
              setMessage('STAGE Plus will end at the current period.');
              await load();
            } catch (err) {
              setError(err?.message || 'Could not cancel STAGE Plus');
            } finally {
              setPurchasing('');
            }
          },
        },
      ],
    );
  };

  return (
    <AppDirectoryScreen
      title="Store"
      subtitle={`${store?.credits || 0} credits · ${store?.stc || 0} STC`}
      chips={[
        { id: 'plus', label: 'STAGE Plus' },
        { id: 'credits', label: 'Credits' },
      ]}
      chipValue={tab}
      onChip={setTab}
      extraFilters={tab === 'plus' ? (
        <FilterChips
          options={[{ id: 'monthly', label: 'Monthly' }, { id: 'yearly', label: 'Yearly' }]}
          value={billing}
          onChange={setBilling}
        />
      ) : null}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={tab === 'credits' ? CREDIT_PACKS : [{ id: 'stage-plus' }]}
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
            {config.description || 'Unlock official competitions, custom player card backgrounds, club stats tile backgrounds, uploads, and a monthly credit refresh.'}
          </Text>
          {plusActive ? (
            <Text style={{ color: CYAN, fontSize: 12, fontWeight: '800', marginTop: 10 }}>
              {plusCancelling && expiresLabel
                ? `Active until ${expiresLabel} · renewal off`
                : expiresLabel
                  ? `Active until ${expiresLabel}`
                  : 'STAGE Plus is active'}
            </Text>
          ) : null}
          {message ? (
            <Text style={{ color: CYAN, fontSize: 12, marginTop: 10 }}>{message}</Text>
          ) : null}
          {error ? (
            <Text style={{ color: '#ff8fa3', fontSize: 12, marginTop: 10 }}>{error}</Text>
          ) : null}
        </View>
      )}
      renderItem={({ item }) => (
        tab === 'plus' ? (
          <DirectoryRow
            title="STAGE Plus"
            subtitle={plusActive
              ? `${STAGE_PLUS_MONTHLY_CREDITS} credits / month`
              : `${STAGE_PLUS_MONTHLY_CREDITS} credits / month · ${billing}`}
            fallbackIcon="sparkles-outline"
            badge={purchasing === 'plus' || purchasing === 'cancel' ? '…' : `€${price}`}
            actionLabel={purchasing ? 'Please wait' : plusActive ? (plusCancelling ? 'Renewal off' : 'Cancel renewal') : 'Subscribe'}
            onAction={purchasing ? undefined : (plusActive ? cancelPlus : buyPlus)}
            onPress={purchasing ? undefined : (plusActive ? cancelPlus : buyPlus)}
          />
        ) : (
          <DirectoryRow
            title={item.label}
            subtitle={`${item.credits} credits`}
            fallbackIcon="diamond-outline"
            badge={purchasing === item.id ? '…' : `€${item.price_eur}`}
            actionLabel={purchasing === item.id ? 'Please wait' : 'Buy'}
            onAction={purchasing ? undefined : () => buyPack(item)}
            onPress={purchasing ? undefined : () => buyPack(item)}
          />
        )
      )}
    />
  );
}
