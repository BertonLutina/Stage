import React from 'react';
import { Text, View } from 'react-native';
import useThemeStore from '@/store/themeStore';

/** tone -> [text, fill, border] token names, same pairs as the Stage status pills. */
const TONES = {
  success: ['success', 'successBg', 'success'],
  warning: ['warning', 'warningBg', 'warningBorder'],
  danger: ['danger', 'dangerBg', 'danger'],
  info: ['cyanHi', 'card', 'cyan'],
};

/** Small read-only status pill (height 24), toned by outcome. */
export default function StatusTag({ label, tone = 'info', testID }) {
  const tokens = useThemeStore((s) => s.tokens);
  const [fgKey, bgKey, borderKey] = TONES[tone] || TONES.info;
  return (
    <View
      testID={testID}
      style={{
        height: 24,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: tokens[borderKey],
        backgroundColor: tokens[bgKey],
        alignSelf: 'flex-start',
        justifyContent: 'center',
        paddingHorizontal: 10,
      }}
    >
      <Text numberOfLines={1} style={{ color: tokens[fgKey], fontSize: 11, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}
