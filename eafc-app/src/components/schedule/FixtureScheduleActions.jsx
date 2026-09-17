import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import { isFixturePendingSchedule } from '@/lib/gameDayIntegration';
import { toMysqlDateTime } from '@/lib/momentDate';
import { acceptProposal, canAcceptProposal, proposeTime, roleForClub } from '@/lib/scheduleEngine';

export default function FixtureScheduleActions({
  fixture,
  fixtureType,
  myClub,
  userEmail,
  userGamertag,
  onDone,
  onError,
}) {
  const [busy, setBusy] = useState(false);
  const role = roleForClub(fixture, myClub?.id);
  if (!role || !myClub || !isFixturePendingSchedule(fixture)) return null;
  const showAccept = canAcceptProposal(fixture, role);

  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      await onDone?.();
    } catch (err) {
      onError?.(err?.message || 'Could not update schedule');
    } finally {
      setBusy(false);
    }
  };

  const onPropose = () => run(() => proposeTime({
    fixture,
    fixtureType,
    role,
    proposedDate: toMysqlDateTime(new Date(Date.now() + 86400000)),
    myClub,
    myEmail: userEmail,
    myGamertag: userGamertag || myClub?.name,
  }));

  const onAccept = () => run(() => acceptProposal({
    fixture,
    fixtureType,
    role,
    myClub,
    myEmail: userEmail,
  }));

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6, opacity: busy ? 0.5 : 1 }}>
      {showAccept ? (
        <TouchableOpacity onPress={onAccept} disabled={busy}>
          <Text style={{ color: CYAN, fontSize: 11, fontWeight: '800' }}>Accept time</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity onPress={onPropose} disabled={busy}>
        <Text style={{ color: CYAN, fontSize: 11, fontWeight: '800' }}>
          {showAccept ? 'Counter time' : 'Propose time'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
