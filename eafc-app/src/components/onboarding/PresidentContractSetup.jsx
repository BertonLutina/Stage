import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import STText from '../common/STText';
import { stageClient } from '../../api/stageClient';
import { onboardingStyles as s } from './onboardingStyles';

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
    <View>
      <STText style={s.title}>Sign as president</STText>
      <STText style={s.subtitle}>
        This locks you as the club creator. It is not a player wage deal.
      </STText>

      <View style={{
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,214,10,0.28)',
        backgroundColor: 'rgba(255,214,10,0.08)',
        padding: 20,
        marginBottom: 14,
      }}
      >
        <STText style={{ color: '#FFD60A', fontSize: 13, fontWeight: '800' }}>
          President
        </STText>
        <STText style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 6 }}>{presidentName}</STText>
        <STText style={{ color: 'rgba(255,255,255,0.58)', fontSize: 15, marginTop: 4 }}>
          {club?.name || 'Your club'}
        </STText>
      </View>

      <View style={{
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 20,
        marginBottom: 16,
        gap: 8,
      }}
      >
        <STText style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Terms</STText>
        <STText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>Role · Club President</STText>
        <STText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>Length · 10 years</STText>
        <STText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>Salary · 0 STC / week</STText>
        <STText style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 6, lineHeight: 20 }}>
          Captain is a staff title you assign later. This contract cannot be deleted from the office.
        </STText>
      </View>

      {error ? (
        <STText style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{error}</STText>
      ) : null}

      <TouchableOpacity onPress={handleSign} disabled={signing} style={s.primaryBtn}>
        {signing ? (
          <ActivityIndicator color="#041018" />
        ) : (
          <STText style={s.primaryBtnText}>Sign</STText>
        )}
      </TouchableOpacity>
    </View>
  );
}
