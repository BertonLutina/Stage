import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FUT } from '@/components/dashboard/CommandCenterUI';
import { applyWagerOptimistic, formatStc, invokeWagerAction, WAGER_STATUS_LABEL } from '@/lib/wagerActions';

export default function GameDayWagerCard({ game, isMyMatch, amIHomeTeam, onGameUpdate }) {
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
    <View style={card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={title}>STC WAGER</Text>
        <Text style={{ color: FUT.gold, fontSize: 10, fontWeight: '800' }}>
          {WAGER_STATUS_LABEL[status] || status}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <Stat label="Each side" value={`${formatStc(wagerStc)} STC`} />
        <Stat label="Pot" value={`${formatStc(wagerStc * 2)} STC`} />
      </View>
      {['pending_acceptance', 'active'].includes(status) ? (
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 8 }}>
          Home {game.wager_home_locked ? 'locked' : 'open'} · Away {game.wager_away_locked ? 'locked' : 'open'}
        </Text>
      ) : null}
      {error ? <Text style={{ color: FUT.rose, fontSize: 11, marginTop: 6 }}>{error}</Text> : null}
      {isAway && status === 'pending_acceptance' && game.status === 'scheduled' ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Action label={`Accept ${formatStc(wagerStc)}`} loading={loading === 'accept_wager'} onPress={() => run('accept_wager')} tone="good" />
          <Action label="Decline" loading={loading === 'decline_wager'} onPress={() => run('decline_wager')} tone="bad" />
        </View>
      ) : null}
      {isHome && ['pending_acceptance', 'active'].includes(status) && game.status === 'scheduled' ? (
        <TouchableOpacity onPress={() => run('cancel_wager')} disabled={!!loading} style={{ marginTop: 10 }}>
          <Text style={{ color: FUT.rose, fontSize: 11, textAlign: 'center', fontWeight: '700' }}>
            {loading === 'cancel_wager' ? 'Cancelling…' : 'Cancel wager'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 10 }}>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800' }}>{label.toUpperCase()}</Text>
      <Text style={{ color: FUT.gold, fontSize: 14, fontWeight: '900', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function Action({ label, loading, onPress, tone }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={{
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: tone === 'good' ? 'rgba(124,255,107,0.16)' : 'rgba(255,77,109,0.14)',
        borderWidth: 1,
        borderColor: tone === 'good' ? 'rgba(124,255,107,0.4)' : 'rgba(255,77,109,0.35)',
      }}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{label}</Text>}
    </TouchableOpacity>
  );
}

const card = {
  backgroundColor: 'rgba(255,210,74,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,210,74,0.28)',
  borderRadius: 2,
  padding: 14,
};

const title = { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 };
