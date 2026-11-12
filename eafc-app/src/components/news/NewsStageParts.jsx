import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';

/** Underline tabs (WORLD / MERCATO / BEAT). Each tab is 44 high. */
export function NewsTabs({ tabs, value, onChange, accessibilityLabel }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: tokens.border }}
    >
      {tabs.map((tab) => {
        const selected = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderBottomWidth: 3,
              borderBottomColor: selected ? tokens.cyan : 'transparent',
              marginBottom: -1,
            }}
          >
            <Text
              style={{
                color: selected ? tokens.cyan : tokens.muted,
                fontSize: 13,
                fontWeight: '700',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Photo({ uri, height, width, radius }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: tokens.bgDeep,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: width === '100%' ? 0 : 1,
        borderColor: tokens.border,
      }}
    >
      {uri ? (
        <Image source={{ uri }} accessibilityIgnoresInvertColors style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <Ionicons name={width === '100%' ? 'image-outline' : 'newspaper-outline'} size={width === '100%' ? 40 : 26} color={tokens.borderStrong} />
      )}
    </View>
  );
}

/** The lead story: photo, HEADLINE kicker, title, time. */
export function HeadlineCard({ item, kicker, time }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View
      testID="news-headline"
      style={{
        borderRadius: 20,
        borderWidth: 1,
        borderColor: tokens.border,
        backgroundColor: tokens.card,
        overflow: 'hidden',
      }}
    >
      <Photo uri={item.photoUrl} width="100%" height={180} radius={0} />
      <View style={{ padding: 16, gap: 8 }}>
        <Text style={{ color: tokens.cyan, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' }}>
          {kicker}
        </Text>
        <Text style={{ color: tokens.text, fontSize: 21, lineHeight: 27, fontWeight: '800' }}>{item.title}</Text>
        {time ? <Text style={{ color: tokens.muted, fontSize: 13 }}>{time}</Text> : null}
      </View>
    </View>
  );
}

export function NewsRow({ item, meta, last }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 14,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: tokens.border,
      }}
    >
      <Photo uri={item.photoUrl} width={84} height={76} radius={16} />
      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <Text numberOfLines={3} style={{ color: tokens.text, fontSize: 16, lineHeight: 21, fontWeight: '700' }}>{item.title}</Text>
        {meta ? <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 13 }}>{meta}</Text> : null}
      </View>
    </View>
  );
}
