import React from 'react';
import { View } from 'react-native';
import useThemeStore from '@/store/themeStore';

/** Onboarding progress: `total` bars, the first `current` filled cyan. */
export default function StepProgress({ total = 4, current = 0 }) {
  const tokens = useThemeStore((s) => s.tokens);
  const filled = Math.max(0, Math.min(total, Number(current) || 0));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: filled }}
      style={{ flexDirection: 'row', gap: 6 }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          testID={`step-bar-${i}`}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: i < filled ? tokens.cyan : tokens.border,
          }}
        />
      ))}
    </View>
  );
}
