import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const TOAST_DURATION = 2800;

export default function Toast({ visible, message, onHide }) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible || !message) return undefined;
    opacity.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(TOAST_DURATION - 400),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => {
      if (finished) onHide?.();
    });
    return () => animation.stop();
  }, [visible, message, opacity, onHide]);

  if (!visible || !message) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      <View style={styles.box}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  box: {
    backgroundColor: 'rgba(95, 227, 232, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    maxWidth: '100%',
  },
  text: {
    color: '#0F0F0F',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
