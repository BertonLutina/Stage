import React, { useMemo } from 'react';
import { Text, TouchableOpacity, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { findMiniApp } from '@/lib/miniApps';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';

export default function MiniAppFallback() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const app = useMemo(() => findMiniApp(String(slug || '')), [slug]);
  const title = app?.label || 'App';

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', alignItems: 'center' }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <Text style={{ flex: 1, marginLeft: 12, color: '#fff', fontWeight: '900', fontSize: 18 }}>
            {title}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <Ionicons name={app?.icon || 'apps-outline'} size={36} color={CYAN} />
          <Text style={{ color: '#fff', fontWeight: '800', marginTop: 12 }}>{title}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 8 }}>
            This app is not available on this build.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 20,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(0,240,255,0.4)',
              paddingHorizontal: 18,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: CYAN, fontWeight: '800' }}>Back to Apps</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GamerProfileShell>
  );
}
