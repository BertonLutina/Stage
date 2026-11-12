import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import VideoPlayer from '../../../components/common/VideoPlayer';
import api from '../../../utils/api';
import useThemeStore from '@/store/themeStore';
import { goBackInPlace } from '@/lib/navigationBack';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { Button, Chip, IconButton, Screen, SectionLabel, TextField } from '@/components/ui';
import { MIN_TOUCH } from '@/components/ui/metrics';

const SOURCES = [
  { key: 'youtube', label: 'YouTube' },
  { key: 'twitch', label: 'Twitch' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'kick', label: 'Kick' },
];

export default function UploadVideoScreen() {
  const { matchId } = useLocalSearchParams();
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('youtube');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const submit = async () => {
    if (!url) return;
    setSaving(true);
    try {
      await api.post(`/matches/${matchId}/video`, { video_url: url, video_source: source });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboardAvoiding>
      <View style={{ gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <IconButton icon="arrow-back" onPress={() => goBackInPlace(router)} accessibilityLabel="Back" />
          <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
            <SectionLabel>Upload video</SectionLabel>
          </View>
          <View style={{ width: MIN_TOUCH }} />
        </View>

        <Text
          numberOfLines={2}
          style={{
            color: tokens.text,
            fontFamily: FONT_EA_SPORTS,
            fontSize: 34,
            letterSpacing: 34 * 0.03,
            textTransform: 'uppercase',
          }}
        >
          Add match footage
        </Text>

        <View
          style={{
            borderRadius: 18,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: tokens.borderStrong,
            backgroundColor: tokens.bgDeep,
            padding: 16,
            gap: 14,
          }}
        >
          <View style={{ alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tokens.cyan,
                backgroundColor: tokens.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="link-outline" size={26} color={tokens.cyan} />
            </View>
            <Text style={{ color: tokens.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
              Add a video link
            </Text>
            <Text style={{ color: tokens.muted, fontSize: 13, textAlign: 'center' }}>
              YouTube, Twitch, TikTok or Kick
            </Text>
          </View>
          <TextField
            label="Video URL"
            value={url}
            onChangeText={setUrl}
            placeholder="https://..."
            autoCapitalize="none"
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: tokens.muted, fontSize: 12, fontWeight: '600' }}>Platform</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SOURCES.map((s) => (
              <Chip
                key={s.key}
                label={s.label}
                active={source === s.key}
                onPress={() => setSource(s.key)}
              />
            ))}
          </View>
        </View>

        {url && preview && <VideoPlayer url={url} source={source} height={200} radius={16} />}
        {url && !preview && <Button title="Preview Video" variant="secondary" onPress={() => setPreview(true)} />}
        <Button title="Publish video" onPress={submit} loading={saving} />
      </View>
    </Screen>
  );
}
