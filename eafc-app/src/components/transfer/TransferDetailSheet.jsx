import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { Avatar, Button, Card, SectionLabel, StatGrid } from '@/components/ui';
import { playerAvatarInitials, resolvePlayerAvatarUrl } from '@/lib/playerAvatar';
import { playerDisplayName } from '@/lib/stageDirectories';
import TransferBadge from './TransferBadge';

export default function TransferDetailSheet({ visible, entry, onClose, onViewProfile }) {
  const tokens = useThemeStore((s) => s.tokens);
  const player = entry?.player;
  const imageUrl = resolvePlayerAvatarUrl(player);
  const isFreeAgent = entry?.badgeType === 'free_agent';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: tokens.overlay }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={{
            backgroundColor: tokens.bgDeep,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: tokens.border,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            maxHeight: '78%',
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
            <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: tokens.border }} />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 16 }}>
            <SectionLabel>Player details</SectionLabel>
            {!player ? (
              <Text style={{ color: tokens.muted, fontSize: 14 }}>Select a player</Text>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar size={56} round uri={imageUrl} initials={playerAvatarInitials(player)} />
                  <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        color: tokens.text,
                        fontFamily: FONT_EA_SPORTS,
                        fontSize: 22,
                        letterSpacing: 22 * 0.03,
                        textTransform: 'uppercase',
                      }}
                    >
                      {playerDisplayName(player)}
                    </Text>
                    <TransferBadge type={entry.badgeType} daysLeft={entry.days_left} />
                  </View>
                </View>

                <StatGrid
                  columns={3}
                  items={[
                    { label: 'POSITION', value: [player.position, player.secondary_position].filter(Boolean).join(' / ') || '—' },
                    { label: 'OVR', value: player.overall_rating || '—' },
                    { label: 'PLATFORM', value: player.platform || '—' },
                  ]}
                />

                <Card highlight={isFreeAgent} style={{ paddingVertical: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons
                      name={isFreeAgent ? 'people-outline' : 'shield-outline'}
                      size={22}
                      color={isFreeAgent ? tokens.success : tokens.muted}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: tokens.muted, fontSize: 12 }}>Status</Text>
                      <Text
                        numberOfLines={2}
                        style={{ color: isFreeAgent ? tokens.success : tokens.text, fontWeight: '700', fontSize: 14, marginTop: 2 }}
                      >
                        {isFreeAgent ? 'Free agent — available' : 'Contract expiring'}
                      </Text>
                    </View>
                  </View>
                </Card>

                <Button title="View full profile" icon="open-outline" onPress={onViewProfile} />
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
