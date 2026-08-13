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
      <STText style={s.title}>Club President Contract</STText>
      <STText style={s.subtitle}>
        Sign this to confirm you as club creator and president.
      </STText>

      <View style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.35)',
        backgroundColor: 'rgba(59,130,246,0.12)',
        padding: 16,
        marginBottom: 12,
      }}
      >
        <STText style={{ color: 'rgba(147,197,253,0.9)', fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>
          PRESIDENT
        </STText>
        <STText style={{ color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 4 }}>{presidentName}</STText>
        <STText style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 }}>
          {club?.name || 'Your club'}
        </STText>
      </View>

      <View style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 16,
        marginBottom: 12,
        gap: 6,
      }}
      >
        <STText style={{ color: '#fff', fontWeight: '800', marginBottom: 4 }}>Contract terms</STText>
        <STText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Role: Club President</STText>
        <STText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Duration: 10 years</STText>
        <STText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Salary: 0 STC/week</STText>
        <STText style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6, lineHeight: 18 }}>
          Captaincy remains a separate staff title that must be assigned later. Founder and president contracts cannot be deleted.
        </STText>
      </View>

      {error ? (
        <STText style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{error}</STText>
      ) : null}

      <TouchableOpacity onPress={handleSign} disabled={signing} style={s.primaryBtn}>
        {signing ? (
          <ActivityIndicator color="#0d2461" />
        ) : (
          <STText style={s.primaryBtnText}>Sign President Contract</STText>
        )}
      </TouchableOpacity>
    </View>
  );
}
