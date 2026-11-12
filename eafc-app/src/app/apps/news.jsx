import React, { useState } from 'react';
import { RefreshControl, StatusBar, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/store/themeStore';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import { EmptyState, IconButton, ResourceState, Screen, SectionLabel } from '@/components/ui';
import { PageTitle } from '@/components/theme/PageTile';
import { HeadlineCard, NewsRow, NewsTabs } from '@/components/news/NewsStageParts';
import useNewsFeed from '@/hooks/useNewsFeed';
import useT, { getStoredLanguage } from '@/hooks/useT';
import { newsTimeLabel } from '@/lib/newsFeed';

const TABS = ['world', 'mercato', 'beat'];

function humanize(section) {
  const text = String(section || '').replace(/_/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

export default function NewsScreen() {
  const router = useRouter();
  const t = useT();
  const language = getStoredLanguage();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('world');
  const { data, loading, error, refreshing, refetch } = useNewsFeed(tab);

  const items = data || [];
  const [lead, ...rest] = items;
  const now = Date.now();
  const sectionLabel = (section) => {
    const key = `stage.news.section.${section}`;
    const label = t(key);
    return label === key ? humanize(section) : label;
  };
  const meta = (item) => [sectionLabel(item.section), newsTimeLabel(item.at, now, t, language)].filter(Boolean).join(' · ');

  return (
    <Screen
      tabBar={false}
      style={{ paddingBottom: guideFabClearanceStack(insets.bottom), gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} colors={[tokens.cyan]} />}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="arrow-back" accessibilityLabel={t('stage.state.back')} onPress={() => router.back()} />
        <SectionLabel>{t('stage.news.eyebrow')}</SectionLabel>
        <View style={{ width: 44, height: 44 }} />
      </View>
      <PageTitle title={t('stage.news.title').toUpperCase()} padded={false} />
      <NewsTabs
        accessibilityLabel={t('stage.news.tabsLabel')}
        tabs={TABS.map((key) => ({ key, label: t(`stage.news.${key}`) }))}
        value={tab}
        onChange={setTab}
      />

      <ResourceState
        loading={loading}
        error={error && !items.length ? error : null}
        onRetry={refetch}
        isEmpty={items.length === 0}
        empty={<EmptyState icon="newspaper-outline" title={t('stage.news.empty')} body={t('stage.news.emptyBody')} />}
      >
        {lead ? (
          <HeadlineCard item={lead} kicker={t('stage.news.headline')} time={newsTimeLabel(lead.at, now, t, language)} />
        ) : null}
        <View>
          {rest.map((item, index) => (
            <NewsRow key={item.id} item={item} meta={meta(item)} last={index === rest.length - 1} />
          ))}
        </View>
      </ResourceState>
    </Screen>
  );
}
