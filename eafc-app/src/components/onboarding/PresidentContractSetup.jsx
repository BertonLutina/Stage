import React, { useState } from 'react';
import { View, Text } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { Button, Card } from '@/components/ui';
import { headingStyle } from '@/lib/fonts';
import { stageClient } from '../../api/stageClient';
import { FormError, StepHeading } from './OnboardingParts';
import { STEP_GAP, useOnboardingStyles } from './onboardingStyles';

function resolvePresidentContract(founderState) {
  if (!founderState || typeof founderState !== 'object') return null;
  const type = String(founderState.presidentContract?.contract_type || '').toLowerCase();
  if (type === 'ownership') return founderState.presidentContract;
  const fromList = Array.isArray(founderState.contracts)
    ? founderState.contracts.find((contract) => String(contract?.contract_type || '').toLowerCase() === 'ownership')
    : null;
  return fromList || null;
}

export default function PresidentContractSetup({
  club,
  player,
  user,
  founderState,
  playerContract = null,
  onComplete,
}) {
  const tokens = useThemeStore((st) => st.tokens);
  const s = useOnboardingStyles();
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState(null);
  const presidentName = player?.gamertag || user?.email || 'President';

  const ensurePresidentContract = async () => {
    const existing = resolvePresidentContract(founderState);
    if (existing?.id) return existing;
    if (!player?.id || !club?.name) return null;
    const refreshed = await stageClient.clubs.createFounder({
      player_id: player.id,
      idempotency_key: `${user?.id || user?.email || 'user'}:${player.id}:${String(club.name).trim().toLowerCase()}`,
      club: {
        name: club.name,
        tag: club.tag,
        platform: club.platform,
        region: club.region,
        country_code: club.country_code,
        owner_email: user?.email || club.owner_email,
        logo_url: club.logo_url || null,
      },
      playerContract: playerContract || undefined,
    });
    return resolvePresidentContract(refreshed);
  };

  const handleSign = async () => {
    setSigning(true);
    setError(null);
    try {
      const contract = await ensurePresidentContract();
      const status = String(contract?.status || '').toLowerCase();
      if (contract?.id && (status === 'pending' || status === 'negotiating' || status === 'pending_window')) {
        await stageClient.functions.invoke('contractManagement', {
          action: 'accept',
          contract_id: contract.id,
        });
      }
      onComplete?.();
    } catch (err) {
      setError(err?.message || 'Could not confirm the president contract.');
      setSigning(false);
    }
  };

  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading
        title="Sign as president"
        subtitle="This locks you as the club creator. It is not a player wage deal."
      />

      <Card highlight style={{ gap: 4 }}>
        <Text style={{ color: tokens.warning, fontSize: 13, fontWeight: '700' }}>
          President
        </Text>
        <Text
          numberOfLines={1}
          style={[headingStyle, { color: tokens.text, fontSize: 24, letterSpacing: 24 * 0.03, marginTop: 2 }]}
        >
          {presidentName}
        </Text>
        <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 15 }}>
          {club?.name || 'Your club'}
        </Text>
      </Card>

      <Card style={{ gap: 8 }}>
        <Text style={s.cardTitle}>Terms</Text>
        <Text style={{ color: tokens.textSoft, fontSize: 15 }}>Role · Club President</Text>
        <Text style={{ color: tokens.textSoft, fontSize: 15 }}>Length · 10 years</Text>
        <Text style={{ color: tokens.textSoft, fontSize: 15 }}>Salary · 0 STC / week</Text>
        <Text style={[s.hint, { marginTop: 6, fontSize: 14, lineHeight: 20 }]}>
          Captain is a staff title you assign later. This contract cannot be deleted from the office.
        </Text>
      </Card>

      <FormError>{error}</FormError>

      <Button title="Sign" onPress={handleSign} loading={signing} />
    </View>
  );
}
