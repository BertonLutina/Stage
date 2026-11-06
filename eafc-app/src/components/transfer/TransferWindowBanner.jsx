import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { Card } from '@/components/ui';
import { isTransferWindowOpen } from '@/lib/transferWindow';

export default function TransferWindowBanner({ window: currentWindow }) {
  const tokens = useThemeStore((s) => s.tokens);
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
    <Card highlight={isOpen}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isOpen ? tokens.successBg : tokens.warningBg,
            borderWidth: 1,
            borderColor: isOpen ? tokens.success : tokens.warningBorder,
          }}
        >
          <Ionicons
            name={isOpen ? 'checkmark-circle-outline' : 'alert-circle-outline'}
            size={22}
            color={isOpen ? tokens.success : tokens.warning}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 14 }}>
            Transfer Window: {isOpen ? 'OPEN' : 'CLOSED'}
          </Text>
          <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 3, lineHeight: 17 }}>
            {currentWindow?.label ? `${currentWindow.label} · ` : ''}{detail}
          </Text>
        </View>
      </View>
    </Card>
  );
}
