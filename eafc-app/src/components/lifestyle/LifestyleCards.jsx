import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';
import { Button, Card } from '@/components/ui';
import StatusTag from '@/components/competitions/StatusTag';
import useT from '@/hooks/useT';
import { describeAsset, shopOffers } from '@/lib/lifestyle';
import { categoryIcon, formatStc } from './lifestyleFormat';

function Tile({ item }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View
      style={{
        width: 72, height: 72, borderRadius: 14, borderWidth: 1, borderColor: tokens.border,
        backgroundColor: tokens.bgDeep, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}
    >
      {item?.image_url ? (
        <Image source={{ uri: item.image_url }} style={{ width: 72, height: 72 }} resizeMode="cover" />
      ) : (
        <Ionicons name={categoryIcon(item?.category)} size={30} color={tokens.cyan} />
      )}
    </View>
  );
}

/** Inline confirm row: spending STC always takes a second tap. */
function ConfirmRow({ message, busy, onConfirm, onCancel }) {
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View style={{ gap: 10 }}>
      <Text accessibilityRole="alert" style={{ color: tokens.text, fontSize: 13, lineHeight: 19 }}>{message}</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button title={t('stage.lifestyle.cancel')} variant="secondary" disabled={busy} onPress={onCancel} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title={t('stage.lifestyle.confirm')} loading={busy} onPress={onConfirm} />
        </View>
      </View>
    </View>
  );
}

function InsufficientRow({ onTopUp }) {
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View style={{ gap: 10 }}>
      <Text accessibilityRole="alert" style={{ color: tokens.warning, fontSize: 13 }}>{t('stage.lifestyle.insufficient')}</Text>
      <Button title={t('stage.lifestyle.topUp')} variant="secondary" icon="flash-outline" onPress={onTopUp} />
    </View>
  );
}

const ACTION_KEYS = { buy: 'confirmBuy', rent: 'confirmRent', invest: 'confirmInvest' };

/** One catalogue item with the actions the server allows for it. */
export function ShopCard({ item, balance, onAct, onTopUp }) {
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const [pending, setPending] = useState(null);
  const [insufficient, setInsufficient] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const offers = shopOffers(item);

  const facts = [];
  if (Number(item.passive_income_stc) > 0) {
    facts.push(t('stage.lifestyle.incomeLine', { amount: formatStc(item.passive_income_stc), days: item.passive_income_interval_days || 7 }));
  }
  if (offers.invest && Number(item.invest_return_rate) > 0) {
    facts.push(t('stage.lifestyle.returnLine', { percent: item.invest_return_rate, days: item.invest_duration_days || 30 }));
  }
  if (offers.rent) {
    facts.push(t('stage.lifestyle.rentLine', { amount: formatStc(offers.rent), days: item.rent_duration_days || 30 }));
  }
  if (Number(item.weekly_maintenance_stc) > 0) {
    facts.push(t('stage.lifestyle.upkeepLine', { amount: formatStc(item.weekly_maintenance_stc) }));
  }
  if (offers.buy && item.can_sell) {
    facts.push(t('stage.lifestyle.sellLine', { percent: item.sell_value_percent || 60 }));
  }

  const start = (action) => {
    setError('');
    const cost = offers[action];
    if (balance != null && cost > balance) {
      setPending(null);
      setInsufficient(true);
      return;
    }
    setInsufficient(false);
    setPending(action);
  };

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onAct(pending, item, offers[pending]);
      setPending(null);
    } catch (err) {
      setError(err?.message || t('stage.state.error'));
    } finally {
      setBusy(false);
    }
  };

  const tier = String(item.tier || '').trim();
  const main = offers.buy ? 'buy' : offers.invest ? 'invest' : null;
  const secondary = ['rent', 'invest'].filter((kind) => offers[kind] && kind !== main);
  return (
    <Card testID={`shop-item-${item.id}`} style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile item={item} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text numberOfLines={2} style={{ flex: 1, color: tokens.text, fontSize: 16, fontWeight: '700' }}>{item.name}</Text>
            {tier ? <StatusTag label={tier.toUpperCase()} tone="info" /> : null}
          </View>
          {facts.length ? (
            <Text style={{ color: tokens.muted, fontSize: 12, lineHeight: 17 }}>{facts.join(' · ')}</Text>
          ) : null}
        </View>
      </View>

      {pending ? (
        <ConfirmRow
          message={t(`stage.lifestyle.${ACTION_KEYS[pending]}`, { name: item.name, amount: formatStc(offers[pending]) })}
          busy={busy}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        />
      ) : insufficient ? (
        <InsufficientRow onTopUp={onTopUp} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ flex: 1, color: tokens.cyan, fontSize: 20, fontWeight: '700' }}>
            {t('stage.lifestyle.amount', { amount: formatStc(offers.buy || offers.invest || offers.rent) })}
          </Text>
          {secondary.map((kind) => (
            <View key={kind} style={{ minWidth: 88 }}>
              <Button title={t(`stage.lifestyle.${kind}`)} variant="secondary" onPress={() => start(kind)} />
            </View>
          ))}
          {main ? (
            <View style={{ minWidth: 100 }}>
              <Button
                title={t(`stage.lifestyle.${main}`).toUpperCase()}
                accessibilityLabel={t(`stage.lifestyle.${main}`)}
                onPress={() => start(main)}
              />
            </View>
          ) : null}
        </View>
      )}
      {error ? <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 13 }}>{error}</Text> : null}
    </Card>
  );
}

