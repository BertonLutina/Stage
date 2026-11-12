import React from 'react';
import { Text, View } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { Card } from '@/components/ui';
import useT from '@/hooks/useT';
import { isTransferWindowOpen } from '@/lib/transferWindow';

function closesLabel(endDate) {
  if (!endDate) return '';
  const date = new Date(endDate);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const midnight = date.getUTCHours() === 0 && date.getUTCMinutes() === 0;
  if (midnight) return day;
  return `${day} · ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

/** Window status at the top of the Mercato: green when open, with the real closing date. */
export default function MercatoWindowBanner({ window: currentWindow, loading = false }) {
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const open = isTransferWindowOpen(currentWindow);

  let title = t('stage.mercato.windowNone');
  let detail = '';
  if (loading && !currentWindow) {
    title = t('stage.mercato.windowLoading');
  } else if (open) {
    title = t('stage.mercato.windowOpen');
    const closes = closesLabel(currentWindow?.end_date);
    detail = closes ? t('stage.mercato.windowCloses', { date: closes }) : '';
  } else if (currentWindow) {
    title = t('stage.mercato.windowClosed');
    detail = t('stage.mercato.windowClosedNote');
  }

  const dot = open ? tokens.success : currentWindow ? tokens.warning : tokens.muted;
  return (
    <Card highlight={open} testID="mercato-window">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }}>{title}</Text>
          {detail ? <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2, lineHeight: 17 }}>{detail}</Text> : null}
        </View>
      </View>
    </Card>
  );
}
