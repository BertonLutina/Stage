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
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import { FUT } from '@/components/dashboard/CommandCenterUI';
import { headingStyleSm } from '@/lib/fonts';
import {
  STAGE_PLUS_TILE_BACKGROUND_ERROR,
  getGameDayTileBackgroundConfig,
  pageTileKeyFields,
  pageTileKeyQuery,
  resolvePageTileKey,
} from '@/lib/gameDayTileBackgrounds';
import { uploadLocalMedia } from '@/lib/uploadProfileMedia';

const SILVER = '#EEF3FB';

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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }}>
        <View style={{ maxHeight: '88%', backgroundColor: '#111827', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={[headingStyleSm, { color: SILVER, fontSize: 11, letterSpacing: 1.8 }]}>
              {tileTitle || 'Game Day'} background
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 14 }}>
            {!canCustomize ? (
              <View style={{ borderWidth: 1, borderColor: FUT.rose, backgroundColor: 'rgba(244,63,94,0.12)', padding: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Ionicons name="alert-circle" size={18} color={FUT.rose} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: FUT.rose, fontWeight: '900', fontSize: 14, textTransform: 'uppercase' }}>
                      STAGE Plus required
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>
                      {STAGE_PLUS_TILE_BACKGROUND_ERROR}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => { onClose?.(); router.push('/apps/store'); }}
                  style={{ backgroundColor: SILVER, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#111827', fontWeight: '900' }}>View STAGE Plus</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {error ? (
                  <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text>
                ) : null}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>
                      {tileTitle || 'Tile'}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>
                      This background only changes this panel.
                    </Text>
                  </View>
                  <TouchableOpacity
                    disabled={Boolean(saving)}
                    onPress={() => saveBackground({ type: 'default' }, 'default')}
                    style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 8 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Reset</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase' }}>
                  Official Stage+ designs
                </Text>
                {loading ? (
                  <ActivityIndicator color={SILVER} />
                ) : backgrounds.length ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {backgrounds.map((bg) => {
                      const active = current.type === 'official' && String(current.background_id || '') === String(bg.id);
                      return (
                        <TouchableOpacity
                          key={bg.id}
                          disabled={Boolean(saving)}
                          onPress={() => saveBackground({ type: 'official', background_id: bg.id }, bg.id)}
                          style={{
                            width: '48%',
                            flexGrow: 1,
                            borderWidth: 1,
                            borderColor: active ? SILVER : 'rgba(255,255,255,0.1)',
                            overflow: 'hidden',
                          }}
                        >
                          <Image source={{ uri: bg.image_url }} style={{ height: 72, backgroundColor: '#000' }} resizeMode="cover" />
                          <View style={{ paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 11, fontWeight: '800', flex: 1 }}>
                              {bg.name}
                            </Text>
                            {saving === bg.id ? <ActivityIndicator color={SILVER} size="small" /> : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>
                    No official backgrounds are available yet.
                  </Text>
                )}

                <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, gap: 10 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase' }}>
                    Upload your own
                  </Text>
                  {preview ? (
                    <View style={{ height: 116, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(216,222,232,0.35)', backgroundColor: '#000' }}>
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
                      <Stepper label="Zoom" value={zoom} min={100} max={260} step={10} onChange={setZoom} />
                      <Stepper label="Horizontal" value={x} min={0} max={100} step={5} onChange={setX} />
                      <Stepper label="Vertical" value={y} min={0} max={100} step={5} onChange={setY} />
                    </View>
                  ) : null}
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(216,222,232,0.35)', paddingVertical: 12, alignItems: 'center' }}
                  >
                    <Text style={{ color: SILVER, fontWeight: '800', fontSize: 12 }}>
                      {picked?.fileName || (preview ? 'Change image' : 'Choose image')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={!preview || Boolean(saving)}
                    onPress={uploadCustom}
                    style={{ backgroundColor: SILVER, paddingVertical: 12, alignItems: 'center', opacity: !preview || saving ? 0.45 : 1 }}
                  >
                    {saving === 'custom'
                      ? <ActivityIndicator color="#111827" />
                      : <Text style={{ color: '#111827', fontWeight: '900' }}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Stepper({ label, value, min, max, step, onChange }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity onPress={() => onChange(Math.max(min, value - step))} style={stepBtn}>
          <Text style={{ color: '#fff', fontWeight: '900' }}>−</Text>
        </TouchableOpacity>
        <Text style={{ color: CYAN, fontWeight: '800', minWidth: 36, textAlign: 'center' }}>{value}</Text>
        <TouchableOpacity onPress={() => onChange(Math.min(max, value + step))} style={stepBtn}>
          <Text style={{ color: '#fff', fontWeight: '900' }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const stepBtn = {
  width: 28,
  height: 28,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.2)',
  alignItems: 'center',
  justifyContent: 'center',
};
