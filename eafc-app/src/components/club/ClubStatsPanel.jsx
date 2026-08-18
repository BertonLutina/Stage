import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { stageClient } from '@/api/stageClient';
import { asObjectArray } from '@/lib/clubProfileData';
import {
  CLUB_STATS_TABLES,
  buildClubLeaderboard,
  buildClubPlayerStatMap,
  formatClubRating,
  getClubStatValue,
} from '@/lib/clubPlayerStats';
import { hasStagePlus } from '@/lib/subscriptionUtils';
import { EmptyTabPanel } from '@/components/profile/gamer/GamerProfileUI';

function LeaderboardCard({ title, label, rows, stat }) {
  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.25)', overflow: 'hidden' }}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.8, textTransform: 'uppercase' }}>{title}</Text>
      </View>
      {rows.length ? rows.map(({ player, value }, index) => (
        <View
          key={player.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderTopWidth: index ? 1 : 0,
            borderTopColor: 'rgba(255,255,255,0.05)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <Text style={{ color: 'rgba(0,229,255,0.75)', fontWeight: '900', width: 18 }}>{index + 1}</Text>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, flex: 1 }} numberOfLines={1}>
              {player.gamertag || player.display_name || 'Player'}
            </Text>
          </View>
          <Text style={{ color: '#F5C542', fontWeight: '900', fontSize: 14 }}>
            {stat === 'rating' ? formatClubRating(value) : String(Math.round(Number(value) || 0))} {label}
          </Text>
        </View>
      )) : (
        <View style={{ padding: 16 }}>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>No club stats yet.</Text>
        </View>
      )}
    </View>
  );
}

export default function ClubStatsPanel({ clubId, players = [], myPlayer, canCustomize = false }) {
  const [statRows, setStatRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const canUseBackgrounds = hasStagePlus(myPlayer?.subscription);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await stageClient.entities.PlayerStat.filter({ club_id: clubId }, '-created_date', 500).catch(() => []);
      if (!cancelled) {
        setStatRows(asObjectArray(rows));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clubId]);

  const statsByPlayerId = useMemo(
    () => buildClubPlayerStatMap(players, statRows, clubId),
    [players, statRows, clubId],
  );

  if (loading) {
    return <EmptyTabPanel icon="stats-chart-outline" title="Loading stats" hint="Club leaderboards are loading." />;
  }

  const hasAny = players.some((player) => getClubStatValue(player, 'matches', statsByPlayerId) > 0
    || getClubStatValue(player, 'goals', statsByPlayerId) > 0);

  return (
    <View style={{ gap: 14 }}>
      <View>
        <Text style={{ color: 'rgba(0,229,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>Club Stats</Text>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 2 }}>Leaderboards</Text>
      </View>
      {canCustomize && !canUseBackgrounds ? (
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,197,66,0.25)', backgroundColor: 'rgba(245,197,66,0.08)', padding: 12 }}>
          <Text style={{ color: '#F5C542', fontSize: 12, fontWeight: '800' }}>
            Stage+ unlocks custom stats tile backgrounds on web and mobile.
          </Text>
        </View>
      ) : null}
      {!hasAny ? (
        <EmptyTabPanel icon="stats-chart-outline" title="No stats yet" hint="Completed club matches will populate these leaderboards." />
      ) : CLUB_STATS_TABLES.map((table) => (
        <LeaderboardCard
          key={table.stat}
          title={table.title}
          label={table.label}
          stat={table.stat}
          rows={buildClubLeaderboard(players, table.stat, statsByPlayerId)}
        />
      ))}
    </View>
  );
}
