import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { stageClient, resolveMyPlayerAndClub } from '@/api/stageClient';
import useAuthStore from '@/store/authStore';
import { COUNTRIES } from '@/lib/countries';
import { PLAYER_POSITIONS, PLATFORMS } from '@/lib/stageDirectories';
import { headingStyleLg } from '@/lib/fonts';
import {
  GamerProfileShell,
  GlassIconButton,
  GamerSectionCard,
  AMBER,
  CYAN,
} from '@/components/profile/gamer/GamerProfileUI';

const POSITIONS = PLAYER_POSITIONS.filter((p) => p !== 'All');
const PLATFORM_OPTIONS = PLATFORMS.filter((p) => p !== 'All');

function splitName(gamertag, email) {
  const base = String(gamertag || email?.split('@')[0] || 'Player').trim();
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  return {
    first_name: parts[0] || base,
    last_name: parts.slice(1).join(' ') || '',
  };
}

function matchCountry(player) {
  if (player?.country_code) {
    const byCode = COUNTRIES.find((c) => c.code === String(player.country_code).toUpperCase());
    if (byCode) return byCode;
  }
  const raw = String(player?.country || '').trim();
  if (!raw) return null;
  return COUNTRIES.find((c) => c.name === raw)
    || COUNTRIES.find((c) => c.name.endsWith(raw) || raw.endsWith(c.name.replace(/^[^\s]+\s/, '')))
    || null;
}

