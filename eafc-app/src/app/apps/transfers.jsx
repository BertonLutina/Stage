import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, View } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { IconButton, Screen, SectionLabel } from '@/components/ui';
import { NewsTabs } from '@/components/news/NewsStageParts';
import { useTransferWindowStatus } from '@/hooks/useTransferWindowStatus';
import { useMercatoDesk, useMyOffers } from '@/hooks/useMercato';
import useT from '@/hooks/useT';
import { summarizeOffers } from '@/lib/mercato';
import MercatoWindowBanner from '@/components/mercato/MercatoWindowBanner';
import MercatoFeed from '@/components/mercato/MercatoFeed';
import MyOffersView from '@/components/mercato/MyOffersView';
import FreeAgentsView from '@/components/mercato/FreeAgentsView';

/** Mercato: transfer window, deal feed, free agents (the former Transfers hub) and my offers. */
export default function MercatoScreen() {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const { currentWindow, loading: windowLoading } = useTransferWindowStatus();
  const desk = useMercatoDesk();
  const offers = useMyOffers();
  const [tab, setTab] = useState('feed');

  const { liveCount, waitingCount } = useMemo(() => summarizeOffers(offers.data || []), [offers.data]);

  const sections = useMemo(() => [
    { key: 'feed', label: t('stage.mercato.feed') },
    { key: 'free', label: t('stage.mercato.freeAgents') },
    { key: 'offers', label: liveCount ? t('stage.mercato.myOffersCount', { count: liveCount }) : t('stage.mercato.myOffers') },
  ], [t, liveCount]);

  const openInbox = () => router.push('/apps/inbox');
  const openPlayer = (playerId) => router.push({
    pathname: '/(tabs)/profile/profilescreen',
    params: { playerId: String(playerId) },
  });
  const openOffer = (offer) => {
    if (offer.direction === 'received' && offer.live) openInbox();
    else if (offer.playerId) openPlayer(offer.playerId);
  };

  const refresh = (resource) => (
    <RefreshControl
      refreshing={Boolean(resource.refreshing)}
      onRefresh={resource.refetch}
      tintColor={tokens.cyan}
      colors={[tokens.cyan]}
    />
  );

  return (
    <Screen scroll={false} tabBar={false} guideFab>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flex: 1, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel={t('stage.state.back')} />
          <SectionLabel>{t('stage.mercato.title')}</SectionLabel>
          <View style={{ width: 44, height: 44 }} />
        </View>

        <MercatoWindowBanner window={currentWindow} loading={windowLoading} />
        <NewsTabs
          accessibilityLabel={t('stage.mercato.tabsLabel')}
          tabs={sections}
          value={tab}
          onChange={setTab}
        />

        {tab === 'free' ? (
          <FreeAgentsView currentWindow={currentWindow} />
        ) : tab === 'offers' ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={refresh(offers)}
            showsVerticalScrollIndicator={false}
          >
            <MyOffersView
              resource={offers}
              waitingCount={waitingCount}
              onOpenInbox={openInbox}
              onOpenOffer={openOffer}
            />
          </ScrollView>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={refresh(desk)}
            showsVerticalScrollIndicator={false}
          >
            <MercatoFeed
              resource={desk}
              waitingCount={waitingCount}
              onOpenInbox={openInbox}
              onOpenPlayer={openPlayer}
            />
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}
