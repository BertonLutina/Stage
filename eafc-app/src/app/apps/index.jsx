import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { readAccountMode } from '@/lib/accountMode';
import { filterMiniAppGroups, getMiniAppGroups } from '@/lib/miniApps';
import { IconButton, Screen, SectionLabel } from '@/components/ui';
import DirectorySearchField from '@/components/directory/DirectorySearchField';
import { PageTitle } from '@/components/theme/PageTile';

const TILE = 72;
const TILE_RADIUS = 20;

function AppTile({ item, onPress, tokens }) {
  const ready = Boolean(item.ready);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={({ pressed }) => ({
        width: '23%',
        minWidth: 72,
        alignItems: 'center',
        gap: 8,
        opacity: pressed ? 0.85 : 1,
        borderColor: ready ? tokens.borderStrong : tokens.border,
      })}
    >
      <View
        style={{
          width: TILE,
          height: TILE,
          borderRadius: TILE_RADIUS,
          borderWidth: 1,
          borderColor: ready ? tokens.borderStrong : tokens.border,
          backgroundColor: tokens.card,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={item.icon} size={30} color={ready ? tokens.cyan : tokens.muted} />
      </View>
      <Text
        numberOfLines={2}
        style={{
          color: ready ? tokens.text : tokens.muted,
          fontSize: 12,
          fontWeight: '600',
          textAlign: 'center',
          lineHeight: 15,
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

/** App directory — Club / Compete / Account, matching the Stage Apps mockup. */
export default function AppsIndex() {
  const router = useRouter();
  const tokens = useThemeStore((state) => state.tokens);
  const [query, setQuery] = useState('');
  const [openingClub, setOpeningClub] = useState(false);
  const mode = readAccountMode() || 'player';
  const groups = useMemo(() => filterMiniAppGroups(getMiniAppGroups(mode), query), [mode, query]);

  const openMyClub = async () => {
    if (openingClub) return;
    setOpeningClub(true);
    try {
      const identity = await resolveMyPlayerAndClub();
      const club = identity?.presidentClub || identity?.club;
      const clubId = club?.id || identity?.player?.club_id;
      if (!clubId) {
        Alert.alert('My club', 'Join or create a club first.');
        return;
      }
      router.push({ pathname: '/apps/club/[id]', params: { id: String(clubId) } });
    } catch (err) {
      Alert.alert('My club', err?.message || 'Could not open your club.');
    } finally {
      setOpeningClub(false);
    }
  };

  const openApp = (item) => {
    if (!item?.href) return;
    if (item.href === 'my-club') {
      openMyClub();
      return;
    }
    router.push(item.params ? { pathname: item.href, params: item.params } : item.href);
  };

  return (
    <Screen tabBar={false}>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon="arrow-back" accessibilityLabel="Back" onPress={() => router.back()} />
          <SectionLabel>Apps</SectionLabel>
          <View style={{ width: 44, height: 44 }} />
        </View>

        <PageTitle title="APP DIRECTORY" padded={false} style={{ paddingBottom: 0 }} />

        <DirectorySearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search apps"
          clearLabel="Clear search"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />

        {groups.length === 0 ? (
          <View
            style={{
              paddingVertical: 40,
              alignItems: 'center',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.border,
            }}
          >
            <Ionicons name="search-outline" size={36} color={tokens.muted} />
            <Text style={{ color: tokens.muted, marginTop: 12, fontWeight: '700', textAlign: 'center', paddingHorizontal: 16 }}>
              {`No apps match “${query.trim()}”`}
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.id} style={{ gap: 12 }}>
              <SectionLabel>{group.label}</SectionLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-start' }}>
                {group.items.map((item) => (
                  <AppTile key={item.id} item={item} tokens={tokens} onPress={() => openApp(item)} />
                ))}
              </View>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}
