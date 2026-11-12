import React from 'react';
import { Text, View } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { Avatar, Card, EmptyState, ErrorState, SkeletonList } from '@/components/ui';
import StatusTag from '@/components/competitions/StatusTag';
import useT from '@/hooks/useT';
import { OffersWaitingBanner } from './MercatoFeed';

const TONE = { active: 'success', rejected: 'danger', cancelled: 'danger', terminated: 'danger' };

function OfferCard({ offer, onPress }) {
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const status = t(`stage.mercato.offerStatus.${offer.status}`);
  const statusText = status.startsWith('stage.') ? offer.status.replace(/_/g, ' ') : status;
  const name = offer.counterpart || t('stage.mercato.unknownParty');
  const direction = offer.direction === 'received' ? t('stage.mercato.received') : t('stage.mercato.sent');
  const sub = [direction, offer.typeLabel, offer.weeklyWage ? t('stage.mercato.wagePerWeek', { amount: offer.weeklyWage }) : null]
    .filter(Boolean).join(' · ');
  return (
    <Card testID={`mercato-offer-${offer.id}`} accessibilityLabel={`${name}, ${statusText}`} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar initials={String(offer.counterpart || '?').slice(0, 2).toUpperCase()} size={44} round />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>{name}</Text>
          <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12 }}>{sub}</Text>
        </View>
        <StatusTag label={statusText} tone={offer.live ? 'warning' : (TONE[offer.status] || 'info')} />
      </View>
    </Card>
  );
}

/** My offers tab: contract offers I received and offers my club sent. */
export default function MyOffersView({ resource, waitingCount = 0, onOpenInbox, onOpenOffer }) {
  const t = useT();
  const { data, loading, error, refetch } = resource;
  if (loading && !data) return <SkeletonList count={3} lines={2} />;
  if (error && !data) return <ErrorState message={error} onRetry={refetch} />;
  const offers = data || [];
  return (
    <View style={{ gap: 12 }}>
      {error ? <ErrorState message={error} onRetry={refetch} /> : null}
      {offers.length === 0 ? (
        <EmptyState icon="document-text-outline" title={t('stage.mercato.offersEmpty')} body={t('stage.mercato.offersEmptyBody')} />
      ) : offers.map((offer) => <OfferCard key={offer.id} offer={offer} onPress={() => onOpenOffer(offer)} />)}
      <OffersWaitingBanner count={waitingCount} onPress={onOpenInbox} />
    </View>
  );
}
