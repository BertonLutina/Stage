import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { IconButton } from '@/components/ui';
import { headingStyle } from '@/lib/fonts';

/** Login / signup top block: back button, 40px display title, 15px muted subtitle. */
export default function AuthHeader({ title, subtitle }) {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);

  return (
    <View style={{ gap: 20 }}>
      <View style={{ alignItems: 'flex-start' }}>
        <IconButton
          icon="chevron-back"
          accessibilityLabel="Back"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/auth/welcome');
          }}
        />
      </View>
      <View style={{ gap: 8, marginTop: 4 }}>
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          style={[
            headingStyle,
            { color: tokens.text, fontSize: 40, lineHeight: 44, letterSpacing: 1.2 },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: tokens.muted, fontSize: 15 }}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

/** Hairline - label - hairline divider ("or continue with"). */
export function AuthDivider({ label }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: tokens.border }} />
      <Text style={{ color: tokens.muted, fontSize: 12 }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: tokens.border }} />
    </View>
  );
}