function fileFromUri(uri) {
  const clean = String(uri || '').split('?')[0];
  const name = clean.split('/').pop() || 'avatar.jpg';
  const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
  return {
    uri,
    name: name.includes('.') ? name : `avatar.${ext}`,
    type: ext === 'png' ? 'image/png' : 'image/jpeg',
  };
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [player, setPlayer] = useState(null);
  const [president, setPresident] = useState(null);

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [gamertag, setGamertag] = useState(user?.gamer_tag || user?.gamertag || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [position, setPosition] = useState('ST');
  const [secondaryPosition, setSecondaryPosition] = useState('none');
  const [platform, setPlatform] = useState('PlayStation');
  const [country, setCountry] = useState(null);
  const [avatarUri, setAvatarUri] = useState(null);
  const [countryPicker, setCountryPicker] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES.slice(0, 80);
    return COUNTRIES.filter((c) => (
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )).slice(0, 80);
  }, [countryQuery]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const resolved = await resolveMyPlayerAndClub();
        if (cancelled) return;
        const nextPlayer = resolved?.player || null;
        const nextPresident = resolved?.president || null;
        setPlayer(nextPlayer);
        setPresident(nextPresident);

        const tag = nextPlayer?.gamertag || nextPresident?.display_name || user?.gamer_tag || user?.gamertag || '';
        const names = splitName(tag, user?.email);
        setGamertag(tag);
        setFirstName(user?.first_name || names.first_name);
        setLastName(user?.last_name || names.last_name);
        setBio(nextPlayer?.bio || nextPresident?.bio || user?.bio || '');
        setPosition(nextPlayer?.position || 'ST');
        setSecondaryPosition(nextPlayer?.secondary_position || 'none');
        setPlatform(nextPlayer?.platform || 'PlayStation');
        setCountry(matchCountry(nextPlayer) || matchCountry(user));
        setAvatarUri(nextPlayer?.avatar_url || nextPresident?.avatar_url || user?.avatar || user?.avatar_url || null);
      } catch {
        const tag = user?.gamer_tag || user?.gamertag || '';
        const names = splitName(tag, user?.email);
        setGamertag(tag);
        setFirstName(user?.first_name || names.first_name);
        setLastName(user?.last_name || names.last_name);
        setBio(user?.bio || '');
        setCountry(matchCountry(user));
        setAvatarUri(user?.avatar || user?.avatar_url || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const save = async () => {
    const tag = gamertag.trim();
    if (!tag) {
      Alert.alert('Gamertag required', 'Choose the name clubs and opponents will see.');
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = avatarUri;
      const isLocal = typeof avatarUri === 'string' && (avatarUri.startsWith('file:') || avatarUri.startsWith('content:'));
      if (isLocal) {
        const uploaded = await stageClient.integrations.Core.UploadFile({ file: fileFromUri(avatarUri) });
        avatarUrl = uploaded?.file_url || uploaded?.url || avatarUri;
      }

      const playerPayload = {
        gamertag: tag,
        bio: bio.trim() || null,
        position,
        secondary_position: secondaryPosition === 'none' ? null : secondaryPosition,
        platform,
        country: country?.name || null,
        country_code: country?.code || null,
      };
      if (avatarUrl) playerPayload.avatar_url = avatarUrl;

      let savedPlayer = player;
      if (player?.id) {
        savedPlayer = await stageClient.entities.Player.update(player.id, playerPayload);
      } else if (user?.id) {
        savedPlayer = await stageClient.entities.Player.create({
          ...playerPayload,
          user_id: user.id,
          email: user.email,
        });
      }

      if (president?.id) {
        await stageClient.entities.President.update(president.id, {
          display_name: tag,
          bio: bio.trim() || null,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        });
      }

      const names = splitName(tag, user?.email);
      updateUser({
        ...(user || {}),
        ...(savedPlayer || {}),
        id: user?.id,
        email: user?.email,
        player_id: savedPlayer?.id || user?.player_id,
        gamer_tag: tag,
        gamertag: tag,
        first_name: firstName.trim() || names.first_name,
        last_name: lastName.trim() || names.last_name,
        bio: bio.trim() || null,
        avatar: avatarUrl || user?.avatar,
        avatar_url: avatarUrl || user?.avatar_url,
        country: country?.name || null,
        country_code: country?.code || null,
        position,
        platform,
      });
      router.back();
    } catch (err) {
      Alert.alert('Could not save profile', err?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <GamerProfileShell>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
          <View style={styles.loading}>
            <ActivityIndicator color={AMBER} />
          </View>
        </SafeAreaView>
      </GamerProfileShell>
    );
  }

  return (
    <GamerProfileShell>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.header}>
            <GlassIconButton icon="chevron-back" onPress={() => router.back()} accessibilityLabel="Back" />
            <Text style={[headingStyleLg, styles.title]}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrap} accessibilityLabel="Change photo">
              <View style={styles.avatarRing}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person" size={48} color={CYAN} />
                )}
              </View>
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color="#041018" />
              </View>
            </TouchableOpacity>
            <Text style={styles.hint}>Tap to change photo</Text>

            <GamerSectionCard title="Identity">
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field label="First name" value={firstName} onChangeText={setFirstName} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Last name" value={lastName} onChangeText={setLastName} />
                </View>
              </View>
              <Field
                label="Gamertag"
                value={gamertag}
                onChangeText={setGamertag}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Your name on the pitch"
              />
              <Field label="Email" value={user?.email || ''} editable={false} />
            </GamerSectionCard>

            <GamerSectionCard title="On the pitch" style={{ marginTop: 14 }}>
              <Text style={styles.label}>Country</Text>
              <TouchableOpacity onPress={() => setCountryPicker(true)} style={styles.input} accessibilityLabel="Country">
                <Text style={{ color: country ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 16 }}>
                  {country?.name || 'Select country'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Main position</Text>
              <View style={styles.chipGrid}>
                {POSITIONS.map((p) => {
                  const active = position === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => {
                        setPosition(p);
                        if (secondaryPosition === p) setSecondaryPosition('none');
                      }}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Second position</Text>
              <View style={styles.chipGrid}>
                <TouchableOpacity
                  onPress={() => setSecondaryPosition('none')}
                  style={[styles.chip, { minWidth: 72 }, secondaryPosition === 'none' && styles.chipActive]}
                >
                  <Text style={[styles.chipText, secondaryPosition === 'none' && styles.chipTextActive]}>None</Text>
                </TouchableOpacity>
                {POSITIONS.filter((p) => p !== position).map((p) => {
                  const active = secondaryPosition === p;
                  return (
                    <TouchableOpacity key={p} onPress={() => setSecondaryPosition(p)} style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Platform</Text>
              <View style={styles.chipGrid}>
                {PLATFORM_OPTIONS.map((p) => {
                  const active = platform === p;
                  return (
                    <TouchableOpacity key={p} onPress={() => setPlatform(p)} style={[styles.chip, styles.chipWide, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Field
                label="Bio"
                value={bio}
                onChangeText={setBio}
                multiline
                placeholder="Tell us about yourself..."
              />
            </GamerSectionCard>

            <TouchableOpacity
              onPress={save}
              disabled={saving}
              activeOpacity={0.9}
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel="Save Changes"
            >
              <LinearGradient colors={['#FFE566', AMBER, '#C9A227']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveFill}>
                {saving ? (
                  <ActivityIndicator color="#041018" />
                ) : (
                  <Text style={styles.saveText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={countryPicker} animationType="slide" transparent>
        <Pressable style={styles.sheetScrim} onPress={() => setCountryPicker(false)} />
        <View style={styles.sheet}>
          <Text style={[headingStyleLg, { color: '#fff', fontSize: 22, marginBottom: 12 }]}>Country</Text>
          <TextInput
            value={countryQuery}
            onChangeText={setCountryQuery}
            placeholder="Search…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
            autoFocus
          />
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setCountry(item);
                  setCountryPicker(false);
                  setCountryQuery('');
                }}
                style={styles.countryRow}
              >
                <Text style={{ color: '#fff', fontSize: 14 }}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </GamerProfileShell>
  );
}

function Field({ label, multiline, style, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={[styles.input, multiline && styles.textarea, style]}
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  title: { color: '#fff', flex: 1, textAlign: 'center', fontSize: 22 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  avatarWrap: { alignSelf: 'center', marginTop: 8, marginBottom: 8 },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: AMBER,
    backgroundColor: '#0A1222',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 18,
  },
  row: { flexDirection: 'row', gap: 10 },
  label: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    justifyContent: 'center',
  },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    minWidth: 52,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWide: { flexGrow: 1, flexBasis: '30%' },
  chipActive: {
    backgroundColor: 'rgba(255,214,10,0.16)',
    borderColor: 'rgba(255,214,10,0.55)',
  },
  chipText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: AMBER },
  saveBtn: { marginTop: 18, borderRadius: 16, overflow: 'hidden' },
  saveFill: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  saveText: { color: '#041018', fontSize: 16, fontWeight: '900', letterSpacing: 0.4 },
  sheetScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    maxHeight: '72%',
    backgroundColor: '#0B1220',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
  },
  countryRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
});
