import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { PAPER } from './newsPaperStyles';

const LAYOUT = {
  north_america: { left: '5%', top: '10%', width: '26%', height: '38%', radius: 28 },
  south_america: { left: '14%', top: '50%', width: '16%', height: '40%', radius: 36 },
  europe: { left: '36%', top: '8%', width: '16%', height: '24%', radius: 18 },
  africa: { left: '38%', top: '34%', width: '18%', height: '42%', radius: 22 },
  middle_east: { left: '54%', top: '26%', width: '12%', height: '18%', radius: 12 },
  asia: { left: '56%', top: '8%', width: '36%', height: '38%', radius: 26 },
  oceania: { left: '72%', top: '54%', width: '20%', height: '20%', radius: 20 },
};

export default function WorldAtlas({ continents = [], selectedId = '', onSelect }) {
  return (
    <View style={{
      borderWidth: 2,
      borderColor: PAPER.ink,
      backgroundColor: PAPER.slip,
      marginBottom: 12,
    }}
    >
      <View style={{ height: 188, backgroundColor: '#efe4b4' }} accessibilityLabel="World map">
        {continents.map((row) => {
          const box = LAYOUT[row.id];
          if (!box) return null;
          const selected = row.id === selectedId;
          const live = Number(row.count) > 0;
          return (
            <Pressable
              key={row.id}
              onPress={() => onSelect?.(row.id)}
              accessibilityRole="button"
              accessibilityLabel={row.name}
              style={{
                position: 'absolute',
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
                borderRadius: box.radius,
                borderWidth: 1.5,
                borderColor: PAPER.ink,
                backgroundColor: selected ? PAPER.tabloid : live ? '#c4a24a' : '#d7c27a',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <Text
                numberOfLines={2}
                style={{
                  color: selected ? PAPER.paper : PAPER.ink,
                  fontSize: 9,
                  fontWeight: '800',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}
              >
                {row.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 8, borderTopWidth: 1, borderTopColor: 'rgba(17,12,8,0.2)' }}>
        {continents.map((row) => {
          const active = row.id === selectedId;
          return (
            <Pressable
              key={row.id}
              onPress={() => onSelect?.(row.id)}
              accessibilityRole="button"
              style={{
                width: '47%',
                borderWidth: 1,
                borderColor: PAPER.ink,
                backgroundColor: active ? PAPER.tabloid : PAPER.slip,
                padding: 8,
              }}
            >
              <Text style={{ color: active ? PAPER.paper : PAPER.ink, fontWeight: '800', fontSize: 13 }}>{row.name}</Text>
              <Text style={{ color: active ? 'rgba(243,226,168,0.8)' : PAPER.inkSoft, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>{row.kicker}</Text>
              <Text style={{ color: active ? PAPER.paper : PAPER.ink, fontSize: 12, fontWeight: '800', marginTop: 4 }}>{row.count}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
