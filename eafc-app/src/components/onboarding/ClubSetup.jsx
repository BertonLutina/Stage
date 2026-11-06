import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, TextField } from '@/components/ui';
import { stageClient } from '../../api/stageClient';
import { COUNTRIES } from '../../lib/countries';
import { CONSOLE_OPTIONS, normalizeConsoleChoice } from '../../lib/platformDisplay';
import { FormError, OnboardingSelect, StepHeading, TextLink } from './OnboardingParts';
import { STEP_GAP } from './onboardingStyles';

const REGIONS = ['Europe', 'North America', 'South America', 'Asia', 'Oceania', 'Africa', 'Middle East'];

export default function ClubSetup({
  onComplete,
  onPhaseChange,
  player,
  user,
  playerContract = null,
  required = false,
}) {
  const [phase, setPhase] = useState('president');
  const [displayName, setDisplayName] = useState(player?.gamertag || '');
  const [roleTitle, setRoleTitle] = useState('President');
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [platform, setPlatform] = useState(normalizeConsoleChoice(player?.platform) || 'PS5');
  const [region, setRegion] = useState('Europe');
  const [country, setCountry] = useState(player?.country || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    onPhaseChange?.(phase === 'club' ? 'club' : 'president');
  }, [phase, onPhaseChange]);

  const countryOptions = useMemo(
    () => COUNTRIES.map((item) => ({ id: item.name, label: item.name })),
    [],
  );
  const consoleOptions = useMemo(
    () => CONSOLE_OPTIONS.map((item) => ({ id: item, label: item })),
    [],
  );
  const regionOptions = useMemo(
    () => REGIONS.map((item) => ({ id: item, label: item })),
    [],
  );

  const continuePresident = () => {
    if (!displayName.trim()) {
      setError('President display name is required');
      return;
    }
    setError(null);
    setPhase('club');
  };

  const handleCreate = async () => {
    if (!name.trim() || !tag.trim() || !country) {
      setError('Club name, tag, and country are required');
      return;
    }
    if (!player?.id) {
      setError('Player profile is required before creating a founder club');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const countryCode = COUNTRIES.find((c) => c.name === country)?.code || '';
      const founderState = await stageClient.clubs.createFounder({
        user_id: user?.id,
        player_id: player.id,
        club: {
          name: name.trim(),
          tag: tag.trim().toUpperCase().slice(0, 5),
          platform,
          region,
          country_code: countryCode || country,
          owner_email: user?.email,
          logo_url: null,
          description: '',
          status: 'active',
        },
        playerContract: playerContract || undefined,
        president_profile: {
          display_name: displayName.trim() || player?.gamertag || user?.email || 'President',
          role_title: roleTitle.trim() || 'President',
          country,
          country_code: countryCode,
        },
      });

      if (!founderState?.club?.id) throw new Error('Server returned no club ID');

      onComplete?.(founderState);
    } catch (err) {
      setError(err?.message || err?.data?.message || 'Failed to create club');
    } finally {
      setSaving(false);
    }
  };

  if (phase === 'president') {
    return (
      <View style={{ gap: STEP_GAP }}>
        <StepHeading
          title="How should they call you?"
          subtitle="This is your public name as club president."
        />

        <TextField
          label="Display name *"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="President name"
        />

        <TextField
          label="Role title"
          value={roleTitle}
          onChangeText={setRoleTitle}
          placeholder="President"
        />

        <FormError>{error}</FormError>

        <Button title="Next" onPress={continuePresident} />
        {!required ? (
          <TextLink title="Skip for now" onPress={() => onComplete?.(null)} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading
        title="Name the club"
        subtitle="This is the club you will own and play for."
      />

      <TextField
        label="Club name *"
        value={name}
        onChangeText={setName}
        placeholder="Club name"
      />

      <TextField
        label="Tag * (max 5)"
        value={tag}
        onChangeText={(v) => setTag(v.toUpperCase().slice(0, 5))}
        placeholder="CLB"
        autoCapitalize="characters"
        maxLength={5}
      />

      <OnboardingSelect
        label="Platform"
        value={platform}
        placeholder="Select platform"
        title="Platform"
        options={consoleOptions}
        onChange={(id) => setPlatform(id)}
      />

      <OnboardingSelect
        label="Region"
        value={region}
        placeholder="Select region"
        title="Region"
        options={regionOptions}
        onChange={(id) => setRegion(id)}
      />

      <OnboardingSelect
        label="Country *"
        value={country}
        placeholder="Select country"
        title="Country"
        searchPlaceholder="Search…"
        options={countryOptions}
        onChange={(id) => setCountry(id)}
      />

      <FormError>{error}</FormError>

      <Button title="Create club" onPress={handleCreate} loading={saving} />
      <TextLink title="Back" onPress={() => setPhase('president')} />
    </View>
  );
}
