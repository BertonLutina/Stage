import React from 'react';
import { Text, View } from 'react-native';
import { CYAN, LIME } from './transferHubTheme';

const BADGE_CONFIG = {
  free_agent: { label: 'Free Agent', color: LIME, border: 'rgba(124,255,107,0.35)', fill: 'rgba(124,255,107,0.12)' },
  expiring: { label: 'Expiring', color: '#f5c542', border: 'rgba(245,197,66,0.35)', fill: 'rgba(245,197,66,0.12)' },
  expiring_soon: { label: 'Expiring Soon', color: '#ff6b6b', border: 'rgba(255,107,107,0.35)', fill: 'rgba(255,107,107,0.12)' },
  pending_offer: { label: 'Pending Offer', color: CYAN, border: 'rgba(0,229,255,0.35)', fill: 'rgba(0,229,255,0.12)' },
  offer_accepted: { label: 'Offer Accepted', color: CYAN, border: 'rgba(0,229,255,0.35)', fill: 'rgba(0,229,255,0.12)' },
  pending_window: { label: 'Waiting for Window', color: CYAN, border: 'rgba(0,229,255,0.35)', fill: 'rgba(0,229,255,0.12)' },
  under_contract: { label: 'Under Contract', color: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.16)', fill: 'rgba(255,255,255,0.06)' },
};

export default function TransferBadge({ type, daysLeft }) {
  const cfg = BADGE_CONFIG[type];
  if (!cfg) return null;

  const label = (type === 'expiring' || type === 'expiring_soon') && daysLeft != null
    ? `${daysLeft}d left`
    : cfg.label;

  return (
    <View
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: cfg.border,
        backgroundColor: cfg.fill,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Text style={{ color: cfg.color, fontSize: 10, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}
