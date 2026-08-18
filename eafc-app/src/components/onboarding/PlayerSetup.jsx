import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import STText from '../common/STText';
import { stageClient } from '../../api/stageClient';
import { COUNTRIES } from '../../lib/countries';
import { SettingsListbox } from '../settings/SettingsListbox';
import { onboardingStyles as s } from './onboardingStyles';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'];

export default function PlayerSetup({ onComplete, user, initialPlayer = null, intent = 'player' }) {
  const [gamertag, setGamertag] = useState(initialPlayer?.gamertag || '');
  const [position, setPosition] = useState(initialPlayer?.position || 'ST');
  const [secondaryPosition, setSecondaryPosition] = useState(initialPlayer?.secondary_position || 'none');
  const [country, setCountry] = useState(initialPlayer?.country || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const countryOptions = useMemo(
    () => COUNTRIES.map((item) => ({ id: item.name, label: item.name })),
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
      const foundCountry = COUNTRIES.find((c) => c.name === country);
      const payload = {
        user_id: user.id,
        gamertag: gamertag.trim(),
        email: user.email,
        position,
        secondary_position: secondaryPosition === 'none' ? null : secondaryPosition,
        country,
        country_code: foundCountry?.code || '',
        platform: 'PlayStation',
        credits: 50,
        stc: 50000,
      };

      let existing = [];
      if (user.player_id) {
        const p = await stageClient.entities.Player.get(user.player_id).catch(() => null);
        existing = p ? [p] : [];
      } else {
        existing = await stageClient.entities.Player.filter({ email: user.email }, null, 1).catch(() => []);
      }

      let savedPlayer = null;
      if (existing?.length) {
        savedPlayer = await stageClient.entities.Player.update(existing[0].id, payload);
      } else {
        savedPlayer = await stageClient.entities.Player.create(payload);
      }

      onComplete?.(savedPlayer || { ...payload, id: existing?.[0]?.id || null });
    } catch (err) {
      setError(err?.data?.error || err?.data?.message || err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <STText style={s.title}>Your name on the pitch</STText>
      <STText style={s.subtitle}>This is how clubs and opponents will find you.</STText>

      <STText style={s.label}>Gamertag</STText>
      <TextInput
        value={gamertag}
        onChangeText={setGamertag}
        placeholder="Your in-game name"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={s.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <STText style={s.label}>Main position</STText>
      <View style={s.tileGrid}>
        {POSITIONS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => {
              setPosition(p);
              if (secondaryPosition === p) setSecondaryPosition('none');
            }}
            style={[s.tile, position === p && s.chipActive]}
          >
            <STText style={[s.chipText, position === p && s.chipTextActive]}>{p}</STText>
          </TouchableOpacity>
        ))}
      </View>

      <STText style={s.label}>Second position</STText>
      <View style={s.tileGrid}>
        <TouchableOpacity
          onPress={() => setSecondaryPosition('none')}
          style={[s.tile, { width: '31%' }, secondaryPosition === 'none' && s.chipActive]}
        >
          <STText style={[s.chipText, secondaryPosition === 'none' && s.chipTextActive]}>None</STText>
        </TouchableOpacity>
        {POSITIONS.filter((p) => p !== position).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setSecondaryPosition(p)}
            style={[s.tile, secondaryPosition === p && s.chipActive]}
          >
            <STText style={[s.chipText, secondaryPosition === p && s.chipTextActive]}>{p}</STText>
          </TouchableOpacity>
        ))}
      </View>

      <SettingsListbox
        label="Country"
        value={country}
        placeholder="Select country"
        title="Country"
        searchPlaceholder="Search…"
        options={countryOptions}
        onChange={(id) => setCountry(id)}
      />

      {error ? <STText style={s.error}>{error}</STText> : null}

      <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.primaryBtn, saving && { opacity: 0.55 }]}>
        {saving ? (
          <ActivityIndicator color="#041018" />
        ) : (
          <STText style={s.primaryBtnText}>
            {intent === 'both' ? 'Next' : 'Continue'}
          </STText>
        )}
      </TouchableOpacity>
    </View>
  );
}
