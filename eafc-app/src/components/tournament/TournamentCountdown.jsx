import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import STText from '../common/STText';
import useThemeStore from '@/store/themeStore';

export default function TournamentCountdown({ startDate, compact = false }) {
  const tokens = useThemeStore((s) => s.tokens);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!startDate) return undefined;
    const calc = () => {
      const diff = new Date(startDate) - new Date();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  if (!startDate || !timeLeft) return null;

  const parts = [
    { v: timeLeft.days, label: 'd' },
    { v: timeLeft.hours, label: 'h' },
    { v: timeLeft.mins, label: 'm' },
    { v: timeLeft.secs, label: 's' },
  ];

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        { backgroundColor: tokens.bgDeep, borderColor: tokens.border },
      ]}
    >
      <STText style={[styles.label, { color: tokens.muted }]}>Starts in</STText>
      <View style={styles.row}>
        {parts.map(({ v, label }) => (
          <View key={label} style={styles.unit}>
            <STText style={styles.value}>{String(v).padStart(2, '0')}</STText>
            <STText style={[styles.unitLabel, { color: tokens.muted }]}>{label}</STText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  wrapCompact: {
    marginTop: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 11 * 0.12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  unit: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unitLabel: {
    fontSize: 11,
  },
});
