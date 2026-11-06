import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { hexToRgba } from '@/lib/stageTheme';
import { Button, Card, SectionLabel } from '@/components/ui';
import { MIN_TOUCH } from '@/components/ui/metrics';
import { innerTileChrome, sectionLabelStyle } from '@/components/dashboard/CommandCenterUI';
import { applyWagerOptimistic, formatStc, invokeWagerAction, WAGER_STATUS_LABEL } from '@/lib/wagerActions';

export default function GameDayWagerCard({ game, isMyMatch, amIHomeTeam, onGameUpdate }) {
  const tokens = useThemeStore((st) => st.tokens);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const wagerStc = Number(game?.wager_stc || 0);
  if (!wagerStc) return null;

  const status = game.wager_status || 'pending_acceptance';
  const isAway = isMyMatch && !amIHomeTeam;
  const isHome = isMyMatch && amIHomeTeam;

  const run = async (action) => {
    setLoading(action);
    setError('');
    try {
      await invokeWagerAction(action, game.id);
      onGameUpdate?.(applyWagerOptimistic(game, action));
    } catch (err) {
      setError(err?.message || 'Wager action failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card style={{ gap: 12, borderColor: hexToRgba(tokens.warning, 0.45) }}>
      <SectionLabel
        right={(
          <Text numberOfLines={1} style={{ color: tokens.warning, fontSize: 11, fontWeight: '600', flexShrink: 1 }}>
            {WAGER_STATUS_LABEL[status] || status}
          </Text>
        )}
      >
        STC WAGER
      </SectionLabel>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat label="Each side" value={`${formatStc(wagerStc)} STC`} />
        <Stat label="Pot" value={`${formatStc(wagerStc * 2)} STC`} />
      </View>
      {['pending_acceptance', 'active'].includes(status) ? (
        <Text style={{ color: tokens.muted, fontSize: 12 }}>
          Home {game.wager_home_locked ? 'locked' : 'open'} · Away {game.wager_away_locked ? 'locked' : 'open'}
        </Text>
      ) : null}
      {error ? <Text style={{ color: tokens.danger, fontSize: 12 }}>{error}</Text> : null}
      {isAway && status === 'pending_acceptance' && game.status === 'scheduled' ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Button title={`Accept ${formatStc(wagerStc)}`} loading={loading === 'accept_wager'} onPress={() => run('accept_wager')} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Button variant="danger" title="Decline" loading={loading === 'decline_wager'} onPress={() => run('decline_wager')} />
          </View>
        </View>
      ) : null}
      {isHome && ['pending_acceptance', 'active'].includes(status) && game.status === 'scheduled' ? (
        <TouchableOpacity
          onPress={() => run('cancel_wager')}
          disabled={!!loading}
          accessibilityRole="button"
          style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}
        >
          <Text style={{ color: tokens.danger, fontSize: 13, textAlign: 'center', fontWeight: '600' }}>
            {loading === 'cancel_wager' ? 'Cancelling…' : 'Cancel wager'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </Card>
  );
}

function Stat({ label, value }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <View style={[innerTileChrome(tokens, { borderRadius: 12 }), { flex: 1, minWidth: 0, padding: 12 }]}>
      <Text numberOfLines={1} style={sectionLabelStyle(tokens)}>{label}</Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        style={{
          color: tokens.warning,
          fontFamily: FONT_EA_SPORTS,
          fontSize: 20,
          letterSpacing: 20 * 0.03,
          textTransform: 'uppercase',
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
