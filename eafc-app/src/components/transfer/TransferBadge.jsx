import React from 'react';
import { Text, View } from 'react-native';
import { SILVER, TILE_HAIRLINE } from './transferHubTheme';

const BADGE_CONFIG = {
  free_agent: { label: 'Free Agent' },
  expiring: { label: 'Expiring' },
  expiring_soon: { label: 'Expiring Soon' },
  pending_offer: { label: 'Pending Offer' },
  offer_accepted: { label: 'Offer Accepted' },
  pending_window: { label: 'Waiting for Window' },
  under_contract: { label: 'Under Contract' },
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
        borderWidth: 1,
        borderColor: TILE_HAIRLINE,
        backgroundColor: 'rgba(0,0,0,0.35)',
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Text style={{ color: SILVER, fontSize: 10, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}
