import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/store/themeStore';
import LiveDarkWallpaper from '@/components/theme/LiveDarkWallpaper';
import AuthWallpaper from '@/components/theme/AuthWallpaper';
import StageBackground from './StageBackground';
import { pageBottomPad } from '@/lib/pageInsets';
import { SCREEN_GUTTER, guideFabClearance, guideFabClearanceStack } from './metrics';

/**
 * Stage page shell: flat `bg` (transparent + wallpaper in Live Dark), top safe area,
 * 20px gutters and room for the floating tab bar. The wallpaper is rendered here
 * because native stack screens hide ancestor backdrops.
 *
 * `authBackdrop` — Welcome / Sign in / Sign up: uses the auth-only wallpaper system
 * (photo + blur + blue overlay), independent of Live Dark.
 *
 * `guideFab` (stack screens only) reserves room for the global Guide button.
 *
 * `refreshControl` is passed to the scroll view (pull to refresh); changing `scrollKey`
 * remounts the scroll view, which resets its scroll position.
 */
export default function Screen({
  children,
  scroll = true,
  keyboardAvoiding = false,
  tabBar = true,
  guideFab = false,
  authBackdrop = false,
  refreshControl,
  scrollKey,
  style,
  testID,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const live = tokens.live === true;
  const authBgActive = useThemeStore((s) => s.authBgActive);

  // Tab screens also clear the global Guide button that floats above the tab bar.
  // Stack screens (tabBar=false) that show the Guide button clear it too, without the tab bar offset.
  let bottom = pageBottomPad(insets.bottom);
  if (tabBar) bottom = guideFabClearance(insets.bottom);
  else if (guideFab) bottom = guideFabClearanceStack(insets.bottom);

  const contentStyle = [
    {
      paddingTop: insets.top + 12,
      paddingBottom: bottom,
      paddingHorizontal: SCREEN_GUTTER,
    },
    scroll ? { flexGrow: 1 } : { flex: 1 },
    style,
  ];

  const inner = scroll ? (
    <ScrollView
      key={scrollKey}
      testID="screen-scroll"
      refreshControl={refreshControl}
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View testID="screen-content" style={contentStyle}>
        {children}
      </View>
    </ScrollView>
  ) : (
    <View testID="screen-content" style={contentStyle}>
      {children}
    </View>
  );

  const transparentShell = authBackdrop
    ? Boolean(authBgActive)
    : live;

  let backdrop = <StageBackground />;
  if (authBackdrop) backdrop = <AuthWallpaper />;
  else if (live) backdrop = <LiveDarkWallpaper />;

  return (
    <View
      testID={testID}
      style={{ flex: 1, backgroundColor: transparentShell ? 'transparent' : tokens.bg }}
    >
      {backdrop}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={{ flex: 1, zIndex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {inner}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, zIndex: 1 }}>{inner}</View>
      )}
    </View>
  );
}
