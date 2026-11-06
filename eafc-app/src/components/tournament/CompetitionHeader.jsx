import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { IconButton } from '@/components/ui';
import { headingStyleLg } from '@/lib/fonts';
import { goBackInPlace } from '@/lib/navigationBack';

/**
 * Stage header for the competition views: back button, muted eyebrow (competition
 * name) centred beside it, then the 34px display title. Back pops one screen and
 * stays on the current tab when there is no history.
 */
export default function CompetitionHeader({ eyebrow, title, onBack, testID }) {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);

  return (
    <View testID={testID} style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <IconButton
          icon="chevron-back"
          accessibilityLabel="Back"
          onPress={onBack || (() => goBackInPlace(router))}
        />
        {eyebrow ? (
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              textAlign: 'center',
              color: tokens.muted,
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 11 * 0.12,
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </Text>
        ) : <View style={{ flex: 1 }} />}
        <View style={{ width: 44 }} />
      </View>
      {title ? (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={[headingStyleLg, { color: tokens.text, fontSize: 34, letterSpacing: 34 * 0.03 }]}
        >
          {title}
        </Text>
      ) : null}
    </View>
  );
}
