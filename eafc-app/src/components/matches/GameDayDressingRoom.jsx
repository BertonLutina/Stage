import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { Button, SectionLabel } from '@/components/ui';
import { parseIdList, sameId } from '@/lib/gameDayOps';

export default function GameDayDressingRoom({ game, myClub, myPlayer, embedded = false, onSeatChange }) {
  const tokens = useThemeStore((st) => st.tokens);
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
        setRoomId(created?.id || created?.data?.id || roomId);
      }
      onSeatChange?.({ clubId: myClub.id, seatedPlayers: next });
    } catch (err) {
      setSeated(prev);
      setError(err?.message || 'Could not update seat');
    } finally {
      setSaving(false);
    }
  };

  if (!myClub) return null;
  if (loading) return <ActivityIndicator color={tokens.cyan} style={{ marginVertical: 12 }} />;

  const hint = { color: tokens.muted, fontSize: 13, lineHeight: 18 };

  return (
    <View style={{ gap: 12 }}>
      {!embedded ? (
        <SectionLabel
          right={(
            <Text style={{ color: tokens.cyan, fontSize: 12, fontWeight: '600' }}>{seated.length}/{players.length} seated</Text>
          )}
        >
          DRESSING ROOM
        </SectionLabel>
      ) : null}
      {locked ? (
        <Text style={hint}>Locked — match has started.</Text>
      ) : (
        <Text style={hint}>Only seated players get ratings and stats.</Text>
      )}
      {error ? <Text style={{ color: tokens.danger, fontSize: 12 }}>{error}</Text> : null}
      {myPlayer && !locked ? (
        <Button
          title={iAmSeated ? 'Leave seat' : 'Take my seat'}
          icon={iAmSeated ? 'checkmark-circle-outline' : 'person-add-outline'}
          loading={saving}
          onPress={takeSeat}
        />
      ) : null}
      <View style={{ gap: 8 }}>
        {players.slice(0, 12).map((p) => {
          const on = seated.some((id) => sameId(id, p.id));
          return (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Text numberOfLines={1} style={{ flex: 1, color: on ? tokens.text : tokens.muted, fontSize: 14 }}>{p.gamertag}</Text>
              <Text style={{ color: on ? tokens.success : tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12 }}>
                {on ? 'SEATED' : 'OUT'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
