import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { MIN_TOUCH } from '@/components/ui/metrics';

const ROW_H = 80;
const AVATAR = 48;

/**
 * Search card layout (fixed):
 *
 *  [photo]  NAME  [POS]              VIEW PROFILE
 *           country · console
 *
 * Photo left · infos immediately right of photo · VIEW PROFILE flush right.
 */
export default function DirectoryResultRow({
  imageUrl,
  bannerUrl,
  initials,
  name,
  badges = [],
  meta,
  actionLabel = 'VIEW PROFILE',
  actionPrimary = false,
  onPress,
  onAction,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const [pressed, setPressed] = useState(false);
  const badgeList = (Array.isArray(badges) ? badges : [badges]).filter(Boolean);
  const badgeText = badgeList.map((b) => String(b).toUpperCase()).join(' / ');
  const a11y = [name, badgeText || null, meta].filter(Boolean).join(', ');
  const accent = tokens.accent;
  const actionHot = pressed || actionPrimary;
  const backdrop = bannerUrl || null;

  return (
    <View style={styles.card}>
      {/* Layer 0 — banner */}
      {backdrop ? (
        <Image source={{ uri: backdrop }} style={styles.banner} resizeMode="cover" />
      ) : (
        <View style={[styles.banner, { backgroundColor: tokens.bgDeep }]} />
      )}

      {/* Layer 1 — dark wash so text stays readable */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.82)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.82)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.wash}
      />

      {/* Layer 2 — content ON the card */}
      <View style={styles.row}>
        {/* LEFT BLOCK: avatar + infos (side by side) */}
        <Pressable
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          accessibilityRole="button"
          accessibilityLabel={a11y}
          style={styles.leftHit}
        >
          <View style={styles.leftRow}>
            <View style={styles.avatarWrap}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.initials}>
                    {String(initials || '?').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={[styles.name, { color: tokens.text }]}>
                  {name}
                </Text>
                {badgeText ? (
                  <View style={[styles.badge, { backgroundColor: 'rgba(95,227,232,0.2)' }]}>
                    <Text style={[styles.badgeText, { color: accent }]}>{badgeText}</Text>
                  </View>
                ) : null}
              </View>
              {meta ? (
                <Text numberOfLines={1} style={styles.meta}>
                  {meta}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>

        {/* RIGHT: VIEW PROFILE flush to card edge */}
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel} ${name}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 0 }}
            style={styles.actionHit}
          >
            <Text
              numberOfLines={1}
              style={[styles.action, { color: actionHot ? accent : 'rgba(255,255,255,0.4)' }]}
            >
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: ROW_H,
    overflow: 'hidden',
    position: 'relative',
  },
  banner: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  wash: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  row: {
    zIndex: 2,
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 10,
  },
  leftHit: {
    flex: 1,
    minWidth: 0,
    height: ROW_H,
    justifyContent: 'center',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
    marginRight: 10,
    flexShrink: 0,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
  },
  avatarFallback: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONT_EA_SPORTS,
    fontSize: 16,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flexShrink: 1,
    marginRight: 6,
  },
  badge: {
    flexShrink: 0,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  meta: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    lineHeight: 14,
  },
  actionHit: {
    flexShrink: 0,
    height: ROW_H,
    minWidth: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  action: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
});
