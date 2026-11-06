import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import useTournament from '@/hooks/useTournament';
import { Button, Card, Chip, Screen, SectionLabel } from '@/components/ui';
import GroupTable from '@/components/tournament/GroupTable';
import CompetitionHeader from '@/components/tournament/CompetitionHeader';

function teamName(match, side) {
  return match?.[`${side}_club_name`]
    || match?.[`${side}_player_name`]
    || match?.[`${side}_team_name`]
    || 'TBD';
}
function GroupMatch({ match, onPress }) {
  const tokens = useThemeStore((state) => state.tokens);
  const complete = ['completed', 'forfeit'].includes(String(match?.status || '').toLowerCase());
  const date = match?.scheduled_at ? new Date(match.scheduled_at) : null;
  const time = date && !Number.isNaN(date.getTime())
    ? date.toLocaleTimeString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Scheduled';

  return (
    <Card onPress={onPress} highlight={!complete} style={{ paddingVertical: 13, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text numberOfLines={1} style={{ flex: 1, color: tokens.text, fontSize: 14, textAlign: 'right' }}>
          {teamName(match, 'home')}
        </Text>
        <Text style={{ minWidth: 72, color: complete ? tokens.text : tokens.onCyan, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
          {complete ? `${match.home_score ?? 0} - ${match.away_score ?? 0}` : time}
        </Text>
        <Text numberOfLines={1} style={{ flex: 1, color: tokens.text, fontSize: 14 }}>
          {teamName(match, 'away')}
        </Text>
      </View>
    </Card>
  );
}

export default function GroupStageScreen() {
  const { tournamentId } = useLocalSearchParams();
  const router = useRouter();
  const tokens = useThemeStore((state) => state.tokens);
  const { data, loading, error, refreshing, refetch } = useTournament(tournamentId);
  const groups = data?.groups || [];
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    if (!groups.length) {
      setActiveGroup(null);
      return;
    }
    if (!groups.some((group) => group.id === activeGroup)) setActiveGroup(groups[0].id);
  }, [activeGroup, groups]);

  const group = groups.find((item) => item.id === activeGroup) || groups[0] || null;

  return (
    <Screen
      refreshControl={loading ? undefined : (
        <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} />
      )}
    >
      <View style={{ gap: 16 }}>
        <CompetitionHeader eyebrow={data?.tournament?.name || 'Tournament'} title="Group stage" />

        {loading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator color={tokens.cyan} />
          </View>
        ) : error ? (
          <Card style={{ gap: 14, alignItems: 'center' }}>
            <Text style={{ color: tokens.danger, textAlign: 'center' }}>{error}</Text>
            <Button title="Retry" variant="secondary" onPress={refetch} />
          </Card>
        ) : !group ? (
          <Card style={{ gap: 8, alignItems: 'center', paddingVertical: 28 }}>
            <Text style={{ color: tokens.text, fontWeight: '700' }}>No group data yet</Text>
            <Text style={{ color: tokens.muted, textAlign: 'center', lineHeight: 19 }}>
              Groups appear when the tournament draw creates group-stage matches.
            </Text>
          </Card>
        ) : (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {groups.map((item) => (
                <Chip
                  key={item.id}
                  label={item.name}
                  active={item.id === group.id}
                  onPress={() => setActiveGroup(item.id)}
                />
              ))}
            </View>
            <GroupTable group={group} />
            <Text style={{ color: tokens.muted, fontSize: 13 }}>
              Top teams qualify according to the tournament rules.
            </Text>
            <SectionLabel>{group.name} matches</SectionLabel>
            {group.matches.length ? group.matches.map((match) => (
              <GroupMatch
                key={match.id}
                match={match}
                onPress={() => router.push({
                  pathname: '/(tabs)/matches/matchdetailscreen',
                  params: { matchId: match.id },
                })}
              />
            )) : (
              <Text style={{ color: tokens.muted, textAlign: 'center', paddingVertical: 20 }}>
                No group fixtures yet
              </Text>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
