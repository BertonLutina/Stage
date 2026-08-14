import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import { loadInboxMessages, markAllInboxRead } from '@/lib/inboxData';
import { upsertInboxMessage } from '@/lib/inboxHelpers';
import InboxMessageList from '@/components/inbox/InboxMessageList';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
} from '@/components/profile/gamer/GamerProfileUI';
import { headingStyle, headingStyleSm } from '@/lib/fonts';

/**
 * Inbox — Outlook-style list (Stage theme). Deep-link: /apps/inbox?id=
 */
export default function InboxScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [email, setEmail] = useState(null);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={CYAN} size="large" />
        </View>
      </GamerProfileShell>
    );
  }

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.08)',
        }}
        >
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <Text style={[headingStyleSm, { color: CYAN, fontSize: 10, letterSpacing: 2 }]}>STAGE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[headingStyle, { color: '#fff' }]}>Inbox</Text>
              {unreadCount > 0 ? (
                <View style={{
                  minWidth: 22,
                  height: 22,
                  borderRadius: 11,
                  paddingHorizontal: 6,
                  backgroundColor: CYAN,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                >
                  <Text style={{ color: '#031018', fontSize: 11, fontWeight: '900' }}>{unreadCount}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={onMarkAll} hitSlop={8} style={{ padding: 8 }}>
              <Ionicons name="checkmark-done" size={20} color={CYAN} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => router.push('/apps/notifications')}
            hitSlop={8}
            style={{ padding: 8 }}
          >
            <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: '#FF4D6D', marginBottom: 8 }}>{error}</Text>
            <TouchableOpacity onPress={load}>
              <Text style={{ color: CYAN, fontWeight: '800' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <InboxMessageList
          messages={messages}
          onSelect={openMessage}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />
          }
        />
      </SafeAreaView>
    </GamerProfileShell>
  );
}
