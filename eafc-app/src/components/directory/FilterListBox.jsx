import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { headingStyleSm } from '@/lib/fonts';
import { SILVER, TILE_HAIRLINE } from '@/components/transfer/transferHubTheme';

function optionId(option) {
  return option?.id ?? option;
}

function optionLabel(option) {
  return option?.label ?? option;
}

export default function FilterListBox({ label, value, options = [], onChange }) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find((option) => String(optionId(option)) === String(value)) || options[0],
    [options, value],
  );

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          flex: 1,
          minWidth: 96,
          minHeight: 44,
          borderWidth: 1,
          borderColor: TILE_HAIRLINE,
          backgroundColor: 'rgba(0,0,0,0.4)',
          paddingHorizontal: 10,
          paddingVertical: 8,
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }}>
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 3 }}>
          <Text numberOfLines={1} style={{ color: SILVER, fontSize: 12, fontWeight: '800', flex: 1 }}>
            {optionLabel(selected)}
          </Text>
          <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.45)" />
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.62)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <View style={{ backgroundColor: '#071018', borderTopWidth: 1, borderColor: 'rgba(238,243,251,0.22)', maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 }}>
              <Text style={[headingStyleSm, { color: SILVER, letterSpacing: 2.4 }]}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 28 }}>
              {options.map((option) => {
                const id = optionId(option);
                const active = String(id) === String(value);
                return (
                  <TouchableOpacity
                    key={String(id)}
                    onPress={() => {
                      onChange?.(id);
                      setOpen(false);
                    }}
                    style={{
                      minHeight: 48,
                      paddingHorizontal: 12,
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: active ? 'rgba(248,251,255,0.45)' : 'transparent',
                      backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ color: active ? SILVER : '#fff', fontWeight: '800', fontSize: 14 }}>
                      {optionLabel(option)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
