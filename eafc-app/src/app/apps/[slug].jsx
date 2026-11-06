import React, { useMemo } from 'react';
import { Text, StatusBar, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { Button, Card, IconButton, Screen } from '@/components/ui';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { findMiniApp } from '@/lib/miniApps';

export default function MiniAppFallback() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const app = useMemo(() => findMiniApp(String(slug || '')), [slug]);
  const title = app?.label || 'App';

  return (
    <Screen scroll={false} tabBar={false}>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <IconButton icon="arrow-back" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text
          numberOfLines={1}
          style={{
            flexShrink: 1,
            color: tokens.muted,
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 11 * 0.12,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 28 }}>
          <Ionicons name={app?.icon || 'apps-outline'} size={36} color={tokens.cyan} />
          <Text
            numberOfLines={2}
            style={{
              color: tokens.text,
              fontFamily: FONT_EA_SPORTS,
              fontSize: 26,
              letterSpacing: 26 * 0.03,
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {title}
          </Text>
          <Text style={{ color: tokens.muted, textAlign: 'center', fontSize: 14 }}>
            This app is not available on this build.
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
            <Button title="Back to Apps" variant="secondary" onPress={() => router.back()} />
          </View>
        </Card>
      </View>
    </Screen>
  );
}
