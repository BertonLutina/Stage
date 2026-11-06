import React from 'react';
import { View, Pressable, Modal, ScrollView, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';

const OPTIONS = [
  { key: 'camera', icon: 'camera', label: 'Camera' },
  { key: 'gallery', icon: 'images', label: 'Gallery' },
  { key: 'file', icon: 'document', label: 'File' },
  { key: 'audio', icon: 'mic', label: 'Voice note' },
  { key: 'gif', icon: 'happy', label: 'GIF' },
  { key: 'sticker', icon: 'happy-outline', label: 'Sticker' },
  { key: 'poll', icon: 'bar-chart', label: 'Create poll' },
  { key: 'contact', icon: 'person', label: 'Share contact' },
];

export default function ChatAttachmentMenu({ visible, onClose, onSelect }) {
  const tokens = useThemeStore((s) => s.tokens);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Scrim is a sibling of the sheet, so the sheet's controls stay separate accessibility elements. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: tokens.overlay }]}
        />
        <View
          style={{
            backgroundColor: tokens.bgDeep,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 32,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: tokens.border,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 16,
              backgroundColor: tokens.borderStrong,
            }}
          />
          <Text style={{ color: tokens.text, fontSize: 16, fontWeight: '700', marginBottom: 16 }}>Attach</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
                onPress={() => {
                  onSelect(opt.key);
                  onClose();
                }}
                style={{ alignItems: 'center', width: 64, minHeight: 44 }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                    backgroundColor: tokens.card,
                    borderWidth: 1,
                    borderColor: tokens.border,
                  }}
                >
                  <Ionicons name={opt.icon} size={24} color={tokens.cyan} />
                </View>
                <Text numberOfLines={2} style={{ color: tokens.textSoft, fontSize: 12, textAlign: 'center' }}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
