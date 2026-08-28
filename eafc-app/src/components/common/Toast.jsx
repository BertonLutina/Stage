import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useToastStore from '../../store/toastStore';
import { useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { CARD_RADIUS } from '@/lib/stageTheme';
import { headingStyleSm } from '@/lib/fonts';
import { splitToastCopy } from '@/lib/matchNotificationToasts';

const TOAST_DURATION = 3200;

function ToastBanner({ message, top, onHide }) {
  const tokens = useGamerTokens();
  const opacity = useRef(new Animated.Value(0)).current;
  const { title, body } = splitToastCopy(message);

  useEffect(() => {
    if (!message) return undefined;
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
  }, [message, opacity, onHide]);

  return (
    <Animated.View
      testID="stage-toast"
      pointerEvents="none"
      style={[styles.banner, { top, opacity }]}
    >
      <View
        style={[
          styles.box,
          {
            backgroundColor: tokens.cardSolid,
            borderColor: tokens.cyanBorder,
            shadowColor: tokens.cyan,
          },
        ]}
      >
        <View style={[styles.accent, { backgroundColor: tokens.cyan }]} />
        <View style={[styles.iconWrap, { backgroundColor: tokens.tileFill, borderColor: tokens.cyanBorder }]}>
          <Ionicons name="notifications" size={16} color={tokens.cyan} />
        </View>
        <View style={styles.copy}>
          <Text style={[headingStyleSm, styles.kicker, { color: tokens.amber }]}>STAGE</Text>
          <Text style={[styles.title, { color: tokens.text }]} numberOfLines={2}>
            {title || message}
          </Text>
          {body ? (
            <Text style={[styles.body, { color: tokens.muted }]} numberOfLines={3}>
              {body}
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

function ToastLayer({ children }) {
  if (Platform.OS === 'ios') {
    return <FullWindowOverlay>{children}</FullWindowOverlay>;
  }

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated
    >
      {children}
    </Modal>
  );
}

export default function Toast() {
  const visible = useToastStore((s) => s.visible);
  const message = useToastStore((s) => s.message);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();

  if (!visible || !message) return null;

  return (
    <ToastLayer>
      <View pointerEvents="box-none" style={styles.layer} testID="stage-toast-layer">
        <ToastBanner
          message={message}
          top={Math.max(insets.top, 12) + 8}
          onHide={hide}
        />
      </View>
    </ToastLayer>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
  },
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: CARD_RADIUS,
    paddingVertical: 12,
    paddingRight: 14,
    paddingLeft: 10,
    maxWidth: '100%',
    elevation: 24,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
    minHeight: 44,
    borderRadius: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
});
