import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { Avatar, Button, SectionLabel, StatGrid } from '@/components/ui';

export default function DirectoryDetailSheet({
  visible,
  onClose,
  title,
  eyebrow = 'Details',
  imageUrl,
  initials,
  stats = [],
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  const tokens = useThemeStore((s) => s.tokens);

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
            <SectionLabel>{eyebrow}</SectionLabel>
            {!title ? (
              <Text style={{ color: tokens.muted, fontSize: 14 }}>Select an item</Text>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar size={56} round uri={imageUrl} initials={initials || '—'} />
                  <Text
                    numberOfLines={2}
                    style={{
                      flex: 1,
                      color: tokens.text,
                      fontFamily: FONT_EA_SPORTS,
                      fontSize: 22,
                      letterSpacing: 22 * 0.03,
                      textTransform: 'uppercase',
                    }}
                  >
                    {title}
                  </Text>
                </View>

                {stats.length ? (
                  <StatGrid
                    columns={Math.min(3, stats.length)}
                    items={stats.map((stat) => ({ label: stat.label, value: stat.value || '—' }))}
                  />
                ) : null}

                <View style={{ gap: 10 }}>
                  {onPrimary ? (
                    <Button title={primaryLabel} icon="open-outline" onPress={onPrimary} />
                  ) : null}
                  {onSecondary ? (
                    <Button title={secondaryLabel} icon="flash-outline" variant="secondary" onPress={onSecondary} />
                  ) : null}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
