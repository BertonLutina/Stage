import React from 'react';
import { View, Text, Pressable } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { INPUT_RADIUS, MIN_TOUCH } from './metrics';

/**
 * Equal-width segments on a bgDeep track; the active one is cyan.
 * `accessibilityLabel` names the group (e.g. "App Theme") and exposes it as a radio group.
 */
export default function SegmentedControl({ options = [], value, onChange, testID, accessibilityLabel }) {
  const tokens = useThemeStore((s) => s.tokens);

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'radiogroup' : undefined}
      style={{
        flexDirection: 'row',
        backgroundColor: tokens.bgDeep,
        borderRadius: INPUT_RADIUS,
        borderWidth: 1,
        borderColor: tokens.border,
        padding: 3,
        gap: 3,
      }}
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            testID={testID ? `${testID}-${option.key}` : undefined}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange && onChange(option.key)}
            style={{
              flex: 1,
              minHeight: MIN_TOUCH,
              borderRadius: INPUT_RADIUS - 3,
              backgroundColor: active ? tokens.cyan : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 8,
            }}
          >
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                color: active ? tokens.onCyan : tokens.textSoft,
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
