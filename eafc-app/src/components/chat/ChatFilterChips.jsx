import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import STText from '../common/STText';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'photo', label: 'Photos' },
  { key: 'video', label: 'Videos' },
  { key: 'link', label: 'Links' },
  { key: 'gif', label: 'GIFs' },
  { key: 'audio', label: 'Audio' },
  { key: 'document', label: 'Documents' },
  { key: 'sticker', label: 'Stickers' },
  { key: 'poll', label: 'Polls' },
  { key: 'contact', label: 'Contacts' },
  { key: 'unread', label: 'Unread' },
];

export default function ChatFilterChips({ activeFilters = [], onToggle }) {
  const isActive = (key) => activeFilters.includes(key);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
    >
      {FILTERS.map((f) => (
        <TouchableOpacity
          key={f.key}
          onPress={() => onToggle(f.key)}
          className={`px-4 py-2 rounded-full ${isActive(f.key) ? 'bg-primary' : 'bg-white/10 border border-white/20'}`}
        >
          <STText className={isActive(f.key) ? 'text-dark font-semibold text-sm' : 'text-white text-sm'}>
            {f.label}
          </STText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
