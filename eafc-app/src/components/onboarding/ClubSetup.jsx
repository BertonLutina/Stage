import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import STText from '../common/STText';
import { stageClient } from '../../api/stageClient';
import { COUNTRIES } from '../../lib/countries';
import { CONSOLE_OPTIONS, normalizeConsoleChoice } from '../../lib/platformDisplay';
import { SettingsListbox } from '../settings/SettingsListbox';
import { onboardingStyles as s } from './onboardingStyles';

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
      <View>
        <STText style={s.title}>How should they call you?</STText>
        <STText style={s.subtitle}>This is your public name as club president.</STText>

        <STText style={s.label}>Display name *</STText>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="President name"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={s.input}
        />

        <STText style={s.label}>Role title</STText>
        <TextInput
          value={roleTitle}
          onChangeText={setRoleTitle}
          placeholder="President"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={s.input}
        />

        {error ? <STText style={s.error}>{error}</STText> : null}

        <TouchableOpacity onPress={continuePresident} style={s.primaryBtn}>
          <STText style={s.primaryBtnText}>Next</STText>
        </TouchableOpacity>
        {!required ? (
          <TouchableOpacity onPress={() => onComplete?.(null)} style={s.ghostBtn}>
            <STText style={s.ghostBtnText}>Skip for now</STText>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <STText style={s.title}>Name the club</STText>
      <STText style={s.subtitle}>This is the club you will own and play for.</STText>

      <STText style={s.label}>Club name *</STText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Club name"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={s.input}
      />

      <STText style={s.label}>Tag * (max 5)</STText>
      <TextInput
        value={tag}
        onChangeText={(v) => setTag(v.toUpperCase().slice(0, 5))}
        placeholder="CLB"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={s.input}
        autoCapitalize="characters"
        maxLength={5}
      />

      <STText style={s.label}>Platform</STText>
      <View style={s.chipRow}>
        {CONSOLE_OPTIONS.map((p) => (
          <TouchableOpacity key={p} onPress={() => setPlatform(p)} style={[s.tileWide, platform === p && s.chipActive]}>
            <STText style={[s.chipText, platform === p && s.chipTextActive]}>{p}</STText>
          </TouchableOpacity>
        ))}
      </View>

      <STText style={s.label}>Region</STText>
      <View style={s.chipRow}>
        {REGIONS.map((r) => (
          <TouchableOpacity key={r} onPress={() => setRegion(r)} style={[s.chip, region === r && s.chipActive]}>
            <STText style={[s.chipText, region === r && s.chipTextActive]}>{r}</STText>
          </TouchableOpacity>
        ))}
      </View>

      <SettingsListbox
        label="Country *"
        value={country}
        placeholder="Select country"
        title="Country"
        searchPlaceholder="Search…"
        options={countryOptions}
        onChange={(id) => setCountry(id)}
      />

      {error ? <STText style={s.error}>{error}</STText> : null}

      <TouchableOpacity onPress={handleCreate} disabled={saving} style={[s.primaryBtn, saving && { opacity: 0.55 }]}>
        {saving ? <ActivityIndicator color="#041018" /> : <STText style={s.primaryBtnText}>Create club</STText>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setPhase('president')} style={s.ghostBtn}>
        <STText style={s.ghostBtnText}>Back</STText>
      </TouchableOpacity>
    </View>
  );
}
