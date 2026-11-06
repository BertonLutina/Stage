import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { stageClient } from '@/api/stageClient';
import VideoPlayer from '@/components/common/VideoPlayer';
import { useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { hexToRgba } from '@/lib/stageTheme';
import { headingStyle } from '@/lib/fonts';
import {
  SHOWCASE_POSITIONS,
  MAX_SHOWCASE_MB,
  MAX_SHOWCASE_SECONDS,
  SHOWCASE_UPLOAD_TIMEOUT_MS,
  isShowcaseVideoTypeAllowed,
  validateShowcaseDuration,
  validateShowcaseFileSize,
  showcaseVideoUri,
} from '@/lib/showcaseClips';

function fileNameFromUri(uri = '') {
  const clean = String(uri).split('?')[0];
  return clean.split('/').pop() || 'clip.mp4';
}

export default function PlayerShowcase({ player, canEdit = false, onChanged }) {
  const tokens = useGamerTokens();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [picked, setPicked] = useState(null);
  const [position, setPosition] = useState(player?.showcase_position || '');
  const [error, setError] = useState(null);
  const [watching, setWatching] = useState(null);
  const [showPositions, setShowPositions] = useState(false);

  const playerId = player?.id;

  useEffect(() => {
    let cancelled = false;
    if (!playerId) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    stageClient.entities.PlayerShowcaseVideo
      .filter({ player_id: playerId })
      .then((rows) => { if (!cancelled) setVideos(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (!cancelled) setVideos([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [playerId]);

  useEffect(() => {
    setPosition(player?.showcase_position || '');
  }, [player?.showcase_position]);

  const pickClip = async () => {
    setError(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to add a clip.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const fileName = asset.fileName || fileNameFromUri(asset.uri);
    if (!isShowcaseVideoTypeAllowed({ fileName, mimeType: asset.mimeType })) {
      setError('Upload a local video clip. MP4, M4V, WebM, MOV, or OGV.');
      setPicked(null);
      return;
    }
    const sizeCheck = validateShowcaseFileSize(Number(asset.fileSize));
    if (!sizeCheck.ok) {
      setError(sizeCheck.error);
      setPicked(null);
      return;
    }
    const durationSec = asset.duration > 1000 ? asset.duration / 1000 : asset.duration;
    const check = validateShowcaseDuration(Number(durationSec));
    if (!check.ok) {
      setError(check.error);
      setPicked(null);
      return;
    }
    setPicked({
      uri: asset.uri,
      fileName,
      mimeType: asset.mimeType || 'video/mp4',
      duration: check.duration,
    });
  };

  const addVideo = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || !picked || !playerId) return;
    setAdding(true);
    setError(null);
    try {
      const upload = await stageClient.integrations.Core.UploadFile({
        file: {
          uri: picked.uri,
          name: picked.fileName,
          type: picked.mimeType,
        },
        timeoutMs: SHOWCASE_UPLOAD_TIMEOUT_MS,
      });
      const uploadedUrl = upload?.file_url || upload?.url;
      if (!uploadedUrl) throw new Error('Upload failed. Try a shorter clip.');

      const created = await stageClient.entities.PlayerShowcaseVideo.create({
        player_id: playerId,
        url: uploadedUrl,
        title: cleanTitle,
        duration_seconds: picked.duration,
        sort_order: videos.length,
      });
      setVideos((prev) => [...prev, created]);
      setTitle('');
      setPicked(null);
      onChanged?.();
    } catch (err) {
      setError(err?.message || 'Could not add that clip.');
    } finally {
      setAdding(false);
    }
  };

  const removeVideo = (video) => {
    Alert.alert('Remove clip?', video.title || 'This clip will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await stageClient.entities.PlayerShowcaseVideo.delete(video.id);
            setVideos((prev) => prev.filter((v) => v.id !== video.id));
            onChanged?.();
          } catch (err) {
            setError(err?.message || 'Could not remove that clip.');
          }
        },
      },
    ]);
  };

  const savePosition = async (next) => {
    setPosition(next);
    setShowPositions(false);
    setError(null);
    try {
      await stageClient.http.post('/player-showcase-videos/position', {
        player_id: playerId,
        showcase_position: next,
      });
      onChanged?.();
    } catch (err) {
      setError(err?.message || 'Could not save preferred position.');
    }
  };

  if (loading) {
    return (
      <View style={{ paddingVertical: 28, alignItems: 'center' }}>
        <ActivityIndicator color={tokens.cyan} />
      </View>
    );
  }

  const showPosition = canEdit || Boolean(position);

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="videocam-outline" size={22} color={tokens.cyan} />
            <Text style={[headingStyle, { color: tokens.text, fontSize: 18, letterSpacing: 18 * 0.03 }]}>Showcase</Text>
          </View>
          <Text style={{ color: tokens.muted, fontSize: 13, marginTop: 6, lineHeight: 18 }}>
            {canEdit
              ? 'Publish clips of how you play so clubs can find you. You own these — a scout can only watch them.'
              : 'Clips this player published for clubs to watch.'}
          </Text>
        </View>

        {showPosition ? (
          <View style={{ minWidth: 118 }}>
            <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, marginBottom: 6 }}>
              PREFERRED POSITION
            </Text>
            {canEdit ? (
              <TouchableOpacity
                onPress={() => setShowPositions(true)}
                style={{
                  minHeight: 44,
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: tokens.cyanBorder,
                  backgroundColor: tokens.inputFill,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                }}
              >
                <Text numberOfLines={1} style={{ color: position ? tokens.text : tokens.muted, fontSize: 13, fontWeight: '600' }}>
                  {position || 'Pick a position'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{
                borderWidth: 1,
                borderColor: tokens.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
              >
                <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: '600' }}>{position}</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {error ? (
        <View style={{
          backgroundColor: tokens.live ? hexToRgba(tokens.danger, 0.14) : tokens.dangerBg,
          borderWidth: 1,
          borderColor: hexToRgba(tokens.danger, 0.5),
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
        >
          <Text style={{ color: tokens.danger, fontSize: 13, fontWeight: '600' }}>{error}</Text>
        </View>
      ) : null}

      {videos.length === 0 ? (
        <View style={{
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: tokens.borderStrong,
          borderRadius: 16,
          paddingVertical: 28,
          paddingHorizontal: 16,
          alignItems: 'center',
        }}
        >
          <Text style={{ color: tokens.muted, fontSize: 14, textAlign: 'center' }}>
            {canEdit
              ? 'No clips yet. Add one below so clubs can scout you.'
              : 'No clips published yet.'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {videos.map((video) => (
            <View key={video.id} style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => setWatching(video)}
                activeOpacity={0.88}
                style={{
                  height: 168,
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: tokens.bgDeep,
                  borderWidth: 1,
                  borderColor: tokens.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                }}
              >
                <Ionicons name="play-circle" size={48} color={tokens.cyan} />
                <Text style={{ color: tokens.text, fontWeight: '700', marginTop: 8 }} numberOfLines={1}>
                  {video.title || 'Untitled clip'}
                </Text>
              </TouchableOpacity>
              {canEdit ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: tokens.muted, fontSize: 13, flex: 1 }} numberOfLines={1}>
                    {video.title || 'Untitled clip'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeVideo(video)}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Remove clip"
                    style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="trash-outline" size={20} color={tokens.muted} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {canEdit ? (
        <View style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.card,
          padding: 16,
          gap: 12,
        }}
        >
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Highlight title"
            placeholderTextColor={tokens.faint}
            maxLength={120}
            style={{
              color: tokens.text,
              height: 50,
              borderWidth: 1,
              borderColor: tokens.inputBorder,
              backgroundColor: tokens.inputFill,
              borderRadius: 12,
              paddingHorizontal: 14,
              fontSize: 15,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={pickClip}
              style={{
                flex: 1,
                minHeight: 50,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tokens.inputBorder,
                backgroundColor: tokens.inputFill,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="cloud-upload-outline" size={20} color={tokens.muted} />
              <Text style={{ color: tokens.muted, fontSize: 13, flex: 1 }} numberOfLines={1}>
                {picked ? picked.fileName : 'Choose a video from your device'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={addVideo}
              disabled={!title.trim() || !picked || adding}
              style={{
                minWidth: 78,
                minHeight: 50,
                borderRadius: 12,
                backgroundColor: (!title.trim() || !picked || adding) ? hexToRgba(tokens.cyan, 0.25) : tokens.cyan,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 12,
              }}
            >
              {adding ? (
                <ActivityIndicator color={tokens.onCyan} />
              ) : (
                <Text style={{ color: tokens.onCyan, fontWeight: '700', fontSize: 14 }}>+ Add</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={{ color: tokens.muted, fontSize: 12, lineHeight: 17 }}>
            {picked
              ? `Ready · ${picked.duration.toFixed(1)}s`
              : `Upload a local video clip, ${MAX_SHOWCASE_SECONDS} seconds max, ${MAX_SHOWCASE_MB} MB max. MP4, M4V, WebM, MOV, or OGV. No links.`}
          </Text>
        </View>
      ) : null}

      <Modal visible={showPositions} transparent animationType="fade" onRequestClose={() => setShowPositions(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: hexToRgba(tokens.bgDeep, 0.75), justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setShowPositions(false)}>
          <View style={{
            backgroundColor: tokens.bgDeep,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderWidth: 1,
            borderColor: tokens.border,
            padding: 20,
            maxHeight: '55%',
          }}
          >
            <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 16, marginBottom: 12 }}>Preferred position</Text>
            <ScrollView>
              {SHOWCASE_POSITIONS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  onPress={() => savePosition(pos)}
                  style={{
                    minHeight: 44,
                    justifyContent: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: tokens.border,
                  }}
                >
                  <Text style={{ color: pos === position ? tokens.cyan : tokens.text, fontWeight: '600' }}>{pos}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={Boolean(watching)} transparent animationType="slide" onRequestClose={() => setWatching(null)}>
        <View style={{ flex: 1, backgroundColor: tokens.bgDeep }}>
          <View style={{ paddingTop: 54, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setWatching(null)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={22} color={tokens.text} />
            </TouchableOpacity>
            <Text style={{ color: tokens.text, fontWeight: '700', marginLeft: 12, flex: 1 }} numberOfLines={1}>
              {watching?.title || 'Untitled clip'}
            </Text>
          </View>
          {watching ? (
            <VideoPlayer url={showcaseVideoUri(watching)} source="other" height={280} />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
