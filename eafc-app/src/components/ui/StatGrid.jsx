import React from 'react';
import { View, Text } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';

/** Rows of `columns` equal-width stat cells. A short last row keeps the column width. */
export default function StatGrid({ items = [], columns = 3 }) {
  const tokens = useThemeStore((s) => s.tokens);
  const cols = Math.max(1, columns);

  const rows = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));

  return (
    <View style={{ gap: 14 }}>
      {rows.map((row, r) => (
        <View key={r} testID={`stat-row-${r}`} style={{ flexDirection: 'row', gap: 12 }}>
          {Array.from({ length: cols }, (_, c) => {
            const item = row[c];
            return (
              <View key={c} testID={item ? `stat-cell-${r}-${c}` : undefined} style={{ flex: 1, minWidth: 0 }}>
                {item ? (
                  <>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        color: tokens.text,
                        fontFamily: FONT_EA_SPORTS,
                        fontSize: 22,
                        textTransform: 'uppercase',
                        letterSpacing: 22 * 0.03,
                      }}
                    >
                      {item.value}
                    </Text>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        color: tokens.muted,
                        fontSize: 11,
                        fontWeight: '600',
                        letterSpacing: 11 * 0.12,
                        textTransform: 'uppercase',
                        marginTop: 2,
                      }}
                    >
                      {item.label}
                    </Text>
                  </>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
