import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localStorage } from '@/lib/polyfillStorage';
import { getPageWalkthrough } from '@/lib/pageWalkthroughs';
import { headingStyle } from '@/lib/fonts';
import { hexToRgba } from '@/lib/stageTheme';
import useThemeStore from '@/store/themeStore';
import { Button, IconButton } from '@/components/ui';
import { BUTTON_RADIUS, MIN_TOUCH, guideFabBottom, guideFabBottomStack } from '@/components/ui/metrics';

export default function PageWalkthrough() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const tokens = useThemeStore((st) => st.tokens);
  const [open, setOpen] = useState(false);
  const language = localStorage.getItem('language') || 'en';
  const guide = useMemo(() => getPageWalkthrough(pathname, language), [pathname, language]);
  // /apps/* screens are stack pages: no floating tab bar to sit above.
  const onStack = /^\/apps(\/|$)/.test(pathname || '');
  const live = tokens.live === true;
  const innerFill = live ? hexToRgba(tokens.bgDeep, 0.55) : tokens.bgDeep;

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
            right: 20,
            bottom: onStack ? guideFabBottomStack(insets.bottom) : guideFabBottom(insets.bottom),
            zIndex: 40,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            minHeight: MIN_TOUCH,
            paddingHorizontal: 14,
            backgroundColor: tokens.card,
            borderWidth: 1,
            borderColor: tokens.borderStrong,
            borderRadius: BUTTON_RADIUS,
          }}
        >
          <Ionicons name="help-circle-outline" size={18} color={tokens.cyan} />
          <Text
            numberOfLines={1}
            style={{
              color: tokens.cyan,
              fontWeight: '700',
              fontSize: 12,
              letterSpacing: 12 * 0.12,
              textTransform: 'uppercase',
            }}
          >
            GUIDE
          </Text>
        </TouchableOpacity>
      ) : null}

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: tokens.overlay, justifyContent: 'flex-end' }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setOpen(false)}
            accessibilityLabel="Dismiss guide"
          />
          <View
            style={{
              maxHeight: '78%',
              backgroundColor: tokens.card,
              borderTopLeftRadius: tokens.cardRadius,
              borderTopRightRadius: tokens.cardRadius,
              borderWidth: 1,
              borderColor: tokens.border,
              paddingBottom: Math.max(insets.bottom, 16),
              overflow: 'hidden',
            }}
          >
            <View style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              marginTop: 10,
              backgroundColor: tokens.borderStrong,
            }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: tokens.muted,
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 11 * 0.12,
                    textTransform: 'uppercase',
                  }}
                >
                  {String(guide.label).toUpperCase()}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[headingStyle, { color: tokens.text, fontSize: 24, marginTop: 6, letterSpacing: 24 * 0.03 }]}
                >
                  {guide.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ color: tokens.muted, fontSize: 13, marginTop: 6 }}
                >
                  {guide.steps.length} steps on this path
                </Text>
              </View>
              <IconButton icon="close" accessibilityLabel="Close guide" onPress={() => setOpen(false)} />
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 10 }}>
              {guide.steps.map((step, index) => (
                <View
                  key={`${guide.key}-${index}`}
                  style={{
                    flexDirection: 'row',
                    gap: 12,
                    alignItems: 'flex-start',
                    borderWidth: 1,
                    borderColor: tokens.border,
                    borderRadius: tokens.cardRadius,
                    backgroundColor: innerFill,
                    padding: 14,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: tokens.cyanBorder,
                      backgroundColor: tokens.bgDeep,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '700' }}>{index + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, color: tokens.textSoft, fontSize: 14, lineHeight: 20 }}>{step}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={{ paddingHorizontal: 20 }}>
              <Button title="GOT IT" onPress={() => setOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
