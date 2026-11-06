import React from 'react';
import { Text, View } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { TILE_FILL_LIVE, sectionLabelStyle, tileChrome } from '@/components/dashboard/CommandCenterUI';
import { hexToRgba } from '@/lib/stageTheme';
import GameDayDressingRoom from './GameDayDressingRoom';
import GameDayTileBackgroundLayers from './GameDayTileBackgroundLayers';
import GameDayTileMenuButton from './GameDayTileMenuButton';
import { hasCustomGameDayTileBackground } from '@/lib/gameDayTileBackgrounds';

export default function GameDayDressingRoomPanel({
  game,
  myClub,
  myPlayer,
  dressingCounts = { home: 0, away: 0 },
  backgroundConfig,
  onChangeBackground,
  onSeatChange,
}) {
  const tokens = useThemeStore((st) => st.tokens);
  const customBg = hasCustomGameDayTileBackground(backgroundConfig);
  // A photo background needs a translucent veil so it shows through; otherwise the normal card fill.
  const veil = tokens.live ? TILE_FILL_LIVE : hexToRgba(tokens.bgDeep, 0.55);

  return (
    <View style={[tileChrome(tokens, customBg ? { backgroundColor: veil } : {}), { padding: 16 }]}>
      <GameDayTileBackgroundLayers config={backgroundConfig} variant="card" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={sectionLabelStyle(tokens)}>Dressing Room</Text>
          <Text style={{ color: tokens.muted, fontSize: 13, marginTop: 4 }}>
            Available players take a seat here before kickoff so they can be featured in the game.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', maxWidth: 168 }}>
          <View style={[countPill(tokens.borderStrong, hexToRgba(tokens.text, 0.08))]}>
            <Text style={[countPillText, { color: tokens.textSoft }]}>Home {dressingCounts.home}</Text>
          </View>
          <View style={countPill(hexToRgba(tokens.cyan, 0.4), hexToRgba(tokens.cyan, 0.14))}>
            <Text style={[countPillText, { color: tokens.cyan }]}>Away {dressingCounts.away}</Text>
          </View>
          <GameDayTileMenuButton
            onPress={onChangeBackground}
            accessibilityLabel="Change Dressing Room background"
          />
        </View>
      </View>
      <GameDayDressingRoom
        game={game}
        myClub={myClub}
        myPlayer={myPlayer}
        embedded
        onSeatChange={onSeatChange}
      />
    </View>
  );
}

const countPill = (borderColor, backgroundColor) => ({
  height: 26,
  justifyContent: 'center',
  paddingHorizontal: 10,
  borderRadius: 999,
  borderWidth: 1,
  borderColor,
  backgroundColor,
});

const countPillText = {
  fontSize: 11,
  fontWeight: '600',
};
