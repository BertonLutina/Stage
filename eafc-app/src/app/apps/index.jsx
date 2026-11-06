import React, { useMemo, useState } from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { readAccountMode } from '@/lib/accountMode';
import { filterMiniAppGroups, getMiniAppGroups } from '@/lib/miniApps';
import { IconButton, Screen, SectionLabel } from '@/components/ui';
import { AVATAR_RADIUS, AVATAR_SIZE, ICON_SIZE } from '@/components/ui/metrics';
import { innerTileChrome } from '@/components/dashboard/CommandCenterUI';
import DirectorySearchField from '@/components/directory/DirectorySearchField';
import PageTile, { PageTitle } from '@/components/theme/PageTile';

function AppTile({ item, onPress, tokens }) {
  const ready = Boolean(item.ready);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={({ pressed }) => [innerTileChrome(tokens, {
        width: '31%', minHeight: 104,
        borderColor: ready ? tokens.borderStrong : tokens.border,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 8, paddingVertical: 14, gap: 10,
        opacity: pressed ? 0.85 : 1,
      })]}
    >
      <View style={{
        width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_RADIUS,
        backgroundColor: tokens.border, alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={item.icon} size={ICON_SIZE} color={ready ? tokens.cyanHi : tokens.muted} />
      </View>
      <Text numberOfLines={2} style={{
        color: ready ? tokens.text : tokens.muted, fontSize: 11, fontWeight: '700',
        letterSpacing: 0.6, textTransform: 'uppercase', textAlign: 'center', lineHeight: 14,
      }}>
        {item.label}
      </Text>
    </Pressable>
  );
}

/** Dedicated launcher for destinations that do not belong in the native tabs. */
export default function AppsIndex() {
  const router = useRouter();
  const tokens = useThemeStore((state) => state.tokens);
  const [query, setQuery] = useState('');
  const mode = readAccountMode() || 'player';
  const groups = useMemo(() => filterMiniAppGroups(getMiniAppGroups(mode), query), [mode, query]);

  const openApp = (item) => {
    if (!item?.href) return;
    router.push(item.params ? { pathname: item.href, params: item.params } : item.href);
  };

  return (
    <Screen>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ gap: 14 }}>
        <View style={{ alignSelf: 'flex-start' }}>
          <IconButton icon="arrow-back" accessibilityLabel="Back" onPress={() => router.back()} />
        </View>
        <PageTitle title="APPS" subtitle="Stage destinations, tools, and account services." padded={false} style={{ paddingBottom: 0 }} />
        <DirectorySearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search apps"
          clearLabel="Clear search"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        <PageTile tileKey="apps" tileTitle="APPS" contentStyle={{ paddingHorizontal: 12, gap: 16 }}>
          {groups.length === 0 ? (
            <View style={{
              paddingVertical: 40, alignItems: 'center', borderRadius: 12,
              borderWidth: 1, borderColor: tokens.border,
            }}>
              <Ionicons name="search-outline" size={36} color={tokens.muted} />
              <Text style={{ color: tokens.muted, marginTop: 12, fontWeight: '700', textAlign: 'center', paddingHorizontal: 16 }}>
                No apps match “{query.trim()}”
              </Text>
            </View>
          ) : groups.map((group) => (
            <View key={group.id} style={{ gap: 10 }}>
              <SectionLabel>{group.label}</SectionLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {group.items.map((item) => (
                  <AppTile key={item.id} item={item} tokens={tokens} onPress={() => openApp(item)} />
                ))}
              </View>
            </View>
          ))}
        </PageTile>
      </View>
    </Screen>
  );
}
