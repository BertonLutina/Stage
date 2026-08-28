import React from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import { SILVER, TILE_HAIRLINE } from '@/components/transfer/transferHubTheme';

function StatCell({ label, value }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' }}>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{label}</Text>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, marginTop: 4 }}>{value || '—'}</Text>
    </View>
  );
}

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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.62)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: '#05080f', borderTopWidth: 1, borderColor: TILE_HAIRLINE, maxHeight: '78%' }}>
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
            <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' }} />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
            <Text style={[headingStyleSm, { color: SILVER, letterSpacing: 2.4, fontSize: 11, marginBottom: 12 }]}>
              {eyebrow}
            </Text>
            {!title ? (
              <Text style={{ color: 'rgba(255,255,255,0.45)' }}>Select an item</Text>
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
                      borderColor: SILVER,
                      backgroundColor: '#071018',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={{ width: 56, height: 56 }} />
                    ) : (
                      <Text style={{ color: SILVER, fontWeight: '900', fontSize: 20 }}>{initials || '—'}</Text>
                    )}
                  </View>
                  <Text style={[headingStyle, { color: '#fff', fontSize: 22, flex: 1 }]}>{title}</Text>
                </View>

                {stats.length ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    {stats.map((stat) => (
                      <StatCell key={stat.label} label={stat.label} value={stat.value} />
                    ))}
                  </View>
                ) : null}

                {onPrimary ? (
                  <TouchableOpacity
                    onPress={onPrimary}
                    activeOpacity={0.9}
                    style={{
                      minHeight: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 8,
                      backgroundColor: SILVER,
                      borderColor: 'rgba(248,251,255,0.55)',
                      borderWidth: 1,
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons name="open-outline" size={16} color="#000" />
                    <Text style={[headingStyleSm, { color: '#000', letterSpacing: 1.6 }]}>{primaryLabel}</Text>
                  </TouchableOpacity>
                ) : null}

                {onSecondary ? (
                  <TouchableOpacity
                    onPress={onSecondary}
                    activeOpacity={0.9}
                    style={{
                      minHeight: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 8,
                      borderWidth: 1,
                      borderColor: 'rgba(248,251,255,0.35)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Ionicons name="flash-outline" size={16} color={SILVER} />
                    <Text style={[headingStyleSm, { color: SILVER, letterSpacing: 1.6 }]}>{secondaryLabel}</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
