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
import useThemeStore from '@/store/themeStore';
import { hexToRgba } from '@/lib/stageTheme';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import Card from '@/components/ui/Card';
import { EmptyTabPanel } from '@/components/profile/gamer/GamerProfileUI';

function availabilityColor(tokens, status) {
  if (status === 'available') return tokens.success;
  if (status === 'unavailable') return tokens.danger;
  if (status === 'maybe') return tokens.warning;
  return tokens.muted;
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
  const tokens = useThemeStore((st) => st.tokens);
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
  const myColor = availabilityColor(tokens, myStatus);
  const showMemberControls = canSetAvailability && myPlayer?.id && canManageAvailability;
  const showTeamSummary = canViewTeamAvailability && canManageAvailability;

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: tokens.border }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 180 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <View style={{ borderWidth: 1, borderColor: tokens.border, backgroundColor: tokens.bgDeep, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: tokens.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {isHome ? 'Home' : 'Away'}
              </Text>
            </View>
            <Text style={{ color: tokens.text, fontWeight: '600', fontSize: 14, flexShrink: 1 }} numberOfLines={1}>
              {isHome ? 'vs' : 'at'} {opponent || 'TBD'}
            </Text>
          </View>
          <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
            {fixtureEventName(fixture, group)}
          </Text>
          <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>{fixtureDateLabel(fixture)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={{ borderWidth: 1, borderColor: hexToRgba(completed ? tokens.amber : tokens.success, 0.4), backgroundColor: hexToRgba(completed ? tokens.amber : tokens.success, 0.12), borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: completed ? tokens.amber : tokens.success, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {completed ? 'Completed' : (fixture.status || 'Scheduled')}
            </Text>
          </View>
          <Text style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 18, minWidth: 56, textAlign: 'center' }}>
            {hasScore ? `${mine}-${theirs}` : 'TBD'}
          </Text>
        </View>
      </View>

      {(showMemberControls || showTeamSummary) ? (
        <View style={{ marginTop: 10, borderWidth: 1, borderColor: tokens.border, backgroundColor: tokens.bgDeep, borderRadius: 12, padding: 12, gap: 10 }}>
          {showMemberControls ? (
            <View>
              <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase' }}>My availability</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <View style={{ borderWidth: 1, borderColor: hexToRgba(myColor, 0.4), borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: myColor, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
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
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: hexToRgba(availabilityColor(tokens, status), 0.5),
                      backgroundColor: myStatus === status
                        ? availabilityColor(tokens, status)
                        : hexToRgba(availabilityColor(tokens, status), 0.1),
                    }}
                  >
                    <Text style={{ color: myStatus === status ? tokens.onCyan : availabilityColor(tokens, status), fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
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
                <Text style={{ color: tokens.success, fontSize: 12, fontWeight: '700' }}>{counts.available} Available</Text>
                <Text style={{ color: tokens.danger, fontSize: 12, fontWeight: '700' }}>{counts.unavailable} Unavailable</Text>
                <Text style={{ color: tokens.muted, fontSize: 12, fontWeight: '700' }}>{counts.no_response} No Response</Text>
              </View>
              {responseRows.length ? (
                <TouchableOpacity onPress={onToggleResponses} style={{ marginTop: 8, minHeight: 44, justifyContent: 'center' }}>
                  <Text style={{ color: tokens.cyan, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
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
            <View key={row.player.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, borderColor: tokens.border, backgroundColor: tokens.bgDeep, paddingHorizontal: 12, paddingVertical: 10 }}>
              <Text style={{ color: tokens.textSoft, fontSize: 13, flex: 1, marginRight: 8 }} numberOfLines={1}>
                {row.player.gamertag || row.player.email || 'Player'}
              </Text>
              <Text style={{ color: availabilityColor(tokens, row.status), fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
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
  const tokens = useThemeStore((st) => st.tokens);

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
        <View style={{ borderWidth: 1, borderColor: tokens.danger, backgroundColor: tokens.dangerBg, padding: 12, borderRadius: 12 }}>
          <Text style={{ color: tokens.danger, fontSize: 13 }}>{availabilityError}</Text>
        </View>
      ) : null}
      {grouped.map((group) => (
        <Card key={group.key} style={{ overflow: 'hidden', padding: 0 }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            {group.parent ? (
              <Text numberOfLines={1} style={{ color: tokens.cyan, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase' }}>{group.parent}</Text>
            ) : null}
            <Text numberOfLines={2} style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 16, letterSpacing: 16 * 0.03, textTransform: 'uppercase', marginTop: group.parent ? 2 : 0 }}>{group.title}</Text>
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
        </Card>
      ))}
      {busyAvailability ? <ActivityIndicator color={tokens.cyan} style={{ marginTop: 4 }} /> : null}
    </View>
  );
}
