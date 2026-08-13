import React, { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import AppDirectoryScreen, { DirectoryRow, FilterChips } from '@/components/apps/AppDirectoryScreen';
import { PLAYER_POSITIONS, loadScouting, playerDisplayName, timeAgo } from '@/lib/stageDirectories';

export default function ScoutingScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [position, setPosition] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await loadScouting({
      filter: 'recent',
      position: position === 'All' ? undefined : position,
    });
    setVideos(rows);
    setLoading(false);
    setRefreshing(false);
  }, [position]);

  useEffect(() => { load(); }, [load]);

  return (
    <AppDirectoryScreen
      title="Scouting"
      subtitle={`${videos.length} clips`}
      extraFilters={<FilterChips options={PLAYER_POSITIONS} value={position} onChange={setPosition} />}
      loading={loading}
      refreshing={refreshing}
      onRefresh={() => { setRefreshing(true); load(); }}
      data={videos}
      keyExtractor={(item) => String(item.id)}
      emptyIcon="eye-outline"
      emptyText="No scouting clips"
      renderItem={({ item }) => (
        <DirectoryRow
          title={item.title || playerDisplayName(item.player) || 'Showcase'}
          subtitle={[item.position || item.player?.position, item.country || item.player?.country_code, timeAgo(item.created_date || item.published_at)].filter(Boolean).join(' · ')}
          imageUrl={item.thumbnail_url || item.player?.avatar_url}
          fallbackIcon="videocam-outline"
          badge={item.views != null ? `${item.views}` : 'Clip'}
          onPress={() => {
            if (item.player_id) {
              router.push({
                pathname: '/(tabs)/profile/profilescreen',
                params: { playerId: String(item.player_id) },
              });
              return;
            }
            if (item.video_url) Linking.openURL(item.video_url).catch(() => {});
          }}
        />
      )}
    />
  );
}
