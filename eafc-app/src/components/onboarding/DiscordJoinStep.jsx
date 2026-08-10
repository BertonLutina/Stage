import React from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import STText from '../common/STText';
import { DISCORD_INVITE_URL } from '../../lib/discordConfig';
import { onboardingStyles as s } from './onboardingStyles';

export default function DiscordJoinStep({ onSkip, onContinue }) {
  const openDiscord = async () => {
    try {
      if (DISCORD_INVITE_URL) await Linking.openURL(DISCORD_INVITE_URL);
    } catch {
      /* ignore */
    }
  };

  return (
    <View>
      <STText style={s.title}>Join the community</STText>
      <STText style={s.subtitle}>
        Discord is where players find clubs and get league news. Join now or later from Community.
      </STText>

      <TouchableOpacity
        onPress={openDiscord}
        style={[s.primaryBtn, { backgroundColor: '#5865F2' }]}
      >
        <STText style={[s.primaryBtnText, { color: '#FFFFFF' }]}>Join Discord</STText>
      </TouchableOpacity>

      <TouchableOpacity onPress={onContinue} style={s.primaryBtn}>
        <STText style={s.primaryBtnText}>Continue to STAGE</STText>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSkip} style={s.ghostBtn}>
        <STText style={s.ghostBtnText}>Skip for now</STText>
      </TouchableOpacity>
    </View>
  );
}
