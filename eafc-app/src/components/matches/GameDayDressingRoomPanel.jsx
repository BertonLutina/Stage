import React from 'react';
import { Text, View } from 'react-native';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
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
  const customBg = hasCustomGameDayTileBackground(backgroundConfig);

  return (
    <View style={{
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(238,243,251,0.28)',
      backgroundColor: customBg ? 'rgba(0,0,0,0.4)' : 'rgba(23,29,39,0.9)',
      padding: 14,
    }}
    >
      <GameDayTileBackgroundLayers config={backgroundConfig} variant="card" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#F8FBFF', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>
            Dressing Room
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 4 }}>
            Available players take a seat here before kickoff so they can be featured in the game.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', maxWidth: 168 }}>
          <View style={countPill}>
            <Text style={countPillText}>Home {dressingCounts.home}</Text>
          </View>
          <View style={[countPill, { borderColor: 'rgba(142,238,255,0.35)', backgroundColor: 'rgba(142,238,255,0.1)' }]}>
            <Text style={[countPillText, { color: CYAN }]}>Away {dressingCounts.away}</Text>
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

const countPill = {
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.2)',
  backgroundColor: 'rgba(255,255,255,0.1)',
  paddingHorizontal: 10,
  paddingVertical: 4,
};

const countPillText = {
  color: 'rgba(255,255,255,0.8)',
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 1,
  textTransform: 'uppercase',
};
