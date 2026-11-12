import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StatusBar, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/store/themeStore';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import { EmptyState, IconButton, ResourceState, Screen, SectionLabel } from '@/components/ui';
import { PageTitle } from '@/components/theme/PageTile';
import useNotificationsFeed from '@/hooks/useNotificationsFeed';
import useT, { getStoredLanguage } from '@/hooks/useT';
import { markNotificationRead } from '@/lib/inboxData';
import {
  groupNotifications, iconForType, notificationTimeLabel,
} from '@/lib/notificationsFeed';

function NotificationRow({ item, language, onPress }) {
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[item.title, item.body].filter(Boolean).join('. ')}
      onPress={() => onPress(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        minHeight: 64,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
      }}
    >
      <View
        style={{
          width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: tokens.border,
          backgroundColor: tokens.card, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name={iconForType(item.type)} size={22} color={item.unread ? tokens.cyan : tokens.textSoft} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>{item.title}</Text>
        {item.body ? <Text style={{ color: tokens.textSoft, fontSize: 13, lineHeight: 18 }}>{item.body}</Text> : null}
        <Text style={{ color: tokens.muted, fontSize: 12 }}>
          {notificationTimeLabel(item.created_date || item.created_at, Date.now(), language)}
        </Text>
      </View>
      {item.unread ? (
        <View
          accessibilityLabel={t('stage.notifications.unread')}
          style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.cyan, marginTop: 6 }}
        />
      ) : null}
    </Pressable>
  );
}

/** Notifications list, reached from the Home bell. Read state lives on the server. */
export default function NotificationsScreen() {
  const router = useRouter();
  const t = useT();
  const language = getStoredLanguage();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { data, loading, error, refreshing, refetch } = useNotificationsFeed();
  const [readIds, setReadIds] = useState(() => new Set());
  const [markError, setMarkError] = useState('');
  const [marking, setMarking] = useState(false);

  const items = useMemo(
    () => (data || []).map((n) => (readIds.has(n.id) ? { ...n, unread: false } : n)),
    [data, readIds],
  );
  const groups = useMemo(() => groupNotifications(items), [items]);
  const unread = items.filter((n) => n.unread);

  const open = async (item) => {
    if (item.unread) {
      setReadIds((prev) => new Set(prev).add(item.id));
      await markNotificationRead(item).catch(() => {});
    }
    if (item.href) router.push(item.href);
  };

  // The server has no "mark all read" route: one call per unread notification, then reload the truth.
  const markAll = async () => {
    if (marking || unread.length === 0) return;
    setMarking(true);
    setMarkError('');
    try {
      await Promise.all(unread.map((n) => markNotificationRead(n)));
      setReadIds((prev) => new Set([...prev, ...unread.map((n) => n.id)]));
      await refetch();
      setReadIds(new Set());
    } catch (err) {
      setMarkError(err?.message || t('stage.notifications.markFailed'));
    } finally {
      setMarking(false);
    }
  };

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
        <SectionLabel>{t('stage.notifications.title')}</SectionLabel>
        <IconButton
          icon="options-outline"
          accessibilityLabel={t('stage.notifications.settings')}
          onPress={() => router.push('/apps/notification-settings')}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flexShrink: 1 }}>
          <PageTitle title={t('stage.notifications.title').toUpperCase()} padded={false} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('stage.notifications.markAllRead')}
          accessibilityState={{ disabled: unread.length === 0 || marking }}
          onPress={markAll}
          hitSlop={8}
          style={{ minHeight: 44, justifyContent: 'center', opacity: unread.length === 0 ? 0.4 : 1, maxWidth: 110 }}
        >
          <Text style={{ color: tokens.cyan, fontSize: 14, fontWeight: '700', textAlign: 'right' }}>
            {t('stage.notifications.markAllRead')}
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 10 }}>
        {markError ? <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 13 }}>{markError}</Text> : null}
        <ResourceState loading={loading && !data} error={data ? null : error} onRetry={refetch}>
          {groups.length === 0 ? (
            <EmptyState icon="notifications-outline" title={t('stage.notifications.empty')} body={t('stage.notifications.emptyBody')} />
          ) : groups.map((group) => (
            <View key={group.key} style={{ marginTop: 8 }}>
              <SectionLabel>{t(`stage.notifications.${group.key}`)}</SectionLabel>
              {group.items.map((item) => (
                <NotificationRow key={item.id} item={item} language={language} onPress={open} />
              ))}
            </View>
          ))}
        </ResourceState>
      </View>
    </Screen>
  );
}
