import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { headingStyleLg } from '@/lib/fonts';
import { CARD_RADIUS, hexToRgba } from '@/lib/stageTheme';
import { CAREER_LABELS } from '@/lib/playerCareer';
import { getMatchOpponent, loadMyUpcomingMatches } from '@/lib/dashboardData';
import {
  GamerSectionCard,
  useGamerTokens,
} from '@/components/profile/gamer/GamerProfileUI';
import PlayerCareerSummary from '@/components/profile/PlayerCareerSummary';
import PlayerTransferHistory from '@/components/profile/PlayerTransferHistory';

function formatFixtureWhen(match) {
  const raw = match?.scheduled_date || match?.match_date;
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const day = date.toLocaleDateString('en-GB');
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${time}`;
}

function NextFixturesCard({ player, club }) {
  const tokens = useGamerTokens();
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    let alive = true;
    loadMyUpcomingMatches(player, club, 3)
      .then((rows) => { if (alive) setMatches(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (alive) setMatches([]); });
    return () => { alive = false; };
  }, [player?.id, club?.id]);

  return (
    <GamerSectionCard eyebrow={CAREER_LABELS.fixturesEyebrow} title={CAREER_LABELS.fixturesTitle}>
      {matches.length === 0 ? (
        <Text style={{ color: tokens.muted, fontSize: 13 }}>{CAREER_LABELS.noFixtures}</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {matches.map((match) => {
            const sides = getMatchOpponent(match, player, club);
            return (
              <View
                key={match.id}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: tokens.border,
                  backgroundColor: tokens.inputFill,
                  padding: 12,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                    {club?.name || sides.home}
                  </Text>
                  <View style={{
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    backgroundColor: hexToRgba(tokens.amber, 0.14),
                    borderWidth: 1,
                    borderColor: tokens.amberBorder,
                  }}>
                    <Text style={{ color: tokens.amber, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
                      {sides.isHome ? 'HOME' : 'AWAY'}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: tokens.muted, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                  vs {sides.opponent}
                </Text>
                {formatFixtureWhen(match) ? (
                  <Text style={{ color: tokens.faint, fontSize: 11 }}>{formatFixtureWhen(match)}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </GamerSectionCard>
  );
}

export default function ProfileCareerBoard({ player, signedClub, career, careerLoading }) {
  const tokens = useGamerTokens();
  const name = player?.gamertag || player?.display_name || 'Player';

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          borderRadius: CARD_RADIUS,
          overflow: 'hidden',
          minHeight: 128,
          borderWidth: 1,
          borderColor: hexToRgba(tokens.danger, 0.5),
          backgroundColor: tokens.live ? tokens.card : tokens.dangerBg,
          paddingHorizontal: 16,
          paddingVertical: 18,
        }}
      >
        <Text style={{ color: tokens.danger, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase' }}>
          {CAREER_LABELS.careerMode}
        </Text>
        <Text style={[headingStyleLg, { color: tokens.text, marginTop: 8, lineHeight: 30 }]}>
          {name} Career
        </Text>
        <Text style={{ color: tokens.textSoft, fontSize: 14, lineHeight: 20, marginTop: 8 }}>
          {CAREER_LABELS.careerBannerHint}
        </Text>
      </View>

      <NextFixturesCard player={player} club={signedClub} />
      <PlayerCareerSummary career={career} loading={careerLoading} />
      <PlayerTransferHistory playerId={player?.id} />
    </View>
  );
}
