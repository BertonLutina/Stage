import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import VideoPlayer from '../../../components/common/VideoPlayer';
import api from '../../../utils/api';

const SOURCES = [
  { key: 'youtube', label: 'YouTube', color: 'bg-red-500/20 border-red-500' },
  { key: 'twitch', label: 'Twitch', color: 'bg-purple-500/20 border-purple-500' },
  { key: 'tiktok', label: 'TikTok', color: 'bg-pink-500/20 border-pink-500' },
  { key: 'kick', label: 'Kick', color: 'bg-secondary/20 border-secondary' },
];

export default function UploadVideoScreen() {
  const { matchId } = useLocalSearchParams();
  const router = useRouter();
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
    <SafeAreaView className="flex-1">
      <ScrollView className="px-6">
        <Text className="text-white text-xl font-bold mt-6 mb-6">Add Match Video</Text>
        <Text className="text-white font-semibold mb-3">Platform</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {SOURCES.map(s => (
            <TouchableOpacity key={s.key} onPress={() => setSource(s.key)}
              className={`px-4 py-2 rounded-xl border ${source === s.key ? s.color : 'bg-card border-border'}`}>
              <Text className="text-white font-semibold">{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input label="Video URL" value={url} onChangeText={setUrl} placeholder="https://..." autoCapitalize="none" />
        {url && preview && <VideoPlayer url={url} source={source} height={200} />}
        {url && !preview && <Button title="Preview Video" variant="ghost" onPress={() => setPreview(true)} className="mb-4" />}
        <Button title="Save Video" onPress={submit} loading={saving} className="mt-2 mb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
