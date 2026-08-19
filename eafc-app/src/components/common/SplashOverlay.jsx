import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const SPLASH = require('../../../assets/splash.png');

/**
 * Full-screen JS splash. Renders the same asset the native splash uses, so the
 * handoff from the native screen is seamless on iOS, and it fills the whole
 * screen on Android, where Expo's splash always draws the image into a 200dp
 * box on a flat colour and cannot go edge-to-edge (see android.splash in
 * app.json, which feeds Android a small mark instead).
 *
 * The native splash is held open by preventAutoHideAsync() in _layout.jsx and
 * only dismissed once this overlay has actually laid out, so there is never a
 * frame where neither is on screen.
 */
export default function SplashOverlay({ visible, onHidden }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const didHideNative = useRef(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (visible) return undefined;
    const anim = Animated.timing(opacity, {
      toValue: 0,
      duration: 350,
      delay: 120,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (!finished) return;
      setMounted(false);
      onHidden?.();
    });
    return () => anim.stop();
  }, [visible, opacity, onHidden]);

  // Dismiss the native splash only once this overlay has painted, so the two
  // never leave a blank frame between them. Fires once.
  const handleLayout = useCallback(() => {
    if (didHideNative.current) return;
    didHideNative.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!mounted) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      onLayout={handleLayout}
      style={[StyleSheet.absoluteFill, styles.root, { opacity }]}
    >
      <Image source={SPLASH} style={styles.image} resizeMode="cover" fadeDuration={0} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#07153C' },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
});
