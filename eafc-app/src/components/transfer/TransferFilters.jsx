import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { headingStyleSm } from '@/lib/fonts';
import { PLAYER_POSITIONS, PLATFORMS } from '@/lib/stageDirectories';
import { GOLD } from './transferHubTheme';

const STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'free_agent', label: 'Free Agent' },
  { id: 'expiring', label: 'Expiring' },
];

function Chip({ label, active, onPress, gold }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: active
          ? (gold ? GOLD : 'rgba(0,229,255,0.55)')
          : 'rgba(255,255,255,0.12)',
        backgroundColor: active
          ? (gold ? GOLD : 'rgba(0,229,255,0.14)')
          : 'rgba(0,0,0,0.4)',
      }}
    >
      <Text
        style={[
          headingStyleSm,
          {
            fontSize: 11,
            color: active ? (gold ? '#000' : '#00e5ff') : 'rgba(255,255,255,0.55)',
            letterSpacing: 1,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

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
  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(0,0,0,0.4)',
          paddingHorizontal: 12,
          minHeight: 46,
        }}
      >
        <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
        <TextInput
          value={search}
          onChangeText={onSearch}
          placeholder="Search gamertag"
          placeholderTextColor="rgba(255,255,255,0.35)"
          autoCorrect={false}
          autoCapitalize="none"
          style={{ flex: 1, color: '#fff', fontSize: 15, paddingVertical: 10 }}
        />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Ionicons name="options-outline" size={14} color="rgba(255,255,255,0.4)" />
        {STATUS_OPTIONS.map((opt) => (
          <Chip
            key={opt.id}
            label={opt.label}
            gold
            active={statusFilter === opt.id}
            onPress={() => onStatus(opt.id)}
          />
        ))}
      </View>

      <View>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 }}>
          POSITION
        </Text>
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

      <View>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 }}>
          PLATFORM
        </Text>
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
