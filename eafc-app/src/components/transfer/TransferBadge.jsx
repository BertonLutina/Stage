import React from 'react';
import { Text, View } from 'react-native';
import useThemeStore from '@/store/themeStore';

/** tone -> [text, fill, border] token names, same pairs as the Stage status pills. */
const TONES = {
  success: ['success', 'successBg', 'success'],
  warning: ['warning', 'warningBg', 'warningBorder'],
  neutral: ['textSoft', 'bgDeep', 'border'],
};

const BADGE_CONFIG = {
  free_agent: { label: 'Free Agent', tone: 'success' },
  expiring: { label: 'Expiring', tone: 'warning' },
  expiring_soon: { label: 'Expiring Soon', tone: 'warning' },
  pending_offer: { label: 'Pending Offer', tone: 'warning' },
  offer_accepted: { label: 'Offer Accepted', tone: 'success' },
  pending_window: { label: 'Waiting for Window', tone: 'warning' },
  under_contract: { label: 'Under Contract', tone: 'neutral' },
};

/** Spoken form of the badge ("Free Agent", "2 days left"), for row-level accessibility labels. */
export function transferBadgeSpokenLabel(type, daysLeft) {
  const cfg = BADGE_CONFIG[type];
  if (!cfg) return '';
  if ((type === 'expiring' || type === 'expiring_soon') && daysLeft != null) {
    return `${daysLeft} ${Number(daysLeft) === 1 ? 'day' : 'days'} left`;
  }
  return cfg.label;
}

export default function TransferBadge({ type, daysLeft }) {
  const tokens = useThemeStore((s) => s.tokens);
  const cfg = BADGE_CONFIG[type];
  if (!cfg) return null;

  const [fgKey, bgKey, borderKey] = TONES[cfg.tone];
  const label = (type === 'expiring' || type === 'expiring_soon') && daysLeft != null
    ? `${daysLeft}d left`
    : cfg.label;

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: tokens[borderKey],
        backgroundColor: tokens[bgKey],
        paddingHorizontal: 10,
        paddingVertical: 3,
        maxWidth: 140,
      }}
    >
      <Text numberOfLines={1} style={{ color: tokens[fgKey], fontSize: 10, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}
