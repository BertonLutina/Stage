import React from 'react';
import { View, Linking } from 'react-native';
import { Button } from '@/components/ui';
import { DISCORD_INVITE_URL } from '../../lib/discordConfig';
import { StepHeading, TextLink } from './OnboardingParts';
import { STEP_GAP } from './onboardingStyles';

export default function DiscordJoinStep({ onSkip, onContinue }) {
  const openDiscord = async () => {
    try {
      if (DISCORD_INVITE_URL) await Linking.openURL(DISCORD_INVITE_URL);
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading
        title="Find your people"
        subtitle="Discord is where clubs recruit and leagues drop news. You can join later from Community."
      />

      <Button title="Join Discord" variant="secondary" icon="logo-discord" onPress={openDiscord} />
      <Button title="Continue to STAGE" onPress={onContinue} />
      <TextLink title="Skip for now" onPress={onSkip} />
    </View>
  );
}
