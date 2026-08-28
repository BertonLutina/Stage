import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localStorage } from '@/lib/polyfillStorage';
import { getPageWalkthrough } from '@/lib/pageWalkthroughs';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import { CARD_RADIUS } from '@/lib/stageTheme';
import {
  GAME_DAY_SILVER,
  TILE_BORDER,
  TILE_BORDER_HOT,
  TILE_FILL,
  TILE_FILL_LIVE,
  TILE_FILL_LIVE_INNER,
} from '@/components/dashboard/CommandCenterUI';
import { useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';

export default function PageWalkthrough() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const tokens = useGamerTokens();
  const [open, setOpen] = useState(false);
  const language = localStorage.getItem('language') || 'en';
  const guide = useMemo(() => getPageWalkthrough(pathname, language), [pathname, language]);
  const live = tokens.live === true;
  const panelFill = live ? TILE_FILL_LIVE : TILE_FILL;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!guide) return null;

  return (
    <>
      {!open ? (
        <TouchableOpacity
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${guide.label} guide`}
          style={{
            position: 'absolute',
            right: 16,
            bottom: Math.max(insets.bottom, 8) + 72,
            zIndex: 40,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            height: 36,
            paddingHorizontal: 12,
            backgroundColor: live ? 'rgba(0,0,0,0.35)' : TILE_FILL,
            borderWidth: 1,
            borderColor: TILE_BORDER_HOT,
            borderRadius: CARD_RADIUS,
          }}
        >
          <Ionicons name="help-circle-outline" size={14} color={GAME_DAY_SILVER} />
          <Text style={{
            color: GAME_DAY_SILVER,
            fontWeight: '900',
            fontSize: 11,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
          }}
          >
            GUIDE
          </Text>
        </TouchableOpacity>
      ) : null}

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <View
            style={{
              maxHeight: '78%',
              backgroundColor: panelFill,
              borderTopLeftRadius: CARD_RADIUS,
              borderTopRightRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: TILE_BORDER,
              paddingBottom: Math.max(insets.bottom, 16),
              overflow: 'hidden',
            }}
          >
            <View style={{
              height: 1,
              marginHorizontal: 20,
              marginTop: 14,
              marginBottom: 12,
              backgroundColor: TILE_BORDER,
            }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={[headingStyleSm, { color: GAME_DAY_SILVER, fontSize: 11, letterSpacing: 2 }]}>
                  {String(guide.label).toUpperCase()}
                </Text>
                <Text style={[headingStyle, { color: '#fff', fontSize: 22, marginTop: 6 }]}>
                  {guide.title}
                </Text>
                <Text style={{
                  color: 'rgba(238,243,251,0.45)',
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  marginTop: 6,
                }}
                >
                  {guide.steps.length} steps on this path
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                accessibilityLabel="Close guide"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: CARD_RADIUS,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: live ? TILE_FILL_LIVE_INNER : 'rgba(0,0,0,0.35)',
                  borderWidth: 1,
                  borderColor: TILE_BORDER,
                }}
              >
                <Ionicons name="close" size={16} color={GAME_DAY_SILVER} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}>
              {guide.steps.map((step, index) => (
                <View
                  key={`${guide.key}-${index}`}
                  style={{
                    flexDirection: 'row',
                    gap: 12,
                    alignItems: 'flex-start',
                    borderWidth: 1,
                    borderColor: TILE_BORDER,
                    backgroundColor: live ? TILE_FILL_LIVE_INNER : 'rgba(0,0,0,0.28)',
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: CARD_RADIUS,
                      borderWidth: 1,
                      borderColor: TILE_BORDER_HOT,
                      backgroundColor: 'rgba(0,0,0,0.35)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                    }}
                  >
                    <Text style={{ color: GAME_DAY_SILVER, fontSize: 11, fontWeight: '900' }}>{index + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, color: 'rgba(238,243,251,0.78)', fontSize: 14, lineHeight: 20 }}>{step}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={{ paddingHorizontal: 20 }}>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={{
                  minHeight: 44,
                  borderRadius: CARD_RADIUS,
                  backgroundColor: GAME_DAY_SILVER,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{
                  color: '#111827',
                  fontWeight: '900',
                  fontSize: 12,
                  letterSpacing: 1.6,
                  textTransform: 'uppercase',
                }}
                >
                  GOT IT
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
