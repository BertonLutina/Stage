import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { readAccountMode } from '@/lib/accountMode';
import { getMiniAppGroups, filterMiniAppGroups } from '@/lib/miniApps';
import { readStageTheme } from '@/lib/stageTheme';
import { headingStyle, headingStyleSm } from '@/lib/fonts';

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
        borderRadius: 18,
        borderWidth: 1,
        borderColor: ready ? theme.tileBorder : 'rgba(127,127,127,0.18)',
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
        borderRadius: 14,
        backgroundColor: theme.inputFill,
        borderWidth: 1,
        borderColor: ready ? theme.tileBorder : 'rgba(127,127,127,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      >
        <Ionicons
          name={item.icon}
          size={22}
          color={ready ? theme.primary : theme.muted}
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
  const theme = useMemo(() => readStageTheme(), [query, mode]);

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
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.barStyle} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <Text style={[headingStyleSm, { color: theme.primary, fontSize: 10, letterSpacing: 2, opacity: 0.8 }]}>
            STAGE
          </Text>
          <Text style={[headingStyle, { color: theme.text, marginTop: 2 }]}>
            Apps
          </Text>
          <Text style={{
            color: theme.muted,
            fontSize: 13,
            marginTop: 4,
            lineHeight: 18,
          }}
          >
            Find Transfers, Inbox, Wallet, and the rest of STAGE.
          </Text>

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
            <Ionicons name="search" size={20} color={theme.primary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search apps — Transfer, Inbox…"
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 20 }}
        >
          {groups.length === 0 ? (
            <View style={{
              paddingVertical: 48,
              alignItems: 'center',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.tileBorder,
              backgroundColor: theme.card,
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
                  color: theme.primary,
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  paddingHorizontal: 2,
                  opacity: 0.7,
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
