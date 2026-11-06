import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { hexToRgba } from '@/lib/stageTheme';
import { Button } from '@/components/ui';

export default function GameDayKickoffActions({ controls, loading, onKickoff }) {
  const tokens = useThemeStore((s) => s.tokens);
  if (!controls?.showHomeKickoff && !controls?.showAwayWaiting) return null;

  return (
    <View style={{ gap: 8 }}>
      {controls.showHomeKickoff ? (
        <>
          {controls.tooEarly ? (
            <StatusBox icon="time-outline" iconColor={tokens.textSoft}>
              Kickoff available 15 minutes before match time.
            </StatusBox>
          ) : null}
          <Button
            title="KICK OFF"
            onPress={onKickoff}
            loading={Boolean(loading)}
            disabled={loading || !controls.canPressKickoff}
          />
        </>
      ) : null}
      {controls.showAwayWaiting ? (
        <StatusBox icon="time-outline" iconColor={tokens.cyan}>
          Waiting for home team to kick off.
        </StatusBox>
      ) : null}
    </View>
  );
}

function StatusBox({ icon, iconColor, children }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 12,
      backgroundColor: tokens.live ? hexToRgba(tokens.bgDeep, 0.65) : tokens.bgDeep,
      paddingHorizontal: 12,
      paddingVertical: 10,
    }}
    >
      <Ionicons name={icon} size={16} color={iconColor} />
      <Text style={{ color: tokens.text, fontSize: 13, flex: 1 }}>{children}</Text>
    </View>
  );
}
