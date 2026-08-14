import React from 'react';
import { View, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import STText from '../common/STText';

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
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity activeOpacity={1} onPress={onClose} className="flex-1 bg-black/70 justify-end">
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#0B101C',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 32,
            borderTopWidth: 1,
            borderColor: 'rgba(255,214,10,0.2)',
          }}
        >
          <View className="w-10 h-1 rounded-full self-center mb-4" style={{ backgroundColor: 'rgba(255,214,10,0.35)' }} />
          <STText className="text-white font-bold text-lg mb-4">Attach</STText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => {
                  onSelect(opt.key);
                  onClose();
                }}
                className="items-center w-16"
              >
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                  style={{ backgroundColor: 'rgba(255,214,10,0.12)', borderWidth: 1, borderColor: 'rgba(255,214,10,0.25)' }}
                >
                  <Ionicons name={opt.icon} size={26} color="#FFD60A" />
                </View>
                <STText className="text-white text-xs">{opt.label}</STText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
