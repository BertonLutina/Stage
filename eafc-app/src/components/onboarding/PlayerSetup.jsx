import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, TextField } from '@/components/ui';
import { COUNTRIES } from '../../lib/countries';
import { savePlayerProfile, buildPlayerPayload } from '../../lib/savePlayerProfile';
import { CONSOLE_OPTIONS, normalizeConsoleChoice } from '../../lib/platformDisplay';
import { FormError, OnboardingSelect, StepHeading } from './OnboardingParts';
import { STEP_GAP } from './onboardingStyles';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'];

export default function PlayerSetup({ onComplete, user, initialPlayer = null, intent = 'player' }) {
  const [gamertag, setGamertag] = useState(initialPlayer?.gamertag || '');
  const [position, setPosition] = useState(initialPlayer?.position || 'ST');
  const [secondaryPosition, setSecondaryPosition] = useState(initialPlayer?.secondary_position || 'none');
  const [platform, setPlatform] = useState(normalizeConsoleChoice(initialPlayer?.platform) || 'PS5');
  const [country, setCountry] = useState(initialPlayer?.country || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const countryOptions = useMemo(
    () => COUNTRIES.map((item) => ({ id: item.name, label: item.name })),
    [],
  );
  const positionOptions = useMemo(
    () => POSITIONS.map((item) => ({ id: item, label: item })),
    [],
  );
  const secondaryOptions = useMemo(
    () => [
      { id: 'none', label: 'None' },
      ...POSITIONS.filter((item) => item !== position).map((item) => ({ id: item, label: item })),
    ],
    [position],
  );
  const consoleOptions = useMemo(
    () => CONSOLE_OPTIONS.map((item) => ({ id: item, label: item })),
    [],
  );

  const handleSave = async () => {
    if (!gamertag.trim() || !country) {
      setError('Gamertag and country are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fields = { user, gamertag, position, secondaryPosition, country, platform };
      const savedPlayer = await savePlayerProfile(fields);
      onComplete?.(savedPlayer || buildPlayerPayload(fields));
    } catch (err) {
      setError(err?.data?.error || err?.data?.message || err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading
        title="Your name on the pitch"
        subtitle="This is how clubs and opponents will find you."
      />

      <TextField
        label="Gamertag"
        value={gamertag}
        onChangeText={setGamertag}
        placeholder="Your in-game name"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <OnboardingSelect
        label="Main position"
        value={position}
        placeholder="Select position"
        title="Main position"
        options={positionOptions}
        onChange={(id) => {
          setPosition(id);
          if (secondaryPosition === id) setSecondaryPosition('none');
        }}
      />

      <OnboardingSelect
        label="Second position"
        value={secondaryPosition}
        placeholder="Select position"
        title="Second position"
        options={secondaryOptions}
        onChange={(id) => setSecondaryPosition(id)}
      />

      <OnboardingSelect
        label="Console"
        value={platform}
        placeholder="Select console"
        title="Console"
        options={consoleOptions}
        onChange={(id) => setPlatform(id)}
      />

      <OnboardingSelect
        label="Country"
        value={country}
        placeholder="Select country"
        title="Country"
        searchPlaceholder="Search…"
        options={countryOptions}
        onChange={(id) => setCountry(id)}
      />

      <FormError>{error}</FormError>

      <Button
        title={intent === 'both' ? 'Next' : 'Continue'}
        onPress={handleSave}
        loading={saving}
      />
    </View>
  );
}
