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
      <TouchableOpacity activeOpacity={1} onPress={onClose} className="flex-1 bg-black/60 justify-end">
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} className="bg-surface rounded-t-3xl px-4 pb-8 pt-4">
          <View className="w-10 h-1 rounded-full bg-white/30 self-center mb-4" />
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
                <View className="w-14 h-14 rounded-2xl bg-white/15 items-center justify-center mb-2">
                  <Ionicons name={opt.icon} size={28} color="#fff" />
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
