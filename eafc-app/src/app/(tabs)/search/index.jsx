import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { readAccountMode } from '@/lib/accountMode';
import { getMiniAppGroups, filterMiniAppGroups } from '@/lib/miniApps';
import { GamerProfileShell, useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { GAME_DAY_SILVER, TILE_BORDER } from '@/components/dashboard/CommandCenterUI';
import PageTile, { PageTitle } from '@/components/theme/PageTile';
import { CARD_RADIUS } from '@/lib/stageTheme';

function AppTile({ item, onPress, theme }) {
  const ready = Boolean(item.ready);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={{
        width: '31%',
        minHeight: 104,
        borderRadius: CARD_RADIUS,
        borderWidth: 1,
        borderColor: ready ? TILE_BORDER : 'rgba(127,127,127,0.18)',
        backgroundColor: ready ? theme.tileFill : theme.card,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 14,
        gap: 10,
      }}
    >
      <View style={{
        width: 44,
        height: 44,
        borderRadius: CARD_RADIUS,
        backgroundColor: theme.inputFill,
        borderWidth: 1,
        borderColor: ready ? TILE_BORDER : 'rgba(127,127,127,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      >
        <Ionicons
          name={item.icon}
          size={22}
          color={ready ? GAME_DAY_SILVER : theme.muted}
        />
      </View>
      <Text
        numberOfLines={2}
        style={{
          color: ready ? theme.text : theme.muted,
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          textAlign: 'center',
          lineHeight: 14,
        }}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Apps launcher — opened from the tab Apps button.
 * Searchable grid of Stage destinations that are not already in the native tabs.
 */
export default function SearchIndex() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const mode = readAccountMode() || 'player';
  const theme = useGamerTokens();

  const groups = useMemo(
    () => filterMiniAppGroups(getMiniAppGroups(mode), query),
    [mode, query],
  );

  const openApp = (item) => {
    if (!item?.href) return;
    if (item.params) {
      router.push({ pathname: item.href, params: item.params });
      return;
    }
    router.push(item.href);
  };

  return (
    <GamerProfileShell>
      <StatusBar barStyle={theme.barStyle} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <PageTitle
            eyebrow="STAGE"
            title="APPS"
            subtitle="Find players, clubs, transfers, inbox, and settings."
            padded={false}
          />

          <View style={{
            marginTop: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            minHeight: 50,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.inputBorder,
            backgroundColor: theme.inputFill,
            paddingHorizontal: 14,
          }}
          >
            <Ionicons name="search" size={20} color={GAME_DAY_SILVER} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search — players, clubs, inbox…"
              placeholderTextColor={theme.muted}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              style={{
                flex: 1,
                color: theme.text,
                fontSize: 16,
                paddingVertical: 12,
              }}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={20} color={theme.muted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        >
          <PageTile
            tileKey="apps"
            tileTitle="APPS"
            contentStyle={{ paddingHorizontal: 12, gap: 16 }}
          >
          {groups.length === 0 ? (
            <View style={{
              paddingVertical: 48,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: TILE_BORDER,
            }}
            >
              <Ionicons name="search-outline" size={36} color={theme.muted} />
              <Text style={{ color: theme.muted, marginTop: 12, fontWeight: '700' }}>
                No apps match “{query.trim()}”
              </Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.id} style={{ gap: 10 }}>
                <Text style={{
                  color: GAME_DAY_SILVER,
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  paddingHorizontal: 2,
                }}
                >
                  {group.label}
                </Text>
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
                >
                  {group.items.map((item) => (
                    <AppTile key={item.id} item={item} theme={theme} onPress={() => openApp(item)} />
                  ))}
                </View>
              </View>
            ))
          )}
          </PageTile>
        </ScrollView>
      </SafeAreaView>
    </GamerProfileShell>
  );
}
