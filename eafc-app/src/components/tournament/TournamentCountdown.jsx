import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import STText from '../common/STText';

export default function TournamentCountdown({ startDate, compact = false }) {
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
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <STText style={styles.label}>Starts in</STText>
      <View style={styles.row}>
        {parts.map(({ v, label }) => (
          <View key={label} style={styles.unit}>
            <STText style={styles.value}>{String(v).padStart(2, '0')}</STText>
            <STText style={styles.unitLabel}>{label}</STText>
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
    borderRadius: 10,
    backgroundColor: 'rgba(95,227,232,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(95,227,232,0.22)',
  },
  wrapCompact: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  label: {
    color: '#5FE3E8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  unitLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
  },
});
