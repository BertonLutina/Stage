import React from 'react';
import { View, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { openSocialAuth, STAGE_OAUTH_PROVIDERS } from '../../hooks/useSocialAuth';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { BRAND_COLORS as BRAND } from '@/lib/brandColors';
import { BUTTON_HEIGHT, BUTTON_RADIUS } from '@/components/ui/metrics';

const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 48 48">
    <Path fill={BRAND.googleYellow} d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
    <Path fill={BRAND.googleRed} d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <Path fill={BRAND.googleGreen} d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z" />
    <Path fill={BRAND.googleBlue} d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C40.9 36 44 31.5 44 24c0-1.2-.1-2.4-.4-3.5z" />
  </Svg>
);

const OutlookIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Rect x="2" y="4" width="20" height="16" rx="3" fill={BRAND.outlook} />
    <Path
      fill="white"
      d="M12 8.1c-2.25 0-3.95 1.72-3.95 3.9S9.75 15.9 12 15.9s3.95-1.72 3.95-3.9S14.25 8.1 12 8.1zm0 6.2c-1.3 0-2.3-1.02-2.3-2.3s1-2.3 2.3-2.3 2.3 1.02 2.3 2.3-1 2.3-2.3 2.3z"
    />
  </Svg>
);

const KickIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill={BRAND.kick}>
    <Path d="M1.5 0h7.5v6h3V3h3V0h7.5v9h-3v3h3v9H15v-3h-3v-3h-3v6H1.5z" />
  </Svg>
);

const TwitchIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill={BRAND.twitch}>
    <Path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
  </Svg>
);

const PROVIDER_ICONS = {
  google: { icon: <GoogleIcon />, label: 'Continue with Google' },
  microsoft: { icon: <OutlookIcon />, label: 'Continue with Outlook' },
  kick: { icon: <KickIcon />, label: 'Continue with Kick' },
  twitch: { icon: <TwitchIcon />, label: 'Continue with Twitch' },
};

const STAGE_PROVIDERS = STAGE_OAUTH_PROVIDERS.map((key) => ({
  key,
  ...PROVIDER_ICONS[key],
}));

// `mode` is accepted for call-site compatibility; the provider labels already read "Continue with X".
export default function SocialAuthIconButtons({ providers }) {
  const list = providers ?? STAGE_PROVIDERS;
  const router = useRouter();
  const tokens = useThemeStore((st) => st.tokens);

  const onPress = async (provider) => {
    const result = await openSocialAuth(provider);
    if (result?.success) {
      router.replace(result.isNewUser ? '/auth/onboarding' : '/(tabs)/dashboard');
      return;
    }
    if (result?.cancelled) return;
    if (result?.error) {
      Alert.alert('Sign in failed', result.error);
    }
  };

  return (
    <View style={styles.row}>
      {list.map((p) => (
        <TouchableOpacity
          key={p.key}
          onPress={() => onPress(p.key)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={p.label}
          style={[styles.tile, { borderColor: tokens.border }]}
        >
          {p.icon}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    height: BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
});
