import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { stageClient, resolveMyPlayerAndClub } from '@/api/stageClient';
import useAuthStore from '@/store/authStore';
import { findMyFollow, isSelfFollow, toggleFollow } from '@/lib/followTarget';
import useThemeStore from '@/store/themeStore';

export default function FollowToggleButton({
  targetType,
  targetId,
  targetName,
  accent = 'cyan',
  hidden = false,
  compact = false,
}) {
  const { user } = useAuthStore();
  const tokens = useThemeStore((st) => st.tokens);
  const [follow, setFollow] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [self, setSelf] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (hidden || !targetId || !user?.id) {
        setSelf(false);
        setFollow(null);
        setReady(true);
        return;
      }
      setReady(false);
      const { player } = await resolveMyPlayerAndClub().catch(() => ({ player: null }));
      if (cancelled) return;
      if (isSelfFollow({
        targetType,
        targetId,
        userId: user.id,
        playerId: player?.id,
      })) {
        setSelf(true);
        setFollow(null);
        setReady(true);
        return;
      }
      setSelf(false);
      const row = await findMyFollow(stageClient, {
        followerId: user.id,
        followerEmail: user.email,
        followerPlayerId: player?.id,
        targetType,
        targetId,
      });
      if (!cancelled) {
        setFollow(row);
        setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [hidden, targetId, targetType, user?.email, user?.id]);

  const onPress = useCallback(async () => {
    if (busy || !ready || !user?.id || !targetId) return;
    setBusy(true);
    try {
      const { player } = await resolveMyPlayerAndClub().catch(() => ({ player: null }));
      const next = await toggleFollow(stageClient, {
        existing: follow,
        followerId: user.id,
        followerEmail: user.email,
        followerPlayerId: player?.id,
        targetType,
        targetId,
        targetName,
      });
      setFollow(next);
    } catch {
      /* keep the last known follow state */
    } finally {
      setBusy(false);
    }
  }, [busy, follow, ready, targetId, targetName, targetType, user?.email, user?.id]);

  if (hidden || self || !targetId || !user?.id) return null;

  const following = Boolean(follow?.id);
  const label = following ? 'Unfollow' : 'Follow';
  const accentColor = accent === 'amber' ? tokens.amber : tokens.cyan;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={busy || !ready}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: following, busy }}
      style={{ flex: compact ? 1 : undefined, minHeight: 44, opacity: busy || !ready ? 0.7 : 1 }}
    >
      {following ? (
        <View
          style={{
            height: 52,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: accentColor,
            backgroundColor: 'transparent',
          }}
        >
          {busy ? (
            <ActivityIndicator color={accentColor} />
          ) : (
            <Text style={{ color: accentColor, fontSize: 15, fontWeight: '600' }}>
              {label}
            </Text>
          )}
        </View>
      ) : (
        <View
          style={{
            height: 52,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: accentColor,
          }}
        >
          {busy ? (
            <ActivityIndicator color={tokens.onCyan} />
          ) : (
            <Text style={{ color: tokens.onCyan, fontSize: 15, fontWeight: '700' }}>
              {label}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
