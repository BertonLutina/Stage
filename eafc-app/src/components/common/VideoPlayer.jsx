import React from 'react';
import { View, Text } from 'react-native';
import WebView from 'react-native-webview';
import useThemeStore from '@/store/themeStore';

function getEmbedUrl(url, source) {
  if (!url) return null;
  if (source === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    const id = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}?autoplay=0` : url;
  }
  if (source === 'twitch' || url.includes('twitch.tv')) {
    const clip = url.match(/clips\.twitch\.tv\/([^?/]+)/)?.[1];
    if (clip) return `https://clips.twitch.tv/embed?clip=${clip}&parent=localhost`;
    const channel = url.match(/twitch\.tv\/([^?/]+)/)?.[1];
    if (channel) return `https://player.twitch.tv/?channel=${channel}&parent=localhost`;
  }
  if (source === 'kick' || url.includes('kick.com')) {
    return url;
  }
  if (source === 'tiktok' || url.includes('tiktok.com')) {
    return url;
  }
  return url;
}

/**
 * Embedded video. `radius` defaults to 12; pass 0 for an edge-to-edge player.
 */
export default function VideoPlayer({ url, source, height = 220, radius = 12 }) {
  const tokens = useThemeStore((st) => st.tokens);
  const embedUrl = getEmbedUrl(url, source);
  if (!embedUrl) {
    return (
      <View
        style={{
          height,
          borderRadius: radius,
          backgroundColor: tokens.bgDeep,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: tokens.muted }}>No video</Text>
      </View>
    );
  }
  return (
    <View style={{ height, borderRadius: radius, overflow: 'hidden', backgroundColor: tokens.bgDeep }}>
      <WebView
        source={{ uri: embedUrl }}
        style={{ flex: 1, backgroundColor: tokens.bgDeep }}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
      />
    </View>
  );
}
