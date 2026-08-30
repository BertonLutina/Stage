import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { headingStyle } from '@/lib/fonts';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';

export default function GameDayKickoffActions({ controls, loading, onKickoff }) {
  if (!controls?.showHomeKickoff && !controls?.showAwayWaiting) return null;

  return (
    <View style={{ gap: 8 }}>
      {controls.showHomeKickoff ? (
        <>
          {controls.tooEarly ? (
            <StatusBox icon="time-outline" iconColor="#F8FBFF">
              Kickoff available 15 minutes before match time.
            </StatusBox>
          ) : null}
          <TouchableOpacity
            onPress={onKickoff}
            disabled={loading || !controls.canPressKickoff}
            style={{
              backgroundColor: controls.canPressKickoff ? '#EEF3FB' : '#1F2430',
              borderWidth: 1,
              borderColor: controls.canPressKickoff ? '#EEF3FB' : '#161B24',
              paddingVertical: 16,
              alignItems: 'center',
              opacity: loading ? 0.6 : 1,
              shadowColor: '#EEF3FB',
              shadowOpacity: controls.canPressKickoff ? 0.34 : 0,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            {loading
              ? <ActivityIndicator color="#111827" />
              : (
                <Text style={[headingStyle, {
                  color: controls.canPressKickoff ? '#111827' : 'rgba(255,255,255,0.25)',
                  letterSpacing: 3,
                  fontSize: 18,
                }]}
                >
                  KICK OFF
                </Text>
              )}
          </TouchableOpacity>
        </>
      ) : null}
      {controls.showAwayWaiting ? (
        <StatusBox icon="time-outline" iconColor={CYAN}>
          Waiting for home team to kick off.
        </StatusBox>
      ) : null}
    </View>
  );
}

function StatusBox({ icon, iconColor, children }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      backgroundColor: 'rgba(0,0,0,0.65)',
      paddingHorizontal: 12,
      paddingVertical: 10,
    }}
    >
      <Ionicons name={icon} size={14} color={iconColor} />
      <Text style={{ color: '#fff', fontSize: 12, flex: 1 }}>{children}</Text>
    </View>
  );
}
