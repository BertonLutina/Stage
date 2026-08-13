import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { stageClient } from '@/api/stageClient';
import VideoPlayer from '@/components/common/VideoPlayer';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
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
        <ActivityIndicator color={CYAN} />
      </View>
    );
  }

  const showPosition = canEdit || Boolean(position);

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="videocam" size={16} color={CYAN} />
            <Text style={[headingStyle, { color: '#fff', fontSize: 16 }]}>Showcase</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 6, lineHeight: 17 }}>
            {canEdit
              ? 'Publish clips of how you play so clubs can find you. You own these — a scout can only watch them.'
              : 'Clips this player published for clubs to watch.'}
          </Text>
        </View>

        {showPosition ? (
          <View style={{ minWidth: 118 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 }}>
              PREFERRED POSITION
            </Text>
            {canEdit ? (
              <TouchableOpacity
                onPress={() => setShowPositions(true)}
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(0,240,255,0.28)',
                  backgroundColor: 'rgba(0,0,0,0.28)',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 9,
                }}
              >
                <Text style={{ color: position ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '800' }}>
                  {position || 'Pick a position'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 9,
              }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>{position}</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {error ? (
        <View style={{
          backgroundColor: 'rgba(255,77,109,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(255,77,109,0.35)',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
        >
          <Text style={{ color: '#FF4D6D', fontSize: 12, fontWeight: '700' }}>{error}</Text>
        </View>
      ) : null}

      {videos.length === 0 ? (
        <View style={{
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: 'rgba(255,255,255,0.16)',
          borderRadius: 16,
          paddingVertical: 28,
          paddingHorizontal: 16,
          alignItems: 'center',
        }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center' }}>
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
                  backgroundColor: '#000',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
                <Text style={{ color: '#fff', fontWeight: '800', marginTop: 8 }} numberOfLines={1}>
                  {video.title || 'Untitled clip'}
                </Text>
              </TouchableOpacity>
              {canEdit ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, flex: 1 }} numberOfLines={1}>
                    {video.title || 'Untitled clip'}
                  </Text>
                  <TouchableOpacity onPress={() => removeVideo(video)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.45)" />
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
          borderColor: 'rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(255,255,255,0.04)',
          padding: 12,
          gap: 10,
        }}
        >
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Highlight title"
            placeholderTextColor="rgba(255,255,255,0.35)"
            maxLength={120}
            style={{
              color: '#fff',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={pickClip}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.14)',
                backgroundColor: 'rgba(0,0,0,0.28)',
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="rgba(255,255,255,0.55)" />
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, flex: 1 }} numberOfLines={1}>
                {picked ? picked.fileName : 'Choose a video from your device'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={addVideo}
              disabled={!title.trim() || !picked || adding}
              style={{
                minWidth: 78,
                borderRadius: 10,
                backgroundColor: (!title.trim() || !picked || adding) ? 'rgba(0,240,255,0.25)' : CYAN,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 12,
              }}
            >
              {adding ? (
                <ActivityIndicator color="#031018" />
              ) : (
                <Text style={{ color: '#031018', fontWeight: '900', fontSize: 12 }}>+ Add</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 16 }}>
            {picked
              ? `Ready · ${picked.duration.toFixed(1)}s`
              : `Upload a local video clip, ${MAX_SHOWCASE_SECONDS} seconds max, ${MAX_SHOWCASE_MB} MB max. MP4, M4V, WebM, MOV, or OGV. No links.`}
          </Text>
        </View>
      ) : null}

      <Modal visible={showPositions} transparent animationType="fade" onRequestClose={() => setShowPositions(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setShowPositions(false)}>
          <View style={{
            backgroundColor: '#0A1222',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 16,
            maxHeight: '55%',
          }}
          >
            <Text style={{ color: '#fff', fontWeight: '900', marginBottom: 12 }}>Preferred position</Text>
            <ScrollView>
              {SHOWCASE_POSITIONS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  onPress={() => savePosition(pos)}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Text style={{ color: pos === position ? CYAN : '#fff', fontWeight: '800' }}>{pos}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={Boolean(watching)} transparent animationType="slide" onRequestClose={() => setWatching(null)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ paddingTop: 54, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setWatching(null)} hitSlop={10}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 12, flex: 1 }} numberOfLines={1}>
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
