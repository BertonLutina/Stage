import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { findMiniApp } from '@/lib/miniApps';
import { DISCORD_INVITE_URL } from '@/lib/discordConfig';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';

const COPY = {
  transfers: {
    title: 'Transfer Market',
    body: 'Browse listed players, negotiate fees, and move talent during the window — coming to the STAGE app next.',
  },
  scouting: {
    title: 'Scouting',
    body: 'Review prospect reports and send contract offers from the club office. Mobile scouting is coming soon.',
  },
  wallet: {
    title: 'Wallet',
    body: 'Track STC balances, salaries, and spend. Full wallet tools are arriving in a later build.',
  },
  discord: {
    title: 'Discord',
    body: 'Join the official STAGE community for match news, free agents, and club chats.',
  },
};

export default function MiniAppPlaceholder() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const app = useMemo(() => findMiniApp(String(slug || '')), [slug]);
  const meta = COPY[String(slug)] || null;
  const title = meta?.title || app?.label || 'App';
  const body = meta?.body
    || `${title} is available on STAGE web today. We’re bringing it into the mobile app next.`;
  const icon = app?.icon || 'apps-outline';

  const openDiscord = async () => {
    if (!DISCORD_INVITE_URL) return;
    try {
      await Linking.openURL(DISCORD_INVITE_URL);
    } catch {
      /* ignore */
    }
  };

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', alignItems: 'center' }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <Text style={{
            flex: 1,
            marginLeft: 12,
            color: '#fff',
            fontWeight: '900',
            fontSize: 18,
            textTransform: 'uppercase',
            letterSpacing: -0.3,
          }}
          >
            {title}
          </Text>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center', paddingBottom: 40 }}>
          <LinearGradient
            colors={['rgba(0,240,255,0.16)', 'rgba(0,240,255,0.03)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              borderWidth: 1,
              borderColor: 'rgba(0,240,255,0.28)',
              padding: 28,
              alignItems: 'center',
            }}
          >
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: 'rgba(0,240,255,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(0,240,255,0.35)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
            >
              <Ionicons name={icon} size={34} color={CYAN} />
            </View>
            <Text style={{ color: CYAN, fontSize: 11, fontWeight: '900', letterSpacing: 2 }}>
              MINI APP
            </Text>
            <Text style={{
              color: '#fff',
              fontSize: 24,
              fontWeight: '900',
              marginTop: 8,
              textAlign: 'center',
            }}
            >
              {title}
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: 14,
              lineHeight: 21,
              marginTop: 12,
              textAlign: 'center',
            }}
            >
              {body}
            </Text>

            {slug === 'discord' && DISCORD_INVITE_URL ? (
              <TouchableOpacity
                onPress={openDiscord}
                activeOpacity={0.85}
                style={{
                  marginTop: 22,
                  minHeight: 48,
                  paddingHorizontal: 22,
                  borderRadius: 14,
                  backgroundColor: '#5865F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Open Discord</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.85}
                style={{
                  marginTop: 22,
                  minHeight: 48,
                  paddingHorizontal: 22,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(0,240,255,0.4)',
                  backgroundColor: 'rgba(0,240,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: CYAN, fontWeight: '800' }}>Back to Apps</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </SafeAreaView>
    </GamerProfileShell>
  );
}
