import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Circle, Text as SvgText, Image as SvgImage } from 'react-native-svg';

const FIELD_WIDTH = 300;
const FIELD_HEIGHT = 420;

const FORMATION_DEFAULTS = {
  '4-3-3': [
    { position_code: 'GK', x_coord: 50, y_coord: 92 },
    { position_code: 'RB', x_coord: 80, y_coord: 75 },
    { position_code: 'CB', x_coord: 62, y_coord: 75 },
    { position_code: 'CB', x_coord: 38, y_coord: 75 },
    { position_code: 'LB', x_coord: 20, y_coord: 75 },
    { position_code: 'CM', x_coord: 70, y_coord: 55 },
    { position_code: 'CM', x_coord: 50, y_coord: 50 },
    { position_code: 'CM', x_coord: 30, y_coord: 55 },
    { position_code: 'RW', x_coord: 80, y_coord: 25 },
    { position_code: 'ST', x_coord: 50, y_coord: 15 },
    { position_code: 'LW', x_coord: 20, y_coord: 25 },
  ],
  '4-4-2': [
    { position_code: 'GK', x_coord: 50, y_coord: 92 },
    { position_code: 'RB', x_coord: 80, y_coord: 75 },
    { position_code: 'CB', x_coord: 62, y_coord: 75 },
    { position_code: 'CB', x_coord: 38, y_coord: 75 },
    { position_code: 'LB', x_coord: 20, y_coord: 75 },
    { position_code: 'RM', x_coord: 80, y_coord: 52 },
    { position_code: 'CM', x_coord: 62, y_coord: 52 },
    { position_code: 'CM', x_coord: 38, y_coord: 52 },
    { position_code: 'LM', x_coord: 20, y_coord: 52 },
    { position_code: 'ST', x_coord: 63, y_coord: 20 },
    { position_code: 'ST', x_coord: 37, y_coord: 20 },
  ],
  '4-2-3-1': [
    { position_code: 'GK', x_coord: 50, y_coord: 92 },
    { position_code: 'RB', x_coord: 80, y_coord: 75 },
    { position_code: 'CB', x_coord: 62, y_coord: 75 },
    { position_code: 'CB', x_coord: 38, y_coord: 75 },
    { position_code: 'LB', x_coord: 20, y_coord: 75 },
    { position_code: 'CDM', x_coord: 60, y_coord: 60 },
    { position_code: 'CDM', x_coord: 40, y_coord: 60 },
    { position_code: 'RW', x_coord: 78, y_coord: 38 },
    { position_code: 'CAM', x_coord: 50, y_coord: 35 },
    { position_code: 'LW', x_coord: 22, y_coord: 38 },
    { position_code: 'ST', x_coord: 50, y_coord: 15 },
  ],
};

export default function FormationView({ formation, players = [] }) {
  const formName = formation?.name || '4-3-3';
  const positions = formation?.positions?.length > 0
    ? formation.positions
    : FORMATION_DEFAULTS[formName] || FORMATION_DEFAULTS['4-3-3'];

  return (
    <View className="items-center my-2">
      <Text className="text-primary font-bold text-lg mb-2">{formName}</Text>
      <Svg width={FIELD_WIDTH} height={FIELD_HEIGHT} viewBox={`0 0 100 140`}>
        <Rect x="0" y="0" width="100" height="140" fill="#22C55E" rx="4" />
        <Rect x="2" y="2" width="96" height="136" fill="none" stroke="#16A34A" strokeWidth="0.5" />
        <Rect x="20" y="0" width="60" height="20" fill="none" stroke="#16A34A" strokeWidth="0.5" />
        <Rect x="35" y="0" width="30" height="10" fill="none" stroke="#16A34A" strokeWidth="0.5" />
        <Rect x="20" y="120" width="60" height="20" fill="none" stroke="#16A34A" strokeWidth="0.5" />
        <Rect x="35" y="130" width="30" height="10" fill="none" stroke="#16A34A" strokeWidth="0.5" />
        <Rect x="2" y="2" width="96" height="136" fill="none" stroke="white" strokeWidth="0.4" opacity="0.3" />
        {/* Center line */}
        <Rect x="2" y="69" width="96" height="0.5" fill="white" opacity="0.4" />
        <Circle cx="50" cy="70" r="10" fill="none" stroke="white" strokeWidth="0.4" opacity="0.4" />

        {positions.map((pos, idx) => {
          const player = players[idx];
          const x = pos.x_coord;
          const y = pos.y_coord * 1.4;
          return (
            <React.Fragment key={idx}>
              <Circle cx={x} cy={y} r="5" fill="#F5C518" opacity={0.95} />
              <SvgText x={x} y={y + 1.5} fontSize="3.5" fill="#0F0F0F" textAnchor="middle" fontWeight="bold">
                {pos.position_code}
              </SvgText>
              {player?.gamer_tag ? (
                <SvgText x={x} y={y + 9} fontSize="3" fill="white" textAnchor="middle">
                  {player.gamer_tag.slice(0, 8)}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
