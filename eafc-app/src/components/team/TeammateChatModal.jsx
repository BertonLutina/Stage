import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/utils/api';
import { AMBER } from '@/components/profile/gamer/GamerProfileUI';

const LAST_DM_KEY = (teamId) => `team-last-dm:${teamId}`;

function personName(row) {
  return row?.gamer_tag || row?.gamertag || row?.display_name
    || [row?.first_name, row?.last_name].filter(Boolean).join(' ')
    || row?.name
    || 'Player';
}

function personId(row) {
  return row?.user_id || row?.other_user_id || row?.id || row?.other_user?.id;
}

function PersonRow({ name, subtitle, avatar, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${name}`}
      style={styles.row}
    >
      <View style={styles.avatar}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={{ width: 44, height: 44 }} />
        ) : (
          <Ionicons name="person" size={18} color="rgba(255,255,255,0.35)" />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {subtitle ? (
          <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
    </TouchableOpacity>
  );
}

export default function TeammateChatModal({
  visible,
  onClose,
  teamId,
  myUserId,
  players = [],
  onPick,
}) {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [lastUserId, setLastUserId] = useState(null);

  useEffect(() => {
    if (!visible || !teamId) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get('/social/messages').then((r) => r.data?.data || []).catch(() => []),
      AsyncStorage.getItem(LAST_DM_KEY(teamId)).catch(() => null),
    ]).then(([rows, last]) => {
      if (cancelled) return;
      setConversations(Array.isArray(rows) ? rows : []);
      setLastUserId(last || null);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [visible, teamId]);

  const squad = useMemo(() => {
    return (players || []).filter((p) => String(personId(p)) && String(personId(p)) !== String(myUserId));
  }, [players, myUserId]);

  const squadById = useMemo(() => {
    const map = new Map();
    squad.forEach((p) => map.set(String(personId(p)), p));
    return map;
  }, [squad]);

  const recent = useMemo(() => {
    const rows = conversations
      .map((c) => {
        const id = String(personId(c) || '');
        if (!id || !squadById.has(id)) return null;
        const teammate = squadById.get(id);
        return {
          id,
          name: personName(teammate) || personName(c.other_user) || personName(c),
          avatar: teammate?.avatar_url || teammate?.avatar || c.other_user?.avatar_url,
          preview: c.last_message || c.last_content || c.content || 'Last conversation',
          at: c.last_message_at || c.updated_at || c.created_at || '',
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (lastUserId && a.id === String(lastUserId)) return -1;
        if (lastUserId && b.id === String(lastUserId)) return 1;
        return String(b.at).localeCompare(String(a.at));
      });
    const seen = new Set();
    return rows.filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
  }, [conversations, squadById, lastUserId]);

  const recentIds = useMemo(() => new Set(recent.map((r) => r.id)), [recent]);

  const others = squad.filter((p) => !recentIds.has(String(personId(p))));

  const pick = async (id, name) => {
    if (!id) return;
    try {
      await AsyncStorage.setItem(LAST_DM_KEY(teamId), String(id));
    } catch {
      // ignore
    }
    onPick?.({ userId: String(id), name, avatar: squadById.get(String(id))?.avatar_url || squadById.get(String(id))?.avatar });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>Chat</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Pick a teammate. Recent conversations show first.</Text>
          {loading ? (
            <ActivityIndicator color={AMBER} style={{ marginTop: 24 }} />
          ) : (
            <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ paddingBottom: 28, gap: 8 }}>
              {recent.length ? (
                <>
                  <Text style={styles.section}>LAST CONVERSATIONS</Text>
                  {recent.map((row) => (
                    <PersonRow
                      key={`recent-${row.id}`}
                      name={row.name}
                      subtitle={row.preview}
                      avatar={row.avatar}
                      onPress={() => pick(row.id, row.name)}
                    />
                  ))}
                </>
              ) : null}
              <Text style={styles.section}>{recent.length ? 'SQUAD' : 'TEAMMATES'}</Text>
              {others.length ? others.map((p) => (
                <PersonRow
                  key={`squad-${personId(p)}`}
                  name={personName(p)}
                  subtitle={String(p.position || p.role || 'Squad').replace(/_/g, ' ')}
                  avatar={p.avatar_url || p.avatar}
                  onPress={() => pick(personId(p), personName(p))}
                />
              )) : !recent.length ? (
                <Text style={styles.empty}>No teammates to chat with yet.</Text>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0B1220',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,214,10,0.28)',
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  hint: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 14 },
  section: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#101827',
    borderWidth: 1,
    borderColor: 'rgba(255,214,10,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: '#fff', fontWeight: '800', fontSize: 15 },
  sub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  empty: { color: 'rgba(255,255,255,0.45)', fontSize: 13, paddingVertical: 16, textAlign: 'center' },
});
