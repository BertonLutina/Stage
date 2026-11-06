import React from 'react';
import { ScrollView } from 'react-native';
import { Chip } from '@/components/ui';
import { SCREEN_GUTTER } from '@/components/ui/metrics';

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

/**
 * Horizontally scrolling filter chips. The strip pads itself by the screen gutter so
 * a parent can pull it edge to edge with a negative margin.
 */
export default function ChatFilterChips({ activeFilters = [], onToggle }) {
  const isActive = (key) => activeFilters.includes(key);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingHorizontal: SCREEN_GUTTER, paddingVertical: 5, gap: 8, alignItems: 'center' }}
    >
      {FILTERS.map((f) => (
        <Chip
          key={f.key}
          label={f.label}
          active={isActive(f.key)}
          onPress={() => onToggle(f.key)}
        />
      ))}
    </ScrollView>
  );
}
