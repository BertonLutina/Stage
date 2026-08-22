import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { headingStyleLg } from '@/lib/fonts';
import { CAREER_LABELS } from '@/lib/playerCareer';
import { getMatchOpponent, loadMyUpcomingMatches } from '@/lib/dashboardData';
import {
  AMBER,
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
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: tokens.hairline,
                  backgroundColor: tokens.inputFill,
                  padding: 12,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ color: tokens.text, fontSize: 13, fontWeight: '800', flex: 1 }} numberOfLines={1}>
                    {club?.name || sides.home}
                  </Text>
                  <View style={{
                    borderRadius: 4,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    backgroundColor: 'rgba(255,214,10,0.14)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,214,10,0.35)',
                  }}>
                    <Text style={{ color: AMBER, fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>
                      {sides.isHome ? 'HOME' : 'AWAY'}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: tokens.muted, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
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
  const name = player?.gamertag || player?.display_name || 'Player';

  return (
    <View style={{ gap: 12 }}>
      <View style={{ borderRadius: 8, overflow: 'hidden', minHeight: 128 }}>
        <LinearGradient
          colors={['#4A1520', '#1A0A12', '#0A070C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingVertical: 18 }}
        >
          <Text style={{ color: '#F87171', fontSize: 10, fontWeight: '900', letterSpacing: 1.8, textTransform: 'uppercase' }}>
            {CAREER_LABELS.careerMode}
          </Text>
          <Text style={[headingStyleLg, { color: '#fff', marginTop: 8, lineHeight: 28 }]}>
            {name} Career
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 19, marginTop: 8 }}>
            {CAREER_LABELS.careerBannerHint}
          </Text>
        </LinearGradient>
      </View>

      <NextFixturesCard player={player} club={signedClub} />
      <PlayerCareerSummary career={career} loading={careerLoading} />
      <PlayerTransferHistory playerId={player?.id} />
    </View>
  );
}
