import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import STText from '../common/STText';
import { stageClient } from '../../api/stageClient';
import { COUNTRIES } from '../../lib/countries';
import { onboardingStyles as s } from './onboardingStyles';

const REGIONS = ['Europe', 'North America', 'South America', 'Asia', 'Oceania', 'Africa', 'Middle East'];
const PLATFORMS = ['PlayStation', 'Xbox', 'PC'];

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
  const [platform, setPlatform] = useState(player?.platform || 'PlayStation');
  const [region, setRegion] = useState('Europe');
  const [country, setCountry] = useState(player?.country || '');
  const [countryPicker, setCountryPicker] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    onPhaseChange?.(phase === 'club' ? 'club' : 'president');
  }, [phase, onPhaseChange]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES.slice(0, 80);
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 80);
  }, [countryQuery]);

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
        <STText style={s.title}>President profile</STText>
        <STText style={s.subtitle}>This is your public club-leader identity on STAGE.</STText>

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
          <STText style={s.primaryBtnText}>Continue to club</STText>
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
      <STText style={s.title}>Club profile</STText>
      <STText style={s.subtitle}>Create the club you will manage as president.</STText>

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
        {PLATFORMS.map((p) => (
          <TouchableOpacity key={p} onPress={() => setPlatform(p)} style={[s.chip, platform === p && s.chipActive]}>
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

      <STText style={s.label}>Country *</STText>
      <TouchableOpacity onPress={() => setCountryPicker(true)} style={[s.input, { justifyContent: 'center' }]}>
        <STText style={{ color: country ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 14 }}>
          {country || 'Select country'}
        </STText>
      </TouchableOpacity>

      {error ? <STText style={s.error}>{error}</STText> : null}

      <TouchableOpacity onPress={handleCreate} disabled={saving} style={[s.primaryBtn, saving && { opacity: 0.55 }]}>
        {saving ? <ActivityIndicator color="#0d2461" /> : <STText style={s.primaryBtnText}>Create club</STText>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setPhase('president')} style={s.ghostBtn}>
        <STText style={s.ghostBtnText}>← Back</STText>
      </TouchableOpacity>

      <Modal visible={countryPicker} animationType="slide" transparent>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={() => setCountryPicker(false)} />
        <View style={{ maxHeight: '70%', backgroundColor: '#09111f', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 }}>
          <STText style={[s.title, { fontSize: 16 }]}>Country</STText>
          <TextInput
            value={countryQuery}
            onChangeText={setCountryQuery}
            placeholder="Search…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={s.input}
            autoFocus
          />
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setCountry(item.name);
                  setCountryPicker(false);
                  setCountryQuery('');
                }}
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}
              >
                <STText style={{ color: '#fff', fontSize: 14 }}>{item.name}</STText>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
