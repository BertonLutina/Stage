import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParallelogramFrame, { parallelogramTabStyle, parallelogramTabTextStyle } from '@/components/club/ParallelogramFrame';

export default function PresidentChip({ president, onPress }) {
  if (!president) return null;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="President">
      <ParallelogramFrame skew={-8} style={{ alignSelf: 'flex-start' }}>
        <View style={[parallelogramTabStyle(false), { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.35)' }]}>
          <View
            style={{
              width: 28,
              height: 28,
              overflow: 'hidden',
              backgroundColor: '#101827',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(0,229,255,0.25)',
            }}
          >
            {president.avatar_url ? (
              <Image source={{ uri: president.avatar_url }} style={{ width: 28, height: 28 }} />
            ) : (
              <Ionicons name="person" size={14} color="rgba(255,255,255,0.45)" />
            )}
          </View>
          <Text style={parallelogramTabTextStyle(true)}>President</Text>
        </View>
      </ParallelogramFrame>
    </TouchableOpacity>
  );
}
