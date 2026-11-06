import React, { useCallback, useEffect, useState } from 'react';
import { View, StatusBar, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { stageClient } from '@/api/stageClient';
import { loadInboxMessages, markInboxMessageRead } from '@/lib/inboxData';
import InboxMessageDetail from '@/components/inbox/InboxMessageDetail';
import { IconButton, Screen } from '@/components/ui';

/**
 * Inbox message detail — Outlook-style reading pane (Stage theme).
 */
export default function InboxDetailScreen() {
  const router = useRouter();
  const tokens = useThemeStore((st) => st.tokens);
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await loadInboxMessages();
      const found = (data.messages || []).find((m) => String(m.id) === String(id));
      if (!found) {
        setMessage(null);
        setError('Message not found');
        return;
      }
      const opened = await markInboxMessageRead(found).catch(() => found);
      setMessage(opened);
    } catch (err) {
      setError(err?.message || 'Failed to open message');
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [load]);

  useEffect(() => {
    if (!id) return undefined;
    const unsub = stageClient.entities.InboxMessage.subscribe((event) => {
      if (String(event.id) !== String(id)) return;
      if (event.type === 'delete') {
        setMessage(null);
        return;
      }
      if (event.data) setMessage(event.data);
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [id]);

  const goBack = () => (router.canGoBack?.() === false ? router.replace('/apps/inbox') : router.back());

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
      {error && !message ? (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              icon="arrow-back"
              accessibilityLabel="Back"
              onPress={goBack}
            />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text style={{ color: tokens.muted, textAlign: 'center' }}>{error}</Text>
          </View>
        </View>
      ) : (
        <InboxMessageDetail
          message={message}
          onBack={goBack}
          onDeleted={() => router.replace('/apps/inbox')}
          onStatusChanged={(msgId, status) => {
            setMessage((prev) => (prev && String(prev.id) === String(msgId)
              ? { ...prev, status, is_read: true }
              : prev));
          }}
        />
      )}
    </Screen>
  );
}
