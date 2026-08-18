import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { stageClient, resolveMyPlayerAndClub } from '@/api/stageClient';
import useAuthStore from '@/store/authStore';
import { findMyFollow, isSelfFollow, toggleFollow } from '@/lib/followTarget';
import { AMBER, CYAN } from '@/components/profile/gamer/GamerProfileUI';

const ACCENTS = {
  cyan: { fill: ['#00F0FF', '#00C2B3'], text: '#041018', outline: CYAN },
  amber: { fill: ['#FFD60A', '#C9A227'], text: '#1A1200', outline: AMBER },
};

export default function FollowToggleButton({
  targetType,
  targetId,
  targetName,
  accent = 'cyan',
  hidden = false,
  compact = false,
}) {
  const { user } = useAuthStore();
  const [follow, setFollow] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [self, setSelf] = useState(false);
  const palette = ACCENTS[accent] || ACCENTS.cyan;

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
            minHeight: 44,
            paddingVertical: 13,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.outline,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        >
          {busy ? (
            <ActivityIndicator color={palette.outline} />
          ) : (
            <Text style={{
              color: '#fff',
              fontSize: 12,
              fontWeight: '900',
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
            >
              {label}
            </Text>
          )}
        </View>
      ) : (
        <LinearGradient
          colors={palette.fill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 44 }}
        >
          {busy ? (
            <ActivityIndicator color={palette.text} />
          ) : (
            <Text style={{
              color: palette.text,
              fontSize: 12,
              fontWeight: '900',
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
            >
              {label}
            </Text>
          )}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}
