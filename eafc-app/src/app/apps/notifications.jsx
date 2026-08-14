import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StatusBar,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import { loadNotifications } from '@/lib/inboxData';
import {
  isNotificationUnread,
  notificationMarkReadPayload,
  resolveNotificationHref,
  formatRelativeInboxTime,
} from '@/lib/inboxHelpers';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
  AMBER,
} from '@/components/profile/gamer/GamerProfileUI';
import { headingStyle, headingStyleSm } from '@/lib/fonts';

/**
 * Frontend Notifications — taps deep-link into Inbox (and other Stage routes).
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [email, setEmail] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await loadNotifications();
      setEmail(data.email);
      setNotifications(data.notifications || []);
    } catch (err) {
      setNotifications([]);
      setError(err?.message || 'Failed to load notifications');
    }
  }, []);

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
    if (!email) return undefined;
    const unsub = stageClient.entities.Notification.subscribe((event) => {
      if (event.type === 'delete') {
        setNotifications((prev) => prev.filter((n) => n.id !== event.id));
        return;
      }
      if (!event.data) return;
      setNotifications((prev) => {
        const idx = prev.findIndex((n) => n.id === event.data.id);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = event.data;
          return next;
        }
        return [event.data, ...prev];
      });
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [email]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const markRead = async (notif) => {
    if (!isNotificationUnread(notif)) return;
    const payload = notificationMarkReadPayload(notif);
    await stageClient.entities.Notification.update(notif.id, payload).catch(() => {});
    setNotifications((prev) => prev.map((n) => (
      n.id === notif.id ? { ...n, ...payload } : n
    )));
  };

  const openNotif = async (notif) => {
    await markRead(notif);
    const href = resolveNotificationHref(notif.link);
    if (!href) return;
    router.push(href);
  };

  const markAll = async () => {
    const unread = notifications.filter(isNotificationUnread);
    await Promise.all(unread.map((n) => (
      stageClient.entities.Notification.update(n.id, notificationMarkReadPayload(n)).catch(() => {})
    )));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read: true })));
  };

  const unreadCount = notifications.filter(isNotificationUnread).length;

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
            <Text style={[headingStyleSm, { color: AMBER, fontSize: 10, letterSpacing: 2 }]}>STAGE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[headingStyle, { color: '#fff' }]}>Alerts</Text>
              {unreadCount > 0 ? (
                <View style={{
                  minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
                  backgroundColor: AMBER, alignItems: 'center', justifyContent: 'center',
                }}
                >
                  <Text style={{ color: '#1A1200', fontSize: 11, fontWeight: '900' }}>{unreadCount}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAll} hitSlop={8} style={{ padding: 8 }}>
              <Ionicons name="checkmark-done" size={20} color={AMBER} />
            </TouchableOpacity>
          ) : null}
        </View>

        {error ? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: '#FF4D6D' }}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={(
            <View style={{ alignItems: 'center', paddingVertical: 64, gap: 10 }}>
              <Ionicons name="notifications-outline" size={40} color="rgba(255,255,255,0.2)" />
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontWeight: '700' }}>No notifications yet</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const unread = isNotificationUnread(item);
            return (
              <TouchableOpacity
                onPress={() => openNotif(item)}
                activeOpacity={0.85}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.06)',
                  backgroundColor: unread ? 'rgba(255,210,74,0.06)' : 'transparent',
                  flexDirection: 'row',
                  gap: 12,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,210,74,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,210,74,0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                >
                  <Ionicons name="notifications" size={18} color={AMBER} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <Text style={{
                      color: unread ? '#fff' : 'rgba(255,255,255,0.7)',
                      fontWeight: unread ? '900' : '700',
                      fontSize: 14,
                      flex: 1,
                    }}
                      numberOfLines={1}
                    >
                      {item.title || item.type || 'Notification'}
                    </Text>
                    <Text style={{ color: unread ? AMBER : 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                      {formatRelativeInboxTime(item.created_date)}
                    </Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                    {item.body || item.message || ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </GamerProfileShell>
  );
}
