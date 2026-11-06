import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { ICON_SIZE, INPUT_RADIUS, MIN_TOUCH } from '@/components/ui/metrics';

function optionId(option) {
  return option?.id ?? option;
}

function optionLabel(option) {
  return option?.label ?? option;
}

export default function FilterListBox({ label, value, options = [], onChange }) {
  const tokens = useThemeStore((s) => s.tokens);
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find((option) => String(optionId(option)) === String(value)) || options[0],
    [options, value],
  );

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: String(optionLabel(selected) ?? '') }}
        style={({ pressed }) => ({
          flex: 1,
          minWidth: 96,
          minHeight: MIN_TOUCH + 4,
          borderRadius: INPUT_RADIUS,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.bgDeep,
          paddingHorizontal: 12,
          paddingVertical: 6,
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text
          numberOfLines={1}
          style={{
            color: tokens.muted,
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 10 * 0.12,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 }}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: tokens.text, fontSize: 14, fontWeight: '600', flex: 1 }}>
            {optionLabel(selected)}
          </Text>
          <Ionicons name="chevron-down" size={16} color={tokens.muted} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: tokens.overlay }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setOpen(false)}
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
              maxHeight: '70%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8, paddingTop: 10, paddingBottom: 4 }}>
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  color: tokens.muted,
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 11 * 0.12,
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={ICON_SIZE} color={tokens.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, gap: 6 }}>
              {options.map((option) => {
                const id = optionId(option);
                const active = String(id) === String(value);
                return (
                  <Pressable
                    key={String(id)}
                    onPress={() => {
                      onChange?.(id);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      minHeight: 48,
                      paddingHorizontal: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      borderRadius: INPUT_RADIUS,
                      borderWidth: 1,
                      borderColor: active ? tokens.cyan : 'transparent',
                      backgroundColor: active ? tokens.card : 'transparent',
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        color: active ? tokens.cyan : tokens.text,
                        fontSize: 15,
                        fontWeight: '600',
                      }}
                    >
                      {optionLabel(option)}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={ICON_SIZE} color={tokens.cyan} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
