import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localStorage } from '@/lib/polyfillStorage';
import { getPageWalkthrough } from '@/lib/pageWalkthroughs';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';

export default function PageWalkthrough() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const language = localStorage.getItem('language') || 'en';
  const guide = useMemo(() => getPageWalkthrough(pathname, language), [pathname, language]);

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
            backgroundColor: 'rgba(8,14,28,0.92)',
            borderWidth: 1,
            borderColor: 'rgba(0,240,255,0.35)',
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Ionicons name="help-circle-outline" size={18} color={CYAN} />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.6 }}>GUIDE</Text>
        </TouchableOpacity>
      ) : null}

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <View
            style={{
              maxHeight: '78%',
              backgroundColor: '#0B1220',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              paddingBottom: Math.max(insets.bottom, 16),
            }}
          >
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: CYAN, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
                  {String(guide.label).toUpperCase()}
                </Text>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 4 }}>{guide.title}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 }}>
                  {guide.steps.length} steps on this path
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                accessibilityLabel="Close guide"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 12 }}>
              {guide.steps.map((step, index) => (
                <View key={`${guide.key}-${index}`} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: 'rgba(0,240,255,0.16)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                    }}
                  >
                    <Text style={{ color: CYAN, fontSize: 11, fontWeight: '900' }}>{index + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20 }}>{step}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={{ paddingHorizontal: 20 }}>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={{
                  minHeight: 48,
                  borderRadius: 14,
                  backgroundColor: CYAN,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#041018', fontWeight: '900', letterSpacing: 0.8 }}>GOT IT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
