import React, { useCallback, useEffect, useState } from 'react';
import { View, StatusBar, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { stageClient } from '@/api/stageClient';
import { loadInboxMessages, markInboxMessageRead } from '@/lib/inboxData';
import InboxMessageDetail from '@/components/inbox/InboxMessageDetail';
import {
  GamerProfileShell,
  CYAN,
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';

/**
 * Inbox message detail — Outlook-style reading pane (Stage theme).
 */
export default function InboxDetailScreen() {
  const router = useRouter();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
        {error && !message ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text style={{ color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>{error}</Text>
          </View>
        ) : (
          <InboxMessageDetail
            message={message}
            onBack={() => router.back()}
            onDeleted={() => router.replace('/apps/inbox')}
            onStatusChanged={(msgId, status) => {
              setMessage((prev) => (prev && String(prev.id) === String(msgId)
                ? { ...prev, status, is_read: true }
                : prev));
            }}
          />
        )}
      </SafeAreaView>
    </GamerProfileShell>
  );
}
