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
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { hexToRgba } from '@/lib/stageTheme';
import { Card, Chip, SectionLabel } from '@/components/ui';
import { MIN_TOUCH } from '@/components/ui/metrics';

const TAP = MIN_TOUCH;

function readError(error, feature) {
  return error?.status === 404
    ? `${feature} needs the updated GameDay backend.`
    : (error?.message || `${feature} unavailable`);
}

export default function GameDayInsights({ game }) {
  const router = useRouter();
  const tokens = useThemeStore((st) => st.tokens);
  const styles = makeStyles(tokens);
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
    <View style={{ gap: 16 }}>
      <Card style={{ gap: 12 }}>
        <SectionLabel
          right={(
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['all', 'same'].map((value) => (
                <Chip
                  key={value}
                  label={value === 'all' ? 'All' : 'Same'}
                  active={scope === value}
                  onPress={() => { setScope(value); setOffset(0); }}
                />
              ))}
            </View>
          )}
        >
          Head-to-Head
        </SectionLabel>

        {historyError ? (
          <Text style={styles.error}>{historyError}</Text>
        ) : !history ? (
          <ActivityIndicator color={tokens.cyan} style={{ marginVertical: 16 }} />
        ) : (
          <View style={{ gap: 14 }}>
            <Text style={styles.meta}>{history.chronology || 'Previous meetings'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Stat label={home} value={history.homeWins} caption="Wins" />
              <Stat label="Draws" value={history.draws} caption="" />
              <Stat label={away} value={history.awayWins} caption="Wins" />
            </View>
            {history.total ? (
              <>
                <View style={{ flexDirection: 'row', gap: 4, height: 6 }}>
                  {[
                    [history.homeWins, tokens.cyan, 'home'],
                    [history.draws, tokens.muted, 'draws'],
                    [history.awayWins, tokens.borderStrong, 'away'],
                  ].filter(([count]) => Number(count) > 0).map(([count, color, key]) => (
                    <View key={key} style={{ flex: count / total, backgroundColor: color, borderRadius: 3 }} />
                  ))}
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
                      accessibilityRole="button"
                      style={styles.meeting}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <Text style={styles.meetingName} numberOfLines={1}>
                          {m.home_club_name || m.home_player_name}
                        </Text>
                        <Text style={styles.meetingScore}>
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
                      {pens ? <Text style={{ color: tokens.cyan, fontSize: 12, marginTop: 2 }}>{pens}</Text> : null}
                    </TouchableOpacity>
                  );
                })}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    disabled={offset === 0}
                    onPress={() => setOffset((n) => Math.max(0, n - 5))}
                    accessibilityRole="button"
                    style={[styles.nav, offset === 0 && { opacity: 0.35 }]}
                  >
                    <Ionicons name="chevron-back" size={18} color={tokens.cyan} />
                    <Text style={styles.navText}>Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={offset + 5 >= history.total}
                    onPress={() => setOffset((n) => n + 5)}
                    accessibilityRole="button"
                    style={[styles.nav, offset + 5 >= history.total && { opacity: 0.35 }]}
                  >
                    <Text style={styles.navText}>Next</Text>
                    <Ionicons name="chevron-forward" size={18} color={tokens.cyan} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.meta}>First meeting between these participants.</Text>
            )}
          </View>
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionLabel
          right={media?.can_upload ? (
            <TouchableOpacity onPress={publish} disabled={busy} accessibilityRole="button" style={styles.nav}>
              <Ionicons name="image-outline" size={18} color={tokens.cyan} />
              <Text style={styles.navText}>{busy ? 'Uploading…' : 'Upload'}</Text>
            </TouchableOpacity>
          ) : null}
        >
          Highlights
        </SectionLabel>
        <Text style={styles.meta}>Published match screenshots</Text>
        {mediaError ? (
          <TouchableOpacity onPress={() => setRevision((n) => n + 1)} accessibilityRole="button" style={{ minHeight: TAP, justifyContent: 'center' }}>
            <Text style={styles.error}>{mediaError} · Retry</Text>
          </TouchableOpacity>
        ) : !media ? (
          <ActivityIndicator color={tokens.cyan} style={{ marginVertical: 16 }} />
        ) : !current ? (
          <Text style={[styles.meta, { paddingVertical: 20, textAlign: 'center' }]}>
            No published screenshots for this match.
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            <Pressable onPress={() => setViewer(true)} accessibilityRole="imagebutton" accessibilityLabel="Open screenshot">
              <Image
                source={{ uri: current.image_url }}
                style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: tokens.bgDeep }}
                resizeMode="contain"
              />
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.meta}>{image + 1} / {media.total} screenshots</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <TouchableOpacity
                  disabled={image === 0}
                  onPress={() => setImage((n) => n - 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Previous screenshot"
                  style={[styles.iconBtn, image === 0 && { opacity: 0.35 }]}
                >
                  <Ionicons name="chevron-back" size={20} color={tokens.cyan} />
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={image >= items.length - 1}
                  onPress={() => setImage((n) => n + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Next screenshot"
                  style={[styles.iconBtn, image >= items.length - 1 && { opacity: 0.35 }]}
                >
                  <Ionicons name="chevron-forward" size={20} color={tokens.cyan} />
                </TouchableOpacity>
                {current.can_remove ? (
                  <TouchableOpacity
                    disabled={busy}
                    onPress={() => remove(current)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove screenshot"
                    style={styles.iconBtn}
                  >
                    <Ionicons name="trash-outline" size={20} color={tokens.danger} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </Card>

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
          <TouchableOpacity onPress={() => setViewer(false)} accessibilityRole="button" style={[styles.nav, { alignSelf: 'center', marginTop: 12 }]}>
            <Text style={styles.navText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ label, value, caption }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
      <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase', maxWidth: '100%' }}>
        {label}
      </Text>
      <Text style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 28, letterSpacing: 28 * 0.03, marginTop: 4 }}>
        {value ?? 0}
      </Text>
      {caption ? <Text style={{ color: tokens.muted, fontSize: 12 }}>{caption}</Text> : null}
    </View>
  );
}

const makeStyles = (tokens) => ({
  meta: { color: tokens.muted, fontSize: 12 },
  error: { color: tokens.danger, fontSize: 13 },
  meeting: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: tokens.border,
    minHeight: TAP,
  },
  meetingName: { color: tokens.textSoft, fontSize: 13, flex: 1 },
  meetingScore: { color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 16, letterSpacing: 16 * 0.03 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: TAP,
    paddingHorizontal: 4,
  },
  navText: { color: tokens.cyan, fontSize: 13, fontWeight: '600' },
  iconBtn: {
    width: TAP,
    height: TAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { flex: 1, backgroundColor: hexToRgba(tokens.bgDeep, 0.85) },
  viewer: {
    marginHorizontal: 16,
    marginBottom: 40,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.border,
    backgroundColor: tokens.bgDeep,
  },
});
