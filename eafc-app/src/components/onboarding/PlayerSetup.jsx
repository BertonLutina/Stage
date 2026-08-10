import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import STText from '../common/STText';
import { stageClient } from '../../api/stageClient';
import { COUNTRIES } from '../../lib/countries';
import { onboardingStyles as s } from './onboardingStyles';

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'];

export default function PlayerSetup({ onComplete, user, initialPlayer = null, intent = 'player' }) {
  const [gamertag, setGamertag] = useState(initialPlayer?.gamertag || '');
  const [position, setPosition] = useState(initialPlayer?.position || 'ST');
  const [secondaryPosition, setSecondaryPosition] = useState(initialPlayer?.secondary_position || 'none');
  const [country, setCountry] = useState(initialPlayer?.country || '');
  const [countryPicker, setCountryPicker] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES.slice(0, 80);
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 80);
  }, [countryQuery]);

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
      <STText style={s.title}>Create your profile</STText>
      <STText style={s.subtitle}>Tell the STAGE world who you are on the pitch.</STText>

      <STText style={s.label}>Gamertag *</STText>
      <TextInput
        value={gamertag}
        onChangeText={setGamertag}
        placeholder="Your in-game name"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={s.input}
        autoCapitalize="none"
      />

      <STText style={s.label}>Main position *</STText>
      <View style={s.chipRow}>
        {POSITIONS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => {
              setPosition(p);
              if (secondaryPosition === p) setSecondaryPosition('none');
            }}
            style={[s.chip, position === p && s.chipActive]}
          >
            <STText style={[s.chipText, position === p && s.chipTextActive]}>{p}</STText>
          </TouchableOpacity>
        ))}
      </View>

      <STText style={s.label}>Secondary position</STText>
      <View style={s.chipRow}>
        <TouchableOpacity
          onPress={() => setSecondaryPosition('none')}
          style={[s.chip, secondaryPosition === 'none' && s.chipActive]}
        >
          <STText style={[s.chipText, secondaryPosition === 'none' && s.chipTextActive]}>None</STText>
        </TouchableOpacity>
        {POSITIONS.filter((p) => p !== position).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setSecondaryPosition(p)}
            style={[s.chip, secondaryPosition === p && s.chipActive]}
          >
            <STText style={[s.chipText, secondaryPosition === p && s.chipTextActive]}>{p}</STText>
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

      <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.primaryBtn, saving && { opacity: 0.55 }]}>
        {saving ? (
          <ActivityIndicator color="#0d2461" />
        ) : (
          <STText style={s.primaryBtnText}>
            {intent === 'both' ? 'Continue to club setup' : 'Continue'}
          </STText>
        )}
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
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: 'rgba(255,255,255,0.08)',
                }}
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
