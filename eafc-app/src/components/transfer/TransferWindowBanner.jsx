import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isTransferWindowOpen } from '@/lib/transferWindow';
import { LIME } from './transferHubTheme';

export default function TransferWindowBanner({ window: currentWindow }) {
  const isOpen = isTransferWindowOpen(currentWindow);
  const end = currentWindow?.end_date ? new Date(currentWindow.end_date).toLocaleDateString() : null;

  let detail = 'No transfer window has been scheduled yet.';
  if (isOpen && end) detail = `Open until ${end}`;
  else if (!isOpen && currentWindow?.end_date) {
    detail = `Closed ${end} — contracts accepted now will execute when the next window opens.`;
  } else if (!isOpen && currentWindow) {
    detail = 'Contracts accepted now will execute when the next window opens.';
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        padding: 12,
        backgroundColor: isOpen ? '#0b1c13' : 'rgba(0,0,0,0.4)',
        borderColor: isOpen ? 'rgba(124,255,107,0.3)' : 'rgba(255,255,255,0.1)',
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isOpen ? 'rgba(124,255,107,0.2)' : 'rgba(255,255,255,0.08)',
        }}
      >
        <Ionicons
          name={isOpen ? 'checkmark-circle' : 'alert-circle'}
          size={20}
          color={isOpen ? LIME : 'rgba(255,255,255,0.45)'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: isOpen ? LIME : '#fff', fontWeight: '800', fontSize: 13 }}>
          Transfer Window: {isOpen ? 'OPEN' : 'CLOSED'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 3 }}>
          {currentWindow?.label ? `${currentWindow.label} · ` : ''}{detail}
        </Text>
      </View>
    </View>
  );
}
