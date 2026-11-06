import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { hexToRgba } from '@/lib/stageTheme';
import { DASHBOARD_LAYOUTS } from '@/lib/dashboardLayouts';
import LiveGlass from '@/components/theme/LiveGlass';
import { Button } from '@/components/ui';

export function DashboardLayoutOptions({ layout, onChange }) {
  const tokens = useGamerTokens();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Home layout" style={{ gap: 10 }}>
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
              borderRadius: 16,
              borderWidth: 1,
              borderColor: active ? tokens.aqua : tokens.border,
              backgroundColor: active ? tokens.cardHi : tokens.card,
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
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? hexToRgba(tokens.cyan, 0.18) : tokens.border,
            }}
            >
              <Text style={{ color: active ? tokens.cyan : tokens.muted, fontFamily: FONT_EA_SPORTS, fontSize: 16 }}>
                {item.id}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }}>{item.name}</Text>
              <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2, lineHeight: 16 }}>
                {item.blurb}
              </Text>
            </View>
            {active ? <Ionicons name="checkmark-circle-outline" size={22} color={tokens.cyan} /> : null}
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
            backgroundColor: tokens.overlay,
          }}
        />
        <LiveGlass
          intensity={26}
          style={{
            backgroundColor: tokens.live ? 'transparent' : tokens.bgDeep,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderWidth: 1,
            borderColor: tokens.border,
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 28,
            gap: 14,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 40, height: 4, borderRadius: 2, backgroundColor: tokens.borderStrong,
            }}
            />
          </View>
          <Text style={{
            color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 28, letterSpacing: 28 * 0.03, textTransform: 'uppercase',
          }}
          >
            Home layout
          </Text>
          <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>
            Pick how Command Center looks. You can change this later in Settings.
          </Text>
          <DashboardLayoutOptions layout={draft} onChange={setDraft} />
          <Button
            title="Use this layout"
            accessibilityLabel="Use this Home layout"
            onPress={() => onConfirm(draft)}
          />
          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Not now"
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: tokens.muted, fontWeight: '600', fontSize: 15 }}>Not now</Text>
          </TouchableOpacity>
        </LiveGlass>
      </View>
    </Modal>
  );
}
