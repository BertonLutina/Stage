import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { stageClient } from '@/api/stageClient';
import { loadInboxMessages, markAllInboxRead } from '@/lib/inboxData';
import { inboxMessageNeedsAction, upsertInboxMessage } from '@/lib/inboxHelpers';
import InboxMessageList from '@/components/inbox/InboxMessageList';
import { Chip, IconButton, Screen, SectionLabel } from '@/components/ui';
import { PageTitle } from '@/components/theme/PageTile';

/**
 * Inbox — Outlook-style list (Stage theme). Deep-link: /apps/inbox?id=
 */
export default function InboxScreen() {
  const router = useRouter();
  const tokens = useThemeStore((st) => st.tokens);
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [email, setEmail] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const openMessage = useCallback((msg) => {
    if (!msg?.id) return;
    router.push({ pathname: '/apps/inbox/[id]', params: { id: String(msg.id) } });
  }, [router]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await loadInboxMessages();
      setEmail(data.email);
      setMessages(data.messages || []);
      const deepId = params?.id ? String(params.id) : null;
      if (deepId && data.messages?.length) {
        const target = data.messages.find((m) => String(m.id) === deepId);
        if (target) {
          router.replace({ pathname: '/apps/inbox/[id]', params: { id: deepId } });
        }
      }
    } catch (err) {
      setMessages([]);
      setError(err?.message || 'Failed to load inbox');
    }
  }, [params?.id, router]);

  useEffect(() => {
    let cancelled = false;
    let unsub = null;
    let intervalId = null;

    (async () => {
      setLoading(true);
      await load();
      if (cancelled) return;
      setLoading(false);

      unsub = stageClient.entities.InboxMessage.subscribe((event) => {
        const recipient = String(event.data?.recipient_email || '').trim().toLowerCase();
        if (event.type === 'delete') {
          setMessages((prev) => upsertInboxMessage(prev, event));
          return;
        }
        if (email && recipient && recipient !== email) return;
        setMessages((prev) => upsertInboxMessage(prev, event));
      });

      intervalId = setInterval(async () => {
        if (cancelled || !email) return;
        const latest = await stageClient.entities.InboxMessage
          .filter({ recipient_email: email }, '-created_date', 200)
          .catch(() => null);
        if (latest) setMessages(latest);
      }, 15000);
    })();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (typeof unsub === 'function') unsub();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-subscribe when email known — reload once after first load sets email
  useEffect(() => {
    if (!email) return undefined;
    const unsub = stageClient.entities.InboxMessage.subscribe((event) => {
      const recipient = String(event.data?.recipient_email || '').trim().toLowerCase();
      if (event.type !== 'delete' && recipient && recipient !== email) return;
      setMessages((prev) => upsertInboxMessage(prev, event));
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [email]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onMarkAll = async () => {
    const next = await markAllInboxRead(messages);
    setMessages(next);
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;
  const actionCount = messages.filter((m) => inboxMessageNeedsAction(m)).length;
  const visibleMessages = messages.filter((message) => {
    if (filter === 'action') return inboxMessageNeedsAction(message);
    if (filter === 'unread') return !message.is_read;
    return true;
  });

  if (loading) {
    return (
      <Screen scroll={false} tabBar={false} guideFab>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.cyan} size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} tabBar={false} guideFab>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flex: 1, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon="arrow-back" accessibilityLabel="Back" onPress={() => router.back()} />
          <SectionLabel>Inbox</SectionLabel>
          {unreadCount > 0 ? (
            <IconButton icon="checkmark-done" accessibilityLabel="Mark all as read" onPress={onMarkAll} />
          ) : (
            <View style={{ width: 44, height: 44 }} />
          )}
        </View>

        {error ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: tokens.danger }}>{error}</Text>
            <Chip label="Retry" onPress={load} />
          </View>
        ) : null}

        <PageTitle title="INBOX" padded={false} style={{ paddingBottom: 0 }} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip testID="inbox-filter-all" label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip
            testID="inbox-filter-action"
            label={actionCount > 0 ? `Needs action · ${actionCount}` : 'Needs action'}
            active={filter === 'action'}
            onPress={() => setFilter('action')}
          />
          <Chip testID="inbox-filter-unread" label="Unread" active={filter === 'unread'} onPress={() => setFilter('unread')} />
        </View>

        <View style={{ flex: 1 }}>
          <InboxMessageList
            messages={visibleMessages}
            onSelect={openMessage}
            refreshControl={(
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={tokens.cyan}
                colors={[tokens.cyan]}
              />
            )}
          />
        </View>
      </View>
    </Screen>
  );
}