function formatDay(date) {
  return date ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

/** One of my assets: what I paid, when it ends, and sell / collect when the server allows it. */
export function AssetCard({ purchase, item, onSell, onCollect }) {
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const info = describeAsset(purchase, item);
  const [confirmSell, setConfirmSell] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const name = purchase.custom_name || purchase.item_name || item?.name || '';

  const run = async (kind, fn) => {
    setBusy(kind);
    setError('');
    try {
      await fn();
      setConfirmSell(false);
    } catch (err) {
      setError(err?.message || t('stage.state.error'));
    } finally {
      setBusy('');
    }
  };

  const kindLabel = info.kind === 'rented' ? t('stage.lifestyle.rented') : info.kind === 'invest' ? t('stage.lifestyle.invested') : t('stage.lifestyle.owned');
  const lines = [t('stage.lifestyle.value', { amount: formatStc(purchase.price_paid_stc) })];
  if (info.kind === 'rented' && info.endsAt) lines.push(t('stage.lifestyle.endsOn', { date: formatDay(info.endsAt) }));
  if (info.kind === 'invest') {
    if (info.endsAt) lines.push(t('stage.lifestyle.maturesOn', { date: formatDay(info.endsAt) }));
    lines.push(t('stage.lifestyle.payout', { amount: formatStc(info.payout) }));
  }
  if (info.weeklyMaintenance) lines.push(t('stage.lifestyle.upkeepLine', { amount: formatStc(info.weeklyMaintenance) }));

  return (
    <Card testID={`asset-${purchase.id}`} style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile item={item || { category: purchase.item_category }} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text numberOfLines={2} style={{ flex: 1, color: tokens.text, fontSize: 16, fontWeight: '700' }}>{name}</Text>
            <StatusTag label={kindLabel.toUpperCase()} tone={info.kind === 'owned' ? 'success' : 'info'} />
          </View>
          <Text style={{ color: tokens.muted, fontSize: 12, lineHeight: 17 }}>{lines.join(' · ')}</Text>
        </View>
      </View>

      {confirmSell ? (
        <ConfirmRow
          message={t('stage.lifestyle.confirmSell', { name, amount: formatStc(info.sellPrice) })}
          busy={busy === 'sell'}
          onConfirm={() => run('sell', () => onSell(purchase, info))}
          onCancel={() => setConfirmSell(false)}
        />
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {info.kind === 'invest' && info.matured ? (
            <View style={{ flex: 1 }}>
              <Button
                title={t('stage.lifestyle.collectInvestment', { amount: formatStc(info.payout) })}
                loading={busy === 'collect'}
                onPress={() => run('collect', () => onCollect(purchase, info))}
              />
            </View>
          ) : null}
          {info.canSell ? (
            <View style={{ flex: 1 }}>
              <Button title={t('stage.lifestyle.sell')} variant="secondary" onPress={() => setConfirmSell(true)} />
            </View>
          ) : null}
        </View>
      )}
      {error ? <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 13 }}>{error}</Text> : null}
    </Card>
  );
}
