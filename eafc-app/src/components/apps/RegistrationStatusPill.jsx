import React from 'react';
import { View, Text } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { CHIP_HEIGHT, CHIP_RADIUS } from '@/components/ui/metrics';

/** tone -> [text, fill, border] token names, same pairs as the Stage status pills. */
const TONES = {
  success: ['success', 'successBg', 'success'],
  warning: ['warning', 'warningBg', 'warningBorder'],
  danger: ['danger', 'dangerBg', 'danger'],
};

const REJECTED = new Set(['rejected', 'removed', 'withdrawn', 'cancelled', 'canceled']);

/** approved -> success, rejected (or otherwise ended) -> danger, everything else (pending, waitlisted) -> warning. */
export function registrationTone(status) {
  const key = String(status || '').toLowerCase();
  if (key === 'approved') return 'success';
  if (REJECTED.has(key)) return 'danger';
  return 'warning';
}

/** Read-only application status, sized like a Stage chip but toned by outcome rather than "selected". */
export default function RegistrationStatusPill({ status }) {
  const tokens = useThemeStore((s) => s.tokens);
  const [fgKey, bgKey, borderKey] = TONES[registrationTone(status)];
  const label = String(status || '').toUpperCase();

  return (
    <View
      accessible
      accessibilityLabel={`Application status: ${label}`}
      style={{
        height: CHIP_HEIGHT,
        borderRadius: CHIP_RADIUS,
        borderWidth: 1,
        borderColor: tokens[borderKey],
        backgroundColor: tokens[bgKey],
        alignSelf: 'flex-start',
        flexShrink: 1,
        justifyContent: 'center',
        paddingHorizontal: 14,
      }}
    >
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ color: tokens[fgKey], fontSize: 13, fontWeight: '600' }}
      >
        {label}
      </Text>
    </View>
  );
}
