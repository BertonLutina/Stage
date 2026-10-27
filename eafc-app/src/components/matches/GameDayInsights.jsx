import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { stageClient } from '@/api/stageClient';
import { penaltyOutcome } from '@/lib/penaltyOutcome';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import { FUT, SectionCard, SectionTitle } from '@/components/dashboard/CommandCenterUI';

const TAP = 44;

function readError(error, feature) {
  return error?.status === 404
    ? `${feature} needs the updated GameDay backend.`
    : (error?.message || `${feature} unavailable`);
}

export default function GameDayInsights({ game }) {
  const router = useRouter();
  const [scope, setScope] = useState('all');
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaError, setMediaError] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState(0);
  const [viewer, setViewer] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadHistory = useCallback(async () => {
    if (!game?.id) return;
    try {
      const result = await stageClient.http.get(`/game-day/${encodeURIComponent(game.id)}/history`, {
        scope,
        limit: 5,
        offset,
      });
      setHistory(result);
      setHistoryError('');
    } catch (e) {
      setHistoryError(readError(e, 'Head-to-Head'));
    }
  }, [game?.id, game?.updated_date, scope, offset]);

  const loadMedia = useCallback(async () => {
    if (!game?.id) return;
    try {
      const all = [];
      let result;
      for (let page = 0; ; page += 100) {
        result = await stageClient.http.get('/match-highlights', {
          match_id: game.id,
          limit: 100,
          offset: page,
          view: 'gallery',
        });
        all.push(...(result?.items || []));
        if ((result?.items || []).length < 100) break;
      }
      setMedia({ ...result, items: all });
      setMediaError('');
    } catch (e) {
      setMediaError(readError(e, 'Highlights'));
    }
  }, [game?.id, revision]);

  useEffect(() => {
    setHistory(null);
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setMedia(null);
    loadMedia();
  }, [loadMedia]);

  async function publish() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMediaError('Photo library permission is required to upload highlights.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setBusy(true);
    setMediaError('');
    try {
      const body = new FormData();
      body.append('file', {
        uri: asset.uri,
        name: asset.fileName || 'highlight.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      await stageClient.http.upload(
        `/match-highlights/publish/${encodeURIComponent(game.id)}`,
        body,
      );
      setRevision((r) => r + 1);
    } catch (e) {
      setMediaError(e?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    setBusy(true);
    try {
      await stageClient.entities.MatchHighlight.delete(item.id);
      setImage(0);
      setRevision((r) => r + 1);
    } catch (e) {
      setMediaError(e?.message || 'Could not remove screenshot');
    } finally {
      setBusy(false);
    }
  }

  const items = media?.items || [];
  const current = items[Math.min(image, Math.max(0, items.length - 1))];
  const home = game?.home_club_name || game?.home_player_name || 'Home';
  const away = game?.away_club_name || game?.away_player_name || 'Away';
  const total = Math.max(1, Number(history?.total) || 1);

  return (
    <View style={{ gap: 12 }}>
      <SectionCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <SectionTitle>Head-to-Head</SectionTitle>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {['all', 'same'].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => { setScope(value); setOffset(0); }}
                style={[styles.chip, scope === value && styles.chipActive]}
              >
                <Text style={[styles.chipText, scope === value && { color: CYAN }]}>
                  {value === 'all' ? 'All' : 'Same'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {historyError ? (
          <Text style={styles.error}>{historyError}</Text>
        ) : !history ? (
          <ActivityIndicator color={CYAN} style={{ marginVertical: 16 }} />
        ) : (
          <View style={{ marginTop: 12, gap: 12 }}>
            <Text style={styles.meta}>{history.chronology || 'Previous meetings'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Stat label={home} value={history.homeWins} caption="Wins" />
              <Stat label="Draws" value={history.draws} caption="" />
              <Stat label={away} value={history.awayWins} caption="Wins" />
            </View>
            {history.total ? (
              <>
                <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ flex: history.homeWins / total, backgroundColor: CYAN }} />
                  <View style={{ flex: history.draws / total, backgroundColor: '#94a3b8' }} />
                  <View style={{ flex: history.awayWins / total, backgroundColor: FUT.rose }} />
                </View>
                {(history.meetings || []).map((m) => {
                  const pens = penaltyOutcome(m);
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => router.push({
                        pathname: '/(tabs)/matches/matchdetailscreen',
                        params: { matchId: m.id },
                      })}
                      style={styles.meeting}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                        <Text style={styles.meetingName} numberOfLines={1}>
                          {m.home_club_name || m.home_player_name}
                        </Text>
                        <Text style={{ color: '#fff', fontWeight: '900' }}>
                          {m.home_score} - {m.away_score}
                        </Text>
                        <Text style={[styles.meetingName, { textAlign: 'right' }]} numberOfLines={1}>
                          {m.away_club_name || m.away_player_name}
                        </Text>
                      </View>
                      <Text style={styles.meta}>
                        {[
                          m.display_date ? new Date(m.display_date).toLocaleDateString() : null,
                          m.competition_name,
                          m.status === 'forfeit' ? 'Forfeit' : null,
                        ].filter(Boolean).join(' · ')}
                      </Text>
                      {pens ? <Text style={{ color: CYAN, fontSize: 11, marginTop: 2 }}>{pens}</Text> : null}
                    </TouchableOpacity>
                  );
                })}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    disabled={offset === 0}
                    onPress={() => setOffset((n) => Math.max(0, n - 5))}
                    style={[styles.nav, offset === 0 && { opacity: 0.35 }]}
                  >
                    <Ionicons name="chevron-back" size={16} color={CYAN} />
                    <Text style={styles.navText}>Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={offset + 5 >= history.total}
                    onPress={() => setOffset((n) => n + 5)}
                    style={[styles.nav, offset + 5 >= history.total && { opacity: 0.35 }]}
                  >
                    <Text style={styles.navText}>Next</Text>
                    <Ionicons name="chevron-forward" size={16} color={CYAN} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.meta}>First meeting between these participants.</Text>
            )}
          </View>
        )}
      </SectionCard>

      <SectionCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionTitle>Highlights</SectionTitle>
          {media?.can_upload ? (
            <TouchableOpacity onPress={publish} disabled={busy} style={styles.nav}>
              <Ionicons name="image-outline" size={18} color={CYAN} />
              <Text style={styles.navText}>{busy ? 'Uploading…' : 'Upload'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={[styles.meta, { marginTop: 6 }]}>Published match screenshots</Text>
        {mediaError ? (
          <TouchableOpacity onPress={() => setRevision((n) => n + 1)}>
            <Text style={styles.error}>{mediaError} · Retry</Text>
          </TouchableOpacity>
        ) : !media ? (
          <ActivityIndicator color={CYAN} style={{ marginVertical: 16 }} />
        ) : !current ? (
          <Text style={[styles.meta, { paddingVertical: 20, textAlign: 'center' }]}>
            No published screenshots for this match.
          </Text>
        ) : (
          <View style={{ marginTop: 12, gap: 10 }}>
            <Pressable onPress={() => setViewer(true)}>
              <Image
                source={{ uri: current.image_url }}
                style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: 'rgba(0,0,0,0.35)' }}
                resizeMode="contain"
              />
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.meta}>{image + 1} / {media.total} screenshots</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <TouchableOpacity
                  disabled={image === 0}
                  onPress={() => setImage((n) => n - 1)}
                  style={[styles.iconBtn, image === 0 && { opacity: 0.35 }]}
                >
                  <Ionicons name="chevron-back" size={18} color={CYAN} />
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={image >= items.length - 1}
                  onPress={() => setImage((n) => n + 1)}
                  style={[styles.iconBtn, image >= items.length - 1 && { opacity: 0.35 }]}
                >
                  <Ionicons name="chevron-forward" size={18} color={CYAN} />
                </TouchableOpacity>
                {current.can_remove ? (
                  <TouchableOpacity disabled={busy} onPress={() => remove(current)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={16} color={FUT.rose} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </SectionCard>

      <Modal visible={viewer && Boolean(current)} transparent animationType="fade" onRequestClose={() => setViewer(false)}>
        <Pressable style={styles.backdrop} onPress={() => setViewer(false)} />
        <View style={styles.viewer}>
          {current ? (
            <Image
              source={{ uri: current.image_url }}
              style={{ width: '100%', height: 320 }}
              resizeMode="contain"
            />
          ) : null}
          <TouchableOpacity onPress={() => setViewer(false)} style={[styles.nav, { alignSelf: 'center', marginTop: 12 }]}>
            <Text style={styles.navText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ label, value, caption }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
      <Text style={styles.meetingName} numberOfLines={1}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 4 }}>{value ?? 0}</Text>
      {caption ? <Text style={styles.meta}>{caption}</Text> : null}
    </View>
  );
}

const styles = {
  chip: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: 'rgba(0,232,255,0.45)',
    backgroundColor: 'rgba(0,232,255,0.12)',
  },
  chipText: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '800' },
  meta: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  error: { color: FUT.rose, fontSize: 12, marginTop: 10 },
  meeting: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    minHeight: TAP,
  },
  meetingName: { color: 'rgba(255,255,255,0.75)', fontSize: 11, flex: 1 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: TAP,
    paddingHorizontal: 4,
  },
  navText: { color: CYAN, fontSize: 12, fontWeight: '800' },
  iconBtn: {
    width: TAP,
    height: TAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  viewer: {
    marginHorizontal: 16,
    marginBottom: 40,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,232,255,0.25)',
    backgroundColor: '#0A1222',
  },
};
