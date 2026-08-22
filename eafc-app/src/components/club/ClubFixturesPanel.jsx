import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { stageClient } from '@/api/stageClient';
import { asObjectArray } from '@/lib/clubProfileData';
import {
  FIXTURE_AVAILABILITY_LABELS,
  buildAvailabilityByFixture,
  buildFixtureResponseRows,
  fixtureCanSetAvailability,
  fixtureDateLabel,
  fixtureEventName,
  fixtureIsCompleted,
  getFixtureAvailabilityCounts,
  groupClubFixtures,
} from '@/lib/clubFixtures';
import { EmptyTabPanel } from '@/components/profile/gamer/GamerProfileUI';

function availabilityColor(status) {
  if (status === 'available') return '#6EE7B7';
  if (status === 'unavailable') return '#FCA5A5';
  if (status === 'maybe') return '#FBBF24';
  return 'rgba(255,255,255,0.45)';
}

function FixtureRow({
  fixture,
  group,
  clubId,
  clubPlayers,
  myPlayer,
  canSetAvailability,
  canViewTeamAvailability,
  availabilityRows,
  playerById,
  responsesOpen,
  onToggleResponses,
  busyAvailability,
  onSetAvailability,
}) {
  const isHome = fixture.home_club_id === clubId;
  const opponent = isHome ? fixture.away_club_name : fixture.home_club_name;
  const mine = isHome ? fixture.home_score : fixture.away_score;
  const theirs = isHome ? fixture.away_score : fixture.home_score;
  const hasScore = mine != null && theirs != null;
  const completed = fixtureIsCompleted(fixture);
  const canManageAvailability = fixtureCanSetAvailability(fixture);
  const myAvailability = availabilityRows.find((row) => String(row.player_id) === String(myPlayer?.id));
  const myStatus = myAvailability?.status || 'no_response';
  const counts = getFixtureAvailabilityCounts(availabilityRows, clubPlayers);
  const responseRows = buildFixtureResponseRows(availabilityRows, clubPlayers, playerById);
  const showMemberControls = canSetAvailability && myPlayer?.id && canManageAvailability;
  const showTeamSummary = canViewTeamAvailability && canManageAvailability;

  return (
    <View style={{ paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 180 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <View style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 6, paddingVertical: 3 }}>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                {isHome ? 'Home' : 'Away'}
              </Text>
            </View>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14, flexShrink: 1 }} numberOfLines={1}>
              {isHome ? 'vs' : 'at'} {opponent || 'TBD'}
            </Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }} numberOfLines={1}>
            {fixtureEventName(fixture, group)}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 4 }}>{fixtureDateLabel(fixture)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={{ borderWidth: 1, borderColor: completed ? 'rgba(245,197,66,0.35)' : 'rgba(110,231,183,0.3)', backgroundColor: completed ? 'rgba(245,197,66,0.1)' : 'rgba(110,231,183,0.08)', paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: completed ? '#F5C542' : '#6EE7B7', fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
              {completed ? 'Completed' : (fixture.status || 'Scheduled')}
            </Text>
          </View>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, minWidth: 56, textAlign: 'center' }}>
            {hasScore ? `${mine}-${theirs}` : 'TBD'}
          </Text>
        </View>
      </View>

      {(showMemberControls || showTeamSummary) ? (
        <View style={{ marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 10, gap: 10 }}>
          {showMemberControls ? (
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }}>My availability</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <View style={{ borderWidth: 1, borderColor: `${availabilityColor(myStatus)}55`, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ color: availabilityColor(myStatus), fontSize: 9, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    {FIXTURE_AVAILABILITY_LABELS[myStatus] || myStatus}
                  </Text>
                </View>
                {['available', 'unavailable'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    disabled={busyAvailability === `${fixture.id}:${status}`}
                    onPress={() => onSetAvailability(fixture, status)}
                    style={{
                      minHeight: 44,
                      paddingHorizontal: 12,
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: status === 'available' ? 'rgba(110,231,183,0.35)' : 'rgba(252,165,165,0.35)',
                      backgroundColor: myStatus === status
                        ? (status === 'available' ? '#6EE7B7' : '#FCA5A5')
                        : (status === 'available' ? 'rgba(110,231,183,0.08)' : 'rgba(252,165,165,0.08)'),
                    }}
                  >
                    <Text style={{ color: myStatus === status ? '#000' : (status === 'available' ? '#6EE7B7' : '#FCA5A5'), fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      {busyAvailability === `${fixture.id}:${status}` ? 'Saving…' : FIXTURE_AVAILABILITY_LABELS[status]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {showTeamSummary ? (
            <View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ color: '#6EE7B7', fontSize: 10, fontWeight: '900' }}>{counts.available} Available</Text>
                <Text style={{ color: '#FCA5A5', fontSize: 10, fontWeight: '900' }}>{counts.unavailable} Unavailable</Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '900' }}>{counts.no_response} No Response</Text>
              </View>
              {responseRows.length ? (
                <TouchableOpacity onPress={onToggleResponses} style={{ marginTop: 8, minHeight: 44, justifyContent: 'center' }}>
                  <Text style={{ color: '#00E5FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    {responsesOpen ? 'Hide responses' : 'View responses'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {showTeamSummary && responsesOpen ? (
        <View style={{ marginTop: 8, gap: 6 }}>
          {responseRows.map((row) => (
            <View key={row.player.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 10, paddingVertical: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, flex: 1, marginRight: 8 }} numberOfLines={1}>
                {row.player.gamertag || row.player.email || 'Player'}
              </Text>
              <Text style={{ color: availabilityColor(row.status), fontSize: 9, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {FIXTURE_AVAILABILITY_LABELS[row.status] || row.status}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function ClubFixturesPanel({
  clubId,
  clubPlayers = [],
  myPlayer,
  canSetAvailability = false,
  canViewTeamAvailability = false,
  availabilityRows = [],
  onAvailabilityRowsChange,
  matches = [],
  upcomingMatches = [],
}) {
  const [busyAvailability, setBusyAvailability] = useState(null);
  const [expandedResponses, setExpandedResponses] = useState({});
  const [availabilityError, setAvailabilityError] = useState(null);

  const grouped = useMemo(() => {
    const fixturesById = new Map();
    for (const fixture of [...asObjectArray(matches), ...asObjectArray(upcomingMatches)]) {
      if (!fixture?.id) continue;
      if (fixture.home_club_id !== clubId && fixture.away_club_id !== clubId) continue;
      fixturesById.set(fixture.id, { ...fixturesById.get(fixture.id), ...fixture });
    }
    return groupClubFixtures([...fixturesById.values()]);
  }, [clubId, matches, upcomingMatches]);

  const availabilityByFixture = useMemo(() => buildAvailabilityByFixture(availabilityRows), [availabilityRows]);
  const playerById = useMemo(
    () => new Map(asObjectArray(clubPlayers).filter((player) => player?.id).map((player) => [String(player.id), player])),
    [clubPlayers],
  );

  async function setMyFixtureAvailability(fixture, status) {
    if (!myPlayer?.id || !fixtureCanSetAvailability(fixture)) return;
    const busyKey = `${fixture.id}:${status}`;
    setBusyAvailability(busyKey);
    setAvailabilityError(null);
    const existing = (availabilityByFixture.get(String(fixture.id)) || [])
      .find((row) => String(row.player_id) === String(myPlayer.id));
    const body = {
      club_id: clubId,
      fixture_id: fixture.id,
      fixture_type: fixture._fixtureType || fixture.fixture_type || 'match',
      player_id: myPlayer.id,
      status,
    };
    try {
      const saved = existing
        ? await stageClient.http.patch(`/club-fixture-availabilities/${existing.id}`, body)
        : await stageClient.http.post('/club-fixture-availabilities', body);
      if (saved?.id) {
        onAvailabilityRowsChange?.((prev) => {
          const rows = asObjectArray(prev).filter((row) => row.id !== saved.id);
          return [saved, ...rows];
        });
      }
    } catch (err) {
      setAvailabilityError(err?.message || 'Could not update availability.');
    } finally {
      setBusyAvailability(null);
    }
  }

  if (!grouped.length) {
    return <EmptyTabPanel icon="calendar-outline" title="No fixtures yet" hint="Upcoming league, cup, and gameday fixtures will show here." />;
  }

  return (
    <View style={{ gap: 14 }}>
      {availabilityError ? (
        <View style={{ borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)', backgroundColor: 'rgba(248,113,113,0.08)', padding: 10, borderRadius: 12 }}>
          <Text style={{ color: '#FCA5A5', fontSize: 12 }}>{availabilityError}</Text>
        </View>
      ) : null}
      {grouped.map((group) => (
        <View key={group.key} style={{ overflow: 'hidden', borderRadius: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <View style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 12 }}>
            {group.parent ? (
              <Text style={{ color: 'rgba(0,229,255,0.65)', fontSize: 10, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase' }}>{group.parent}</Text>
            ) : null}
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: group.parent ? 2 : 0 }}>{group.title}</Text>
          </View>
          {group.fixtures.map((fixture) => (
            <FixtureRow
              key={fixture.id}
              fixture={fixture}
              group={group}
              clubId={clubId}
              clubPlayers={clubPlayers}
              myPlayer={myPlayer}
              canSetAvailability={canSetAvailability}
              canViewTeamAvailability={canViewTeamAvailability}
              availabilityRows={availabilityByFixture.get(String(fixture.id)) || []}
              playerById={playerById}
              responsesOpen={Boolean(expandedResponses[fixture.id])}
              onToggleResponses={() => setExpandedResponses((prev) => ({ ...prev, [fixture.id]: !prev[fixture.id] }))}
              busyAvailability={busyAvailability}
              onSetAvailability={setMyFixtureAvailability}
            />
          ))}
        </View>
      ))}
      {busyAvailability ? <ActivityIndicator color="#00E5FF" style={{ marginTop: 4 }} /> : null}
    </View>
  );
}
