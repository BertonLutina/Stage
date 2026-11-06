import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { hexToRgba } from '@/lib/stageTheme';
import { Button, IconButton } from '@/components/ui';
import { sectionLabelStyle } from '@/components/dashboard/CommandCenterUI';
import {
  STAGE_PLUS_TILE_BACKGROUND_ERROR,
  getGameDayTileBackgroundConfig,
  pageTileKeyFields,
  pageTileKeyQuery,
  resolvePageTileKey,
} from '@/lib/gameDayTileBackgrounds';
import { uploadLocalMedia } from '@/lib/uploadProfileMedia';

export default function GameDayTileBackgroundDialog({
  visible,
  onClose,
  player,
  tileKey,
  tileTitle,
  canCustomize,
  onPlayerChanged,
}) {
  const router = useRouter();
  const tokens = useThemeStore((st) => st.tokens);
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [picked, setPicked] = useState(null);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [zoom, setZoom] = useState(120);
  const current = getGameDayTileBackgroundConfig(player, tileKey);

  useEffect(() => {
    if (!visible) return;
    setError(canCustomize ? '' : STAGE_PLUS_TILE_BACKGROUND_ERROR);
    setPreview('');
    setPicked(null);
    setX(50);
    setY(50);
    setZoom(120);
    if (!canCustomize) return undefined;
    let cancelled = false;
    setLoading(true);
    stageClient.entities.PlayerCardBackground
      .filter({}, 'sort_order', 100)
      .then((rows) => {
        if (!cancelled) setBackgrounds(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setBackgrounds([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [visible, canCustomize]);

  async function saveBackground(payload, busyKey) {
    if (!canCustomize) {
      setError(STAGE_PLUS_TILE_BACKGROUND_ERROR);
      return;
    }
    const key = resolvePageTileKey(tileKey, tileTitle);
    if (!player?.id || !key) {
      setError('Valid title_key is required');
      return;
    }
    setSaving(busyKey);
    setError('');
    try {
      const updated = await stageClient.http.patch(
        `/players/${encodeURIComponent(player.id)}/game-day-tile-background?${pageTileKeyQuery(key)}`,
        { ...payload, ...pageTileKeyFields(key) },
      );
      onPlayerChanged?.({ ...player, ...updated });
      setPreview('');
      setPicked(null);
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Could not update tile background.');
    } finally {
      setSaving(null);
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setPicked(result.assets[0]);
    setPreview(result.assets[0].uri);
    setX(50);
    setY(50);
    setZoom(120);
  }

  async function uploadCustom() {
    if (!picked && !preview) {
      setError('Choose an image first.');
      return;
    }
    setSaving('custom');
    setError('');
    try {
      const imageUrl = await uploadLocalMedia(picked || preview, { fallbackName: 'gameday-tile.jpg' });
      await saveBackground({
        type: 'custom',
        image_url: imageUrl,
        position: `${x}% ${y}%`,
        zoom,
      }, 'custom');
    } catch (err) {
      setSaving(null);
      setError(err?.message || 'Could not upload tile background.');
    }
  }

  const label = sectionLabelStyle(tokens);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: tokens.overlay, justifyContent: 'flex-end' }}>
        <View style={{ maxHeight: '88%', backgroundColor: tokens.bgDeep, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderColor: tokens.border, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
            <Text numberOfLines={1} style={{ flex: 1, color: tokens.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>
              {tileTitle || 'Game Day'} background
            </Text>
            <IconButton icon="close" onPress={onClose} accessibilityLabel="Close" />
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 14 }}>
            {!canCustomize ? (
              <View style={{ borderWidth: 1, borderColor: tokens.danger, borderRadius: 16, backgroundColor: hexToRgba(tokens.danger, 0.12), padding: 16, gap: 12 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Ionicons name="alert-circle-outline" size={22} color={tokens.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: tokens.danger, fontWeight: '700', fontSize: 15, textTransform: 'uppercase' }}>
                      STAGE Plus required
                    </Text>
                    <Text style={{ color: tokens.text, fontSize: 14, marginTop: 4 }}>
                      {STAGE_PLUS_TILE_BACKGROUND_ERROR}
                    </Text>
                  </View>
                </View>
                <Button
                  title="View STAGE Plus"
                  onPress={() => { onClose?.(); router.push('/apps/store'); }}
                />
              </View>
            ) : (
              <>
                {error ? (
                  <Text style={{ color: tokens.danger, fontSize: 13 }}>{error}</Text>
                ) : null}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: tokens.border, borderRadius: 16, backgroundColor: tokens.card, padding: 16, gap: 10 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: '700', fontSize: 14 }}>
                      {tileTitle || 'Tile'}
                    </Text>
                    <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>
                      This background only changes this panel.
                    </Text>
                  </View>
                  <TouchableOpacity
                    disabled={Boolean(saving)}
                    onPress={() => saveBackground({ type: 'default' }, 'default')}
                    accessibilityRole="button"
                    style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: tokens.border, paddingHorizontal: 16, justifyContent: 'center', opacity: saving ? 0.5 : 1 }}
                  >
                    <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '600' }}>Reset</Text>
                  </TouchableOpacity>
                </View>

                <Text style={label}>
                  Official Stage+ designs
                </Text>
                {loading ? (
                  <ActivityIndicator color={tokens.cyan} />
                ) : backgrounds.length ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {backgrounds.map((bg) => {
                      const active = current.type === 'official' && String(current.background_id || '') === String(bg.id);
                      return (
                        <TouchableOpacity
                          key={bg.id}
                          disabled={Boolean(saving)}
                          onPress={() => saveBackground({ type: 'official', background_id: bg.id }, bg.id)}
                          accessibilityRole="button"
                          accessibilityLabel={bg.name}
                          style={{
                            width: '48%',
                            flexGrow: 1,
                            borderWidth: 1,
                            borderRadius: 12,
                            borderColor: active ? tokens.cyan : tokens.border,
                            backgroundColor: tokens.card,
                            overflow: 'hidden',
                          }}
                        >
                          <Image source={{ uri: bg.image_url }} style={{ height: 72, backgroundColor: tokens.bgDeep }} resizeMode="cover" />
                          <View style={{ paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                            <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 13, fontWeight: '600', flex: 1 }}>
                              {bg.name}
                            </Text>
                            {saving === bg.id ? <ActivityIndicator color={tokens.cyan} size="small" /> : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={{ color: tokens.muted, fontSize: 14, textAlign: 'center', paddingVertical: 16 }}>
                    No official backgrounds are available yet.
                  </Text>
                )}

                <View style={{ borderWidth: 1, borderColor: tokens.border, borderRadius: 16, backgroundColor: tokens.card, padding: 16, gap: 12 }}>
                  <Text style={label}>
                    Upload your own
                  </Text>
                  {preview ? (
                    <View style={{ height: 116, overflow: 'hidden', borderRadius: 12, borderWidth: 1, borderColor: tokens.border, backgroundColor: tokens.bgDeep }}>
                      <Image
                        source={{ uri: preview }}
                        style={{
                          position: 'absolute',
                          width: `${zoom}%`,
                          height: `${zoom}%`,
                          left: `${x - zoom / 2}%`,
                          top: `${y - zoom / 2}%`,
                        }}
                        resizeMode="cover"
                      />
                    </View>
                  ) : null}
                  {preview ? (
                    <View style={{ gap: 8 }}>
                      <Stepper tokens={tokens} label="Zoom" value={zoom} min={100} max={260} step={10} onChange={setZoom} />
                      <Stepper tokens={tokens} label="Horizontal" value={x} min={0} max={100} step={5} onChange={setX} />
                      <Stepper tokens={tokens} label="Vertical" value={y} min={0} max={100} step={5} onChange={setY} />
                    </View>
                  ) : null}
                  <TouchableOpacity
                    onPress={pickImage}
                    accessibilityRole="button"
                    style={{ minHeight: 52, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: tokens.borderStrong, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text numberOfLines={1} style={{ color: tokens.cyan, fontWeight: '600', fontSize: 14 }}>
                      {picked?.fileName || (preview ? 'Change image' : 'Choose image')}
                    </Text>
                  </TouchableOpacity>
                  <Button
                    title="Save"
                    onPress={uploadCustom}
                    loading={saving === 'custom'}
                    disabled={!preview || Boolean(saving)}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Stepper({ tokens, label, value, min, max, step, onChange }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={sectionLabelStyle(tokens)}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - step))}
          accessibilityRole="button"
          accessibilityLabel={`${label} decrease`}
          style={stepBtn(tokens)}
        >
          <Ionicons name="remove" size={22} color={tokens.text} />
        </TouchableOpacity>
        <Text style={{ color: tokens.cyan, fontWeight: '700', minWidth: 40, textAlign: 'center' }}>{value}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + step))}
          accessibilityRole="button"
          accessibilityLabel={`${label} increase`}
          style={stepBtn(tokens)}
        >
          <Ionicons name="add" size={22} color={tokens.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const stepBtn = (tokens) => ({
  width: 44,
  height: 44,
  borderWidth: 1,
  borderRadius: 12,
  borderColor: tokens.border,
  backgroundColor: tokens.bgDeep,
  alignItems: 'center',
  justifyContent: 'center',
});
