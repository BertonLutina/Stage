import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/store/themeStore';
import { TAB_BAR_BOTTOM, TAB_BAR_HEIGHT, ICON_SIZE } from './metrics';

const SIDE_MARGIN = 16;
const BAR_RADIUS = 22;
const PILL_SIZE = 48;
const PILL_RADIUS = 14;

/** Idle (outline) and focused (filled) Ionicons per route. */
const ICONS = {
  dashboard: { idle: 'home-outline', focused: 'home' },
  matches: { idle: 'football-outline', focused: 'football' },
  tournaments: { idle: 'trophy-outline', focused: 'trophy' },
  profile: { idle: 'person-outline', focused: 'person' },
  search: { idle: 'search-outline', focused: 'search' },
};
const FALLBACK_ICON = { idle: 'ellipse-outline', focused: 'ellipse' };

const SHOW_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE_EVENT = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(SHOW_EVENT, () => setOpen(true));
    const hide = Keyboard.addListener(HIDE_EVENT, () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}

/**
 * Stage floating tab bar: 5 icon-only tabs, 16px from the sides, `max(inset, 24)` from the bottom.
 * Live Dark blurs the wallpaper behind it; otherwise it is solid `bgDeep` with a `border`.
 * A custom `tabBar` bypasses react-navigation's own keyboard handling, so
 * `tabBarHideOnKeyboard` is honoured here.
 */
export default function FloatingTabBar({ state, descriptors, navigation }) {
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();
  const live = tokens.live === true;
  const tabBottom = Math.max(insets.bottom, TAB_BAR_BOTTOM);

  const focusedKey = state.routes[state.index]?.key;
  const hideOnKeyboard = descriptors[focusedKey]?.options?.tabBarHideOnKeyboard === true;
  if (hideOnKeyboard && keyboardOpen) return null;

  return (
    <View
      testID="floating-tab-bar"
      style={{
        position: 'absolute',
        left: SIDE_MARGIN,
        right: SIDE_MARGIN,
        bottom: tabBottom,
        height: TAB_BAR_HEIGHT,
        borderRadius: BAR_RADIUS,
        borderWidth: 1,
        borderColor: tokens.border,
        backgroundColor: live ? tokens.overlay : tokens.bgDeep,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {live ? (
        <BlurView intensity={36} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      {state.routes.map((route, index) => {
        const options = descriptors[route.key]?.options || {};
        // expo-router hides a tab with `href: null` (kept for older navigators) or `tabBarItemStyle: { display: 'none' }`.
        if (options.href === null) return null;
        if (StyleSheet.flatten(options.tabBarItemStyle)?.display === 'none') return null;
        const focused = state.index === index;
        const label = options.title || route.name;
        const icons = ICONS[route.name] || FALLBACK_ICON;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <View
              testID={`tab-pill-${route.name}`}
              style={{
                width: PILL_SIZE,
                height: PILL_SIZE,
                borderRadius: PILL_RADIUS,
                alignItems: 'center',
                justifyContent: 'center',
                ...(focused ? { backgroundColor: tokens.card } : null),
              }}
            >
              <Ionicons
                name={focused ? icons.focused : icons.idle}
                size={ICON_SIZE}
                color={focused ? tokens.cyan : tokens.muted}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
