import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CYAN, useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleLg } from '@/lib/fonts';
import { DASHBOARD_LAYOUTS } from '@/lib/dashboardLayouts';
import LiveGlass from '@/components/theme/LiveGlass';

export function DashboardLayoutOptions({ layout, onChange }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Home layout" style={{ gap: 8 }}>
      {DASHBOARD_LAYOUTS.map((item) => {
        const active = layout === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onChange(item.id)}
            activeOpacity={0.85}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${item.name}. ${item.blurb}`}
            style={{
              minHeight: 56,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: active ? 'rgba(0,232,255,0.55)' : 'rgba(255,255,255,0.12)',
              backgroundColor: active ? 'rgba(0,232,255,0.12)' : 'rgba(255,255,255,0.04)',
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? 'rgba(0,232,255,0.18)' : 'rgba(255,255,255,0.06)',
            }}
            >
              <Text style={{ color: active ? CYAN : 'rgba(255,255,255,0.55)', fontWeight: '900' }}>
                {item.id}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>{item.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2, lineHeight: 16 }}>
                {item.blurb}
              </Text>
            </View>
            {active ? <Ionicons name="checkmark-circle" size={20} color={CYAN} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function DashboardHomeLayoutSheet({ visible, layout, onConfirm, onDismiss }) {
  const tokens = useGamerTokens();
  const [draft, setDraft] = useState(layout || 'A');

  useEffect(() => {
    if (visible) setDraft(layout || 'A');
  }, [visible, layout]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Keep current layout"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}
        />
        <LiveGlass
          intensity={26}
          style={{
            backgroundColor: tokens.live ? 'transparent' : '#0B1220',
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderWidth: 1,
            borderColor: tokens.live ? tokens.cyanBorder : 'rgba(0,232,255,0.22)',
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 28,
            gap: 14,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)',
            }}
            />
          </View>
          <Text style={[headingStyleLg, { color: '#fff', fontSize: 22 }]}>Home layout</Text>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 20 }}>
            Pick how Command Center looks. You can change this later in Settings.
          </Text>
          <DashboardLayoutOptions layout={draft} onChange={setDraft} />
          <TouchableOpacity
            onPress={() => onConfirm(draft)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Use this Home layout"
            style={{
              minHeight: 48,
              borderRadius: 14,
              backgroundColor: CYAN,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#041018', fontWeight: '900', fontSize: 15 }}>Use this layout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Not now"
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '800' }}>Not now</Text>
          </TouchableOpacity>
        </LiveGlass>
      </View>
    </Modal>
  );
}
