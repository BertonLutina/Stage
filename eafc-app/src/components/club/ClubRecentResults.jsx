import React from 'react';
import { Text, View } from 'react-native';
import useThemeStore from '@/store/themeStore';
import useT from '@/hooks/useT';
import { hexToRgba } from '@/lib/stageTheme';
import { lastResults } from '@/lib/clubForm';
import { Card, SectionLabel } from '@/components/ui';

function OutcomeChip({ outcome, size = 36 }) {
  const tokens = useThemeStore((s) => s.tokens);
  const t = useT();
  const color = outcome === 'W' ? tokens.success : outcome === 'L' ? tokens.danger : tokens.muted;
  const letter = t(`stage.club.${outcome === 'W' ? 'win' : outcome === 'L' ? 'loss' : 'draw'}`);
  const label = t(`stage.club.${outcome === 'W' ? 'winLabel' : outcome === 'L' ? 'lossLabel' : 'drawLabel'}`);
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: hexToRgba(color, 0.5),
        backgroundColor: hexToRgba(color, 0.18),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color, fontSize: 14, fontWeight: '800' }}>{letter}</Text>
    </View>
  );
}

/**
 * "Recent form" (oldest to newest, so the last chip is the latest match) and "Last results",
 * both read from the club's real completed matches.
 */
export default function ClubRecentResults({ matches, clubId, limit = 5 }) {
  const tokens = useThemeStore((s) => s.tokens);
  const t = useT();
  const rows = lastResults(matches, clubId, limit);

  return (
    <View style={{ gap: 14 }}>
      {rows.length > 0 ? (
        <Card testID="club-recent-form" style={{ gap: 12 }}>
          <SectionLabel>{t('stage.club.recentForm')}</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[...rows].reverse().map((row) => (
              <OutcomeChip key={row.id} outcome={row.outcome} />
            ))}
          </View>
        </Card>
      ) : null}

      <Card testID="club-last-results" style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionLabel>{t('stage.club.lastResults')}</SectionLabel>
          {rows.length > 0 ? (
            <Text style={{ color: tokens.muted, fontSize: 12 }}>{t('stage.club.allCompetitions')}</Text>
          ) : null}
        </View>
        {rows.length === 0 ? (
          <View style={{ paddingVertical: 10, gap: 4 }}>
            <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>{t('stage.club.noResults')}</Text>
            <Text style={{ color: tokens.muted, fontSize: 13 }}>{t('stage.club.noResultsBody')}</Text>
          </View>
        ) : rows.map((row) => (
          <View
            key={row.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 6 }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 15 }}>
                {`${row.home ? t('stage.club.versus') : t('stage.club.at')} ${row.opponent || t('stage.club.opponent')}`}
              </Text>
              {row.competition ? (
                <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>{row.competition}</Text>
              ) : null}
            </View>
            <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '800' }}>{`${row.mine} – ${row.theirs}`}</Text>
            <OutcomeChip outcome={row.outcome} />
          </View>
        ))}
      </Card>
    </View>
  );
}
