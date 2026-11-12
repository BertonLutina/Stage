import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { stageClient, resolveMyPlayerAndClub } from '@/api/stageClient';
import useAuthStore from '@/store/authStore';
import useThemeStore from '@/store/themeStore';
import { COUNTRIES } from '@/lib/countries';
import { PLAYER_POSITIONS } from '@/lib/stageDirectories';
import { CONSOLE_OPTIONS, normalizeConsoleChoice } from '@/lib/platformDisplay';
import { FONT_EA_SPORTS, headingStyleLg } from '@/lib/fonts';
import { hostedMediaUrl } from '@/lib/uploadProfileMedia';
import {
  Screen,
  Button,
  IconButton,
  Chip,
  SectionLabel,
  TextField,
  SelectField,
} from '@/components/ui';

const POSITIONS = PLAYER_POSITIONS.filter((p) => p !== 'All');
const PLATFORM_OPTIONS = CONSOLE_OPTIONS;

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

export default function EditProfileScreen() {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [player, setPlayer] = useState(null);

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [gamertag, setGamertag] = useState(user?.gamer_tag || user?.gamertag || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [position, setPosition] = useState('ST');
  const [secondaryPosition, setSecondaryPosition] = useState('none');
  const [platform, setPlatform] = useState('PS5');
  const [country, setCountry] = useState(null);
  const [avatarUri, setAvatarUri] = useState(null);
  const [bannerUri, setBannerUri] = useState(null);
  const [preferredFoot, setPreferredFoot] = useState(null);
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
        setPlayer(nextPlayer);

        const tag = nextPlayer?.gamertag || user?.gamer_tag || user?.gamertag || '';
        const names = splitName(tag, user?.email);
        setGamertag(tag);
        setFirstName(user?.first_name || names.first_name);
        setLastName(user?.last_name || names.last_name);
        setBio(nextPlayer?.bio || user?.bio || '');
        setPosition(nextPlayer?.position || 'ST');
        setSecondaryPosition(nextPlayer?.secondary_position || 'none');
        setPlatform(normalizeConsoleChoice(nextPlayer?.platform) || 'PS5');
        setCountry(matchCountry(nextPlayer) || matchCountry(user));
        setAvatarUri(nextPlayer?.avatar_url || user?.avatar || user?.avatar_url || null);
        setBannerUri(nextPlayer?.banner_url || null);
        setPreferredFoot(nextPlayer?.preferred_foot || null);
      } catch {
        const tag = user?.gamer_tag || user?.gamertag || '';
        const names = splitName(tag, user?.email);
        setGamertag(tag);
        setFirstName(user?.first_name || names.first_name);
        setLastName(user?.last_name || names.last_name);
        setBio(user?.bio || '');
        setCountry(matchCountry(user));
        setAvatarUri(user?.avatar || user?.avatar_url || null);
        setBannerUri(null);
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

  const pickBanner = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to change your banner.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setBannerUri(result.assets[0].uri);
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
      const avatarUrl = await hostedMediaUrl(avatarUri, { fallbackName: 'avatar.jpg' });
      const bannerUrl = await hostedMediaUrl(bannerUri, { fallbackName: 'banner.jpg' });

      const playerPayload = {
        gamertag: tag,
        bio: bio.trim() || null,
        position,
        secondary_position: secondaryPosition === 'none' ? null : secondaryPosition,
        platform,
        country: country?.name || null,
        country_code: country?.code || null,
      };
      if (preferredFoot) playerPayload.preferred_foot = preferredFoot;
      if (avatarUrl) playerPayload.avatar_url = avatarUrl;
      if (bannerUrl) playerPayload.banner_url = bannerUrl;

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
        banner_url: bannerUrl || user?.banner_url,
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

  const initials = (gamertag || firstName || '?').trim().slice(0, 2);

  if (loading) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.cyan} />
        </View>
      </Screen>
    );
  }

  const fieldLabel = {
    color: tokens.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  };
  const chipWrap = { flexDirection: 'row', flexWrap: 'wrap', gap: 8 };

  return (
    <Screen keyboardAvoiding style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <IconButton icon="close" onPress={() => router.back()} accessibilityLabel="Cancel" />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <SectionLabel>Edit Profile</SectionLabel>
        </View>
        <Pressable
          onPress={save}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.5 : 1 }}
        >
          <Text style={{ color: tokens.cyan, fontSize: 15, fontWeight: '700' }}>Save</Text>
        </Pressable>
      </View>

      <TouchableOpacity
        onPress={pickImage}
        accessibilityRole="button"
        accessibilityLabel="Change photo"
        activeOpacity={0.85}
        style={{ alignItems: 'center', gap: 10, paddingVertical: 6 }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 26,
            borderWidth: 2,
            borderColor: tokens.cyan,
            backgroundColor: tokens.border,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text
              numberOfLines={1}
              style={{
                color: tokens.cyanHi,
                fontFamily: FONT_EA_SPORTS,
                fontSize: 34,
                textTransform: 'uppercase',
              }}
            >
              {initials}
            </Text>
          )}
        </View>
        <Chip label="Change photo" icon="camera-outline" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={pickBanner}
        accessibilityRole="button"
        accessibilityLabel="Change banner"
        activeOpacity={0.85}
        style={{
          height: 110,
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.card,
        }}
      >
        {bannerUri ? (
          <Image source={{ uri: bannerUri }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Ionicons name="image-outline" size={22} color={tokens.cyan} />
            <Text style={{ color: tokens.muted, fontSize: 13, fontWeight: '600' }}>Tap to change banner</Text>
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: tokens.cyan,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="camera" size={14} color={tokens.onCyan} />
        </View>
      </TouchableOpacity>

      <TextField
        label="Display name"
        accessibilityLabel="Gamertag"
        labelColor={tokens.muted}
        value={gamertag}
        onChangeText={setGamertag}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Your name on the pitch"
      />
      <TextField
        label="Bio"
        labelColor={tokens.muted}
        value={bio}
        onChangeText={setBio}
        multiline
        placeholder="Tell us about yourself..."
        style={{ minHeight: 84 }}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <View style={{ width: '47%', flexGrow: 1 }}>
          <Text style={fieldLabel}>Main position</Text>
          <View style={chipWrap}>
            {POSITIONS.map((p) => (
              <Chip
                key={p}
                label={p}
                active={position === p}
                onPress={() => {
                  setPosition(p);
                  if (secondaryPosition === p) setSecondaryPosition('none');
                }}
              />
            ))}
          </View>
        </View>
        <View style={{ width: '47%', flexGrow: 1 }}>
          <Text style={fieldLabel}>Alt position</Text>
          <View style={chipWrap}>
            <Chip
              label="None"
              active={secondaryPosition === 'none'}
              onPress={() => setSecondaryPosition('none')}
            />
            {POSITIONS.filter((p) => p !== position).map((p) => (
              <Chip
                key={p}
                label={p}
                active={secondaryPosition === p}
                onPress={() => setSecondaryPosition(p)}
              />
            ))}
          </View>
        </View>
        <View style={{ width: '47%', flexGrow: 1 }}>
          <Text style={fieldLabel}>Platform</Text>
          <View style={chipWrap}>
            {PLATFORM_OPTIONS.map((p) => (
              <Chip key={p} label={p} active={platform === p} onPress={() => setPlatform(p)} />
            ))}
          </View>
        </View>
        <View style={{ width: '47%', flexGrow: 1 }}>
          <SelectField
            label="Country"
            value={country?.name}
            placeholder="Select country"
            onPress={() => setCountryPicker(true)}
          />
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={fieldLabel}>Preferred foot</Text>
        <View style={chipWrap}>
          {['Left', 'Right', 'Both'].map((foot) => {
            const value = foot.toLowerCase();
            return (
              <Chip
                key={foot}
                label={foot}
                active={preferredFoot === value}
                onPress={() => setPreferredFoot(value)}
              />
            );
          })}
        </View>
      </View>

      <SectionLabel>Account</SectionLabel>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <TextField label="First name" labelColor={tokens.muted} value={firstName} onChangeText={setFirstName} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Last name" labelColor={tokens.muted} value={lastName} onChangeText={setLastName} />
        </View>
      </View>
      <TextField
        label="Email"
        labelColor={tokens.muted}
        value={user?.email || ''}
        editable={false}
        style={{ color: tokens.muted }}
      />

      <Button title="Save Changes" onPress={save} loading={saving} />

      <Modal visible={countryPicker} animationType="slide" transparent>
        <Pressable
          style={{ flex: 1, backgroundColor: tokens.overlay }}
          onPress={() => setCountryPicker(false)}
          accessibilityLabel="Close country picker"
        />
        <View
          style={{
            maxHeight: '72%',
            backgroundColor: tokens.bgDeep,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 1,
            borderColor: tokens.border,
            padding: 18,
            paddingBottom: 18 + insets.bottom,
            gap: 12,
          }}
        >
          <Text style={[headingStyleLg, { color: tokens.text, fontSize: 22 }]}>Country</Text>
          <TextInput
            value={countryQuery}
            onChangeText={setCountryQuery}
            placeholder="Search…"
            placeholderTextColor={tokens.muted}
            selectionColor={tokens.cyan}
            style={{
              height: 50,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.border,
              backgroundColor: tokens.card,
              paddingHorizontal: 16,
              color: tokens.text,
              fontSize: 15,
            }}
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
                style={{
                  minHeight: 44,
                  justifyContent: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: tokens.border,
                }}
              >
                <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 15 }}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </Screen>
  );
}
