import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';
import { Avatar, Card, EmptyState, ErrorState, SkeletonList } from '@/components/ui';
import StatusTag from '@/components/competitions/StatusTag';
import useT from '@/hooks/useT';

function formatMoney(value) {
  return String(Math.round(Number(value) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function OffersWaitingBanner({ count, onPress }) {
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  if (!count) return null;
  const label = count === 1 ? t('stage.mercato.offersWaitingOne') : t('stage.mercato.offersWaiting', { count });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        borderRadius: tokens.cardRadius,
        borderWidth: 1,
        borderColor: tokens.cyan,
        backgroundColor: tokens.card,
      }}
    >
      <Ionicons name="file-tray-outline" size={22} color={tokens.cyan} />
      <Text style={{ flex: 1, color: tokens.text, fontSize: 14 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
    </Pressable>
  );
}

function FeedCard({ item, onOpenPlayer }) {
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const route = [
    item.from || (item.fromIsFree ? t('stage.mercato.freeAgent') : null),
    item.to,
  ].filter(Boolean);
  const sub = [item.position, item.dealType].filter(Boolean).join(' · ');
  const content = (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar initials={item.initials} uri={item.avatarUrl} size={48} round />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 16, fontWeight: '700' }}>{item.name}</Text>
          {sub ? <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12 }}>{sub}</Text> : null}
        </View>
        <StatusTag label={item.statusLabel} tone={item.tone} />
      </View>
      {route.length || item.fee ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {route.length === 2 ? (
            <Text numberOfLines={1} style={{ flex: 1, color: tokens.textSoft, fontSize: 13 }}>
              {route[0]}
              <Text style={{ color: tokens.cyan }}>{'  →  '}</Text>
              <Text style={{ color: tokens.text, fontWeight: '700' }}>{route[1]}</Text>
            </Text>
          ) : (
            <Text numberOfLines={1} style={{ flex: 1, color: tokens.textSoft, fontSize: 13 }}>{route[0] || ''}</Text>
          )}
          {item.fee ? (
            <Text style={{ color: tokens.textSoft, fontSize: 13 }}>
              {t('stage.mercato.fee', { amount: formatMoney(item.fee) })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
  return (
    <Card
      testID={`mercato-feed-${item.id}`}
      accessibilityLabel={item.playerId ? `${item.name}, ${item.statusLabel}` : undefined}
      onPress={item.playerId ? () => onOpenPlayer(item.playerId) : undefined}
    >
      {content}
    </Card>
  );
}

/** Feed tab: the real desk (`/mercato-transfers/desk`), newest first as the server orders it. */
export default function MercatoFeed({ resource, waitingCount = 0, onOpenInbox, onOpenPlayer }) {
  const t = useT();
  const { data, loading, error, refetch } = resource;
  if (loading && !data) return <SkeletonList count={3} lines={2} />;
  if (error && !data) return <ErrorState message={error} onRetry={refetch} />;
  const feed = data?.feed || [];
  return (
    <View style={{ gap: 12 }}>
      {error ? <ErrorState message={error} onRetry={refetch} /> : null}
      {feed.length === 0 ? (
        <EmptyState icon="swap-horizontal-outline" title={t('stage.mercato.feedEmpty')} body={t('stage.mercato.feedEmptyBody')} />
      ) : feed.map((item) => <FeedCard key={item.id} item={item} onOpenPlayer={onOpenPlayer} />)}
      <OffersWaitingBanner count={waitingCount} onPress={onOpenInbox} />
    </View>
  );
}
