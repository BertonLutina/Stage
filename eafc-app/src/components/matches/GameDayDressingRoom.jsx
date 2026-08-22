import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import { FUT } from '@/components/dashboard/CommandCenterUI';
import { parseIdList, sameId } from '@/lib/gameDayOps';

export default function GameDayDressingRoom({ game, myClub, myPlayer }) {
  const [players, setPlayers] = useState([]);
  const [availableIds, setAvailableIds] = useState(new Set());
  const [seated, setSeated] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const locked = game.status === 'in_progress' || game.status === 'completed' || game.status === 'forfeit';
  const myId = myPlayer?.id;
  const iAmSeated = seated.some((id) => sameId(id, myId));
  const iAmAvailable = !!myId && [...availableIds].some((id) => sameId(id, myId));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!myClub?.id || !game?.id) {
        setLoading(false);
        return;
      }
      const [clubPlayers, dressing, availability] = await Promise.all([
        stageClient.entities.Player.filter({ club_id: myClub.id }).catch(() => []),
        stageClient.entities.DressingRoom.filter({ match_id: game.id, club_id: myClub.id }).catch(() => []),
        stageClient.entities.ClubFixtureAvailability
          .filter({ club_id: myClub.id, fixture_id: game.id }, '-updated_date', 200)
          .catch(() => []),
      ]);
      if (cancelled) return;
      const available = new Set((availability || []).filter((r) => r.status === 'available').map((r) => r.player_id));
      setAvailableIds(available);
      const isAvailable = (playerId) => [...available].some((id) => sameId(id, playerId));
      const usable = available.size
        ? (clubPlayers || []).filter((p) => isAvailable(p.id))
        : (clubPlayers || []);
      setPlayers(usable);
      if (dressing?.[0]) {
        const ids = parseIdList(dressing[0].seated_players);
        setSeated(available.size ? ids.filter((id) => isAvailable(id)) : ids);
        setRoomId(dressing[0].id);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [game?.id, myClub?.id]);

  useEffect(() => {
    if (!game?.id || !myClub?.id) return undefined;
    const unsub = stageClient.entities.DressingRoom.subscribe((event) => {
      if (String(event.data?.match_id) !== String(game.id) || String(event.data?.club_id) !== String(myClub.id)) return;
      const ids = parseIdList(event.data.seated_players);
      setSeated(availableIds.size
        ? ids.filter((id) => [...availableIds].some((availableId) => sameId(availableId, id)))
        : ids);
      if (event.data.id) setRoomId(event.data.id);
    }, { match_id: game.id });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [game?.id, myClub?.id, availableIds]);

  const takeSeat = async () => {
    if (!myId || saving || locked) return;
    if (availableIds.size && !iAmAvailable) {
      setError('Mark yourself available in club ops before taking a seat.');
      return;
    }
    setSaving(true);
    setError('');
    const next = iAmSeated ? seated.filter((id) => !sameId(id, myId)) : [...seated, myId];
    const prev = seated;
    setSeated(next);
    try {
      if (roomId) {
        await stageClient.entities.DressingRoom.update(roomId, { seated_players: next });
      } else {
        const created = await stageClient.entities.DressingRoom.create({
          match_id: game.id,
          club_id: myClub.id,
          seated_players: next,
        });
        setRoomId(created.id);
      }
    } catch (err) {
      setSeated(prev);
      setError(err?.message || 'Could not update seat');
    } finally {
      setSaving(false);
    }
  };

  if (!myClub) return null;
  if (loading) return <ActivityIndicator color={CYAN} style={{ marginVertical: 12 }} />;

  return (
    <View style={card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={title}>DRESSING ROOM</Text>
        <Text style={{ color: CYAN, fontSize: 11, fontWeight: '800' }}>{seated.length}/{players.length} seated</Text>
      </View>
      {locked ? (
        <Text style={hint}>Locked — match has started.</Text>
      ) : (
        <Text style={hint}>Only seated players get ratings and stats.</Text>
      )}
      {error ? <Text style={{ color: FUT.rose, fontSize: 11 }}>{error}</Text> : null}
      {myPlayer && !locked ? (
        <TouchableOpacity onPress={takeSeat} disabled={saving} style={seatBtn}>
          {saving
            ? <ActivityIndicator color="#041018" />
            : (
              <>
                <Ionicons name={iAmSeated ? 'checkmark-circle' : 'person-add'} size={16} color="#041018" />
                <Text style={{ color: '#041018', fontWeight: '900' }}>{iAmSeated ? 'Leave seat' : 'Take my seat'}</Text>
              </>
            )}
        </TouchableOpacity>
      ) : null}
      <View style={{ gap: 6, marginTop: 8 }}>
        {players.slice(0, 12).map((p) => {
          const on = seated.some((id) => sameId(id, p.id));
          return (
            <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: on ? '#fff' : 'rgba(255,255,255,0.45)', fontSize: 12 }}>{p.gamertag}</Text>
              <Text style={{ color: on ? FUT.lime : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800' }}>
                {on ? 'SEATED' : 'OUT'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const card = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: 2,
  padding: 14,
  gap: 8,
};
const title = { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 };
const hint = { color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 16 };
const seatBtn = {
  backgroundColor: CYAN,
  borderRadius: 12,
  paddingVertical: 11,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
};
