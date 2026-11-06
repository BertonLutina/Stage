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
import { entityHasStagePlus } from '@/lib/subscriptionUtils';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import Card from '@/components/ui/Card';
import { EmptyTabPanel } from '@/components/profile/gamer/GamerProfileUI';

function LeaderboardCard({ title, label, rows, stat }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: tokens.border, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text
          numberOfLines={1}
          style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase' }}
        >
          {title}
        </Text>
      </View>
      {rows.length ? rows.map(({ player, value }, index) => (
        <View
          key={player.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 44,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderTopWidth: index ? 1 : 0,
            borderTopColor: tokens.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <Text style={{ color: tokens.cyan, fontFamily: FONT_EA_SPORTS, fontSize: 14, width: 22 }}>{index + 1}</Text>
            <Text style={{ color: tokens.text, fontWeight: '600', fontSize: 14, flex: 1 }} numberOfLines={1}>
              {player.gamertag || player.display_name || 'Player'}
            </Text>
          </View>
          <Text style={{ color: tokens.amber, fontWeight: '700', fontSize: 14 }}>
            {stat === 'rating' ? formatClubRating(value) : String(Math.round(Number(value) || 0))} {label}
          </Text>
        </View>
      )) : (
        <View style={{ padding: 16 }}>
          <Text style={{ color: tokens.muted, fontSize: 13 }}>No club stats yet.</Text>
        </View>
      )}
    </Card>
  );
}

export default function ClubStatsPanel({ clubId, players = [], myPlayer, canCustomize = false }) {
  const [statRows, setStatRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const canUseBackgrounds = entityHasStagePlus(myPlayer);
  const tokens = useThemeStore((st) => st.tokens);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await stageClient.entities.MatchPlayerStat.filter({ club_id: clubId }, '-created_date', 500).catch(() => []);
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
        <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase' }}>Club Stats</Text>
        <Text style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 22, letterSpacing: 22 * 0.03, textTransform: 'uppercase', marginTop: 2 }}>Leaderboards</Text>
      </View>
      {canCustomize && !canUseBackgrounds ? (
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: tokens.warningBorder, backgroundColor: tokens.warningBg, padding: 12 }}>
          <Text style={{ color: tokens.warning, fontSize: 13, fontWeight: '600' }}>
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
