import React from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { Chip, SectionLabel } from '@/components/ui';
import DirectorySearchField from '@/components/directory/DirectorySearchField';
import { PLAYER_POSITIONS, PLATFORMS } from '@/lib/stageDirectories';

const STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'free_agent', label: 'Free Agent' },
  { id: 'expiring', label: 'Expiring' },
];

export default function TransferFilters({
  search,
  onSearch,
  position,
  onPosition,
  statusFilter,
  onStatus,
  platform,
  onPlatform,
}) {
  const tokens = useThemeStore((s) => s.tokens);

  return (
    <View style={{ gap: 14 }}>
      <DirectorySearchField
        value={search}
        onChangeText={onSearch}
        placeholder="Search gamertag"
        autoCorrect={false}
        autoCapitalize="none"
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Ionicons name="options-outline" size={16} color={tokens.muted} />
        {STATUS_OPTIONS.map((opt) => (
          <Chip
            key={opt.id}
            label={opt.label}
            active={statusFilter === opt.id}
            onPress={() => onStatus(opt.id)}
          />
        ))}
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>POSITION</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {PLAYER_POSITIONS.map((opt) => (
            <Chip
              key={opt}
              label={opt === 'All' ? 'All positions' : opt}
              active={position === opt}
              onPress={() => onPosition(opt)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>PLATFORM</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PLATFORMS.map((opt) => (
            <Chip
              key={opt}
              label={opt === 'All' ? 'All platforms' : opt}
              active={platform === opt}
              onPress={() => onPlatform(opt)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
