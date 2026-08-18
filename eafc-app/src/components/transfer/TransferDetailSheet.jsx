import React from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import { playerAvatarInitials, resolvePlayerAvatarUrl } from '@/lib/playerAvatar';
import { playerDisplayName } from '@/lib/stageDirectories';
import TransferBadge from './TransferBadge';
import { GOLD, GOLD_DARK, GOLD_LIGHT, LIME } from './transferHubTheme';

function StatCell({ label, value }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{label}</Text>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, marginTop: 4 }}>{value || '—'}</Text>
    </View>
  );
}

export default function TransferDetailSheet({ visible, entry, onClose, onViewProfile }) {
  const player = entry?.player;
  const imageUrl = resolvePlayerAvatarUrl(player);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.62)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: '#05080f', borderTopWidth: 1, borderColor: 'rgba(245,197,66,0.2)', maxHeight: '78%' }}>
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
            <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' }} />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
            <Text style={[headingStyleSm, { color: GOLD, letterSpacing: 2.4, fontSize: 11, marginBottom: 12 }]}>
              Player details
            </Text>
            {!player ? (
              <Text style={{ color: 'rgba(255,255,255,0.45)' }}>Select a player</Text>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: GOLD,
                      backgroundColor: '#071018',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={{ width: 56, height: 56 }} />
                    ) : (
                      <Text style={{ color: GOLD, fontWeight: '900', fontSize: 20 }}>{playerAvatarInitials(player)}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[headingStyle, { color: '#fff', fontSize: 22 }]}>{playerDisplayName(player)}</Text>
                    <View style={{ marginTop: 6 }}>
                      <TransferBadge type={entry.badgeType} daysLeft={entry.days_left} />
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <StatCell label="POSITION" value={[player.position, player.secondary_position].filter(Boolean).join(' / ')} />
                  <StatCell label="OVR" value={player.overall_rating} />
                  <StatCell label="PLATFORM" value={player.platform} />
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    padding: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: entry.badgeType === 'free_agent' ? 'rgba(124,255,107,0.2)' : 'rgba(255,255,255,0.08)',
                    backgroundColor: entry.badgeType === 'free_agent' ? 'rgba(124,255,107,0.1)' : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <Ionicons
                    name={entry.badgeType === 'free_agent' ? 'people' : 'shield'}
                    size={16}
                    color={entry.badgeType === 'free_agent' ? LIME : 'rgba(255,255,255,0.5)'}
                  />
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Status</Text>
                    <Text style={{ color: entry.badgeType === 'free_agent' ? LIME : '#fff', fontWeight: '700', marginTop: 2 }}>
                      {entry.badgeType === 'free_agent' ? 'Free agent — available' : 'Contract expiring'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={onViewProfile}
                  activeOpacity={0.9}
                  style={{
                    minHeight: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    backgroundColor: GOLD_LIGHT,
                    borderColor: GOLD_DARK,
                    borderWidth: 1,
                  }}
                >
                  <Ionicons name="open-outline" size={16} color="#000" />
                  <Text style={[headingStyleSm, { color: '#000', letterSpacing: 1.6 }]}>View full profile</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
