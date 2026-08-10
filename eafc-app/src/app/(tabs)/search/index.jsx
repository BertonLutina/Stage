import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { readAccountMode } from '@/lib/accountMode';
import { getMiniAppGroups, filterMiniAppGroups } from '@/lib/miniApps';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import {
  GamerProfileShell,
  CYAN,
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';

function AppTile({ item, onPress }) {
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
        borderColor: item.ready ? 'rgba(0,240,255,0.22)' : 'rgba(255,255,255,0.08)',
        backgroundColor: item.ready ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.03)',
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
        backgroundColor: 'rgba(0,0,0,0.28)',
        borderWidth: 1,
        borderColor: item.ready ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      >
        <Ionicons
          name={item.icon}
          size={22}
          color={item.ready ? CYAN : 'rgba(255,255,255,0.55)'}
        />
      </View>
      <Text
        numberOfLines={2}
        style={{
          color: item.ready ? '#fff' : 'rgba(255,255,255,0.62)',
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
 * Apps launcher — opened from the tab search button.
 * Searchable grid of Stage destinations (Transfers, Inbox, …).
 */
export default function SearchIndex() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const mode = readAccountMode() || 'player';

  const groups = useMemo(
    () => filterMiniAppGroups(getMiniAppGroups(mode), query),
    [mode, query],
  );

  const openApp = (item) => {
    if (!item?.href) return;
    router.push(item.href);
  };

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <Text style={[headingStyleSm, { color: 'rgba(0,240,255,0.7)', fontSize: 10, letterSpacing: 2 }]}>
            STAGE
          </Text>
          <Text style={[headingStyle, { color: '#fff', marginTop: 2 }]}>
            Apps
          </Text>
          <Text style={{
            color: 'rgba(255,255,255,0.45)',
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
            borderColor: 'rgba(0,240,255,0.28)',
            backgroundColor: 'rgba(255,255,255,0.04)',
            paddingHorizontal: 14,
          }}
          >
            <Ionicons name="search" size={20} color={CYAN} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search apps — Transfer, Inbox…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              style={{
                flex: 1,
                color: '#fff',
                fontSize: 16,
                paddingVertical: 12,
              }}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.4)" />
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
              borderColor: 'rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.03)',
            }}
            >
              <Ionicons name="search-outline" size={36} color="rgba(255,255,255,0.25)" />
              <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 12, fontWeight: '700' }}>
                No apps match “{query.trim()}”
              </Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.id} style={{ gap: 10 }}>
                <Text style={{
                  color: 'rgba(0,240,255,0.45)',
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
                    <AppTile key={item.id} item={item} onPress={() => openApp(item)} />
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </GamerProfileShell>
  );
}
