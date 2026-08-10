import React, { useMemo, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, Modal, Pressable, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AMBER } from '@/components/profile/gamer/GamerProfileUI';
import {
  FORMATION_OPTIONS,
  getFormationSlots,
  autoFillLineup,
} from '@/lib/clubFormations';

export { FORMATION_OPTIONS, autoFillLineup };

const CYAN = '#00F0FF';
const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 32, 380);
const CARD_H = CARD_W * 1.28;

function PlayerToken({
  label, player, selected, onPress, size = 44,
}) {
  const filled = Boolean(player);
  const name = player?.gamertag || player?.gamer_tag || '';
  const avatar = player?.avatar_url || player?.avatar;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={filled ? `${label} ${name}` : `Empty ${label}`}
      style={{
        width: size + 8,
        alignItems: 'center',
        transform: [{ translateY: selected ? -2 : 0 }],
      }}
    >
      {/* 3D pedestal shadow */}
      <View
        style={{
          position: 'absolute',
          bottom: 14,
          width: size * 0.7,
          height: 8,
          borderRadius: 999,
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: 0.7,
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: selected ? 2.5 : 2,
          borderColor: selected ? AMBER : filled ? 'rgba(0,240,255,0.85)' : 'rgba(255,255,255,0.22)',
          backgroundColor: filled ? '#0A1020' : 'rgba(8,14,28,0.72)',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: selected ? AMBER : CYAN,
          shadowOpacity: filled || selected ? 0.55 : 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={{ width: size, height: size }} />
        ) : (
          <Text style={{
            color: filled ? CYAN : 'rgba(255,255,255,0.45)',
            fontWeight: '900',
            fontSize: 11,
          }}
          >
            {filled ? String(name).slice(0, 3).toUpperCase() : label}
          </Text>
        )}
      </View>
      <View
        style={{
          marginTop: 3,
          paddingHorizontal: 5,
          paddingVertical: 2,
          borderRadius: 6,
          backgroundColor: 'rgba(5,8,18,0.82)',
          borderWidth: 1,
          borderColor: filled ? 'rgba(0,240,255,0.35)' : 'rgba(255,255,255,0.12)',
          maxWidth: size + 28,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: filled ? '#fff' : 'rgba(255,255,255,0.4)',
            fontSize: 9,
            fontWeight: '800',
            textAlign: 'center',
          }}
        >
          {filled ? String(name).slice(0, 9) : label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Premium club formation card — tilted pitch with glass tokens.
 */
export default function ClubFormationCard({
  formationName = '4-3-3',
  lineup = [],
  players = [],
  clubName,
  logoUrl,
  editable = true,
  onAssign,
}) {
  const [pickedSlot, setPickedSlot] = useState(null);
  const slots = useMemo(() => getFormationSlots(formationName), [formationName]);

  const playerById = useMemo(() => {
    const map = {};
    players.forEach((p) => {
      if (p.id) map[p.id] = p;
      if (p.user_id) map[p.user_id] = p;
    });
    return map;
  }, [players]);

  const getSlotPlayer = (slot) => {
    const entry = (lineup || []).find((l) => l.slot === slot);
    if (!entry) return null;
    return playerById[entry.player_id] || {
      id: entry.player_id,
      gamertag: entry.gamertag,
      position: entry.position,
    };
  };

  const selectedSlotMeta = slots.find((s) => s.slot === pickedSlot);

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Depth plate under card */}
      <View
        style={{
          width: CARD_W - 12,
          height: 18,
          marginBottom: -10,
          borderRadius: 999,
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: 0.55,
          transform: [{ scaleX: 1.05 }],
        }}
      />

      <View
        style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: 'rgba(255,214,10,0.4)',
          transform: [{ perspective: 1100 }, { rotateX: '9deg' }, { scale: 0.98 }],
          shadowColor: '#FFD60A',
          shadowOpacity: 0.25,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 14 },
          elevation: 16,
        }}
      >
        <LinearGradient
          colors={['#0B3D24', '#0F5C35', '#0A3A22', '#062618']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ flex: 1 }}
        >
          {/* Grass stripes */}
          {Array.from({ length: 10 }).map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${i * 10}%`,
                height: '5%',
                backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'transparent',
              }}
            />
          ))}

          {/* Gloss sheen */}
          <LinearGradient
            colors={['rgba(255,255,255,0.14)', 'transparent', 'rgba(0,0,0,0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Pitch markings */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: '4%',
              left: '5%',
              right: '5%',
              bottom: '4%',
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.28)',
              borderRadius: 4,
            }}
          >
            <View style={{
              position: 'absolute', left: 0, right: 0, top: '50%', height: 1.5, backgroundColor: 'rgba(255,255,255,0.28)',
            }}
            />
            <View style={{
              position: 'absolute',
              width: CARD_W * 0.28,
              height: CARD_W * 0.28,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.28)',
              left: '50%',
              top: '50%',
              marginLeft: -(CARD_W * 0.14),
              marginTop: -(CARD_W * 0.14),
            }}
            />
            {/* Top / bottom boxes */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: '22%',
              right: '22%',
              height: '14%',
              borderWidth: 1.5,
              borderTopWidth: 0,
              borderColor: 'rgba(255,255,255,0.28)',
            }}
            />
            <View style={{
              position: 'absolute',
              bottom: 0,
              left: '22%',
              right: '22%',
              height: '14%',
              borderWidth: 1.5,
              borderBottomWidth: 0,
              borderColor: 'rgba(255,255,255,0.28)',
            }}
            />
          </View>

          {/* Header badge */}
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 12,
              right: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 5,
            }}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(5,8,18,0.72)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,214,10,0.35)',
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
            >
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={{ width: 22, height: 22, borderRadius: 6 }} />
              ) : (
                <Ionicons name="shield" size={14} color={AMBER} />
              )}
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }} numberOfLines={1}>
                {clubName || 'Club'}
              </Text>
            </View>
            <View style={{
              backgroundColor: 'rgba(255,214,10,0.18)',
              borderWidth: 1,
              borderColor: 'rgba(255,214,10,0.45)',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
            >
              <Text style={{ color: AMBER, fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>
                {formationName}
              </Text>
            </View>
          </View>

          {/* Slots */}
          {slots.map((slot) => {
            const player = getSlotPlayer(slot.slot);
            return (
              <View
                key={slot.slot}
                style={{
                  position: 'absolute',
                  left: `${slot.leftPct}%`,
                  top: `${Math.min(Math.max(slot.topPct, 8), 88)}%`,
                  marginLeft: -26,
                  marginTop: -28,
                  zIndex: 10 + slot.slot,
                }}
              >
                <PlayerToken
                  label={slot.label}
                  player={player}
                  selected={pickedSlot === slot.slot}
                  onPress={() => {
                    if (!editable) return;
                    setPickedSlot(slot.slot);
                  }}
                />
              </View>
            );
          })}
        </LinearGradient>
      </View>

      {/* Slot picker */}
      <Modal visible={pickedSlot != null} transparent animationType="fade" onRequestClose={() => setPickedSlot(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setPickedSlot(null)} />
          <View
            style={{
              backgroundColor: '#0B1220',
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderWidth: 1,
              borderColor: 'rgba(255,214,10,0.28)',
              paddingTop: 16,
              paddingBottom: 28,
              maxHeight: '70%',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            </View>
            <Text style={{
              color: AMBER, fontWeight: '900', fontSize: 12, letterSpacing: 1.6, paddingHorizontal: 20,
            }}
            >
              {selectedSlotMeta?.label || 'SLOT'}
            </Text>
            <Text style={{
              color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 4, paddingHorizontal: 20, marginBottom: 12,
            }}
            >
              Assign player
            </Text>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  onAssign?.(pickedSlot, null);
                  setPickedSlot(null);
                }}
                style={{
                  minHeight: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontWeight: '700' }}>— Empty slot —</Text>
              </TouchableOpacity>
              {players.map((p) => {
                const pid = p.id || p.user_id;
                const taken = (lineup || []).some((l) => l.player_id === pid && l.slot !== pickedSlot);
                return (
                  <TouchableOpacity
                    key={pid}
                    disabled={taken}
                    onPress={() => {
                      onAssign?.(pickedSlot, { ...p, id: pid });
                      setPickedSlot(null);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      minHeight: 56,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      paddingHorizontal: 12,
                      opacity: taken ? 0.35 : 1,
                    }}
                  >
                    <View style={{
                      width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: '#101827',
                      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,240,255,0.3)',
                    }}
                    >
                      {(p.avatar_url || p.avatar) ? (
                        <Image source={{ uri: p.avatar_url || p.avatar }} style={{ width: 40, height: 40 }} />
                      ) : (
                        <Ionicons name="person" size={16} color="rgba(255,255,255,0.35)" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '800' }} numberOfLines={1}>
                        {p.gamertag || p.gamer_tag || 'Player'}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>
                        {[p.position, p.overall_rating != null ? `OVR ${p.overall_rating}` : null].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    {taken ? (
                      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '700' }}>In XI</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
