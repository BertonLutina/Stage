import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import useTeamStore from '../../store/teamStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { goBackInPlace } from '@/lib/navigationBack';
import Screen from '@/components/ui/Screen';
import IconButton from '@/components/ui/IconButton';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import SectionLabel from '@/components/ui/SectionLabel';

export default function CreateTeamScreen({ navigation }) {
  const [form, setForm] = useState({ club_name: '', country: '', country_code: '', bio: '' });
  const [avatarUri, setAvatarUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const [error, setError] = useState(null);
  const { createTeam } = useTeamStore();
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required for the team logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!form.club_name) return setError('Club name is required');
    setLoading(true);
    try {
      const payload = { ...form };
      if (avatarUri && avatarUri.startsWith('file://')) {
        const ext = avatarUri.split('.').pop() || 'jpg';
        payload.avatar = {
          uri: avatarUri,
          type: ext === 'png' ? 'image/png' : 'image/jpeg',
          name: `avatar.${ext}`,
        };
      }
      const team = await createTeam(payload);
      navigation.replace('TeamProfile', { teamId: team.id });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally { setLoading(false); }
  };

  return (
    <Screen tabBar={false} keyboardAvoiding style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <IconButton icon="close" accessibilityLabel="Close" onPress={() => goBackInPlace(router)} />
        <SectionLabel>New team</SectionLabel>
        <View style={{ width: 44 }} />
      </View>

      <Text
        accessibilityRole="header"
        style={{
          color: tokens.text,
          fontFamily: FONT_EA_SPORTS,
          fontSize: 34,
          letterSpacing: 34 * 0.03,
          textTransform: 'uppercase',
        }}
      >
        Create Team
      </Text>

      {error ? (
        <View
          accessibilityRole="alert"
          style={{ backgroundColor: tokens.dangerBg, borderColor: tokens.danger, borderWidth: 1, borderRadius: 12, padding: 12 }}
        >
          <Text style={{ color: tokens.danger, fontSize: 14 }}>{error}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
        <TouchableOpacity
          onPress={pickImage}
          accessibilityRole="button"
          accessibilityLabel="Team logo"
          style={{ alignItems: 'center' }}
        >
          <View style={{ width: 88, height: 88 }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                borderWidth: 2,
                borderStyle: avatarUri ? 'solid' : 'dashed',
                borderColor: avatarUri ? tokens.cyan : tokens.borderStrong,
                backgroundColor: tokens.bgDeep,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 88, height: 88 }} />
              ) : (
                <Ionicons name="shield-outline" size={36} color={tokens.muted} />
              )}
            </View>
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: tokens.cyan,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="camera" size={16} color={tokens.onCyan} />
            </View>
          </View>
          <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 6 }}>Team logo</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0, alignSelf: 'flex-start' }}>
          <TextField label="Club Name *" value={form.club_name} onChangeText={set('club_name')} placeholder="FC Longue Vie" />
        </View>
      </View>

      <TextField label="Country" value={form.country} onChangeText={set('country')} placeholder="Belgium" />
      <TextField label="Country Code" value={form.country_code} onChangeText={set('country_code')} placeholder="BE" autoCapitalize="characters" />
      <TextField label="Bio" value={form.bio} onChangeText={set('bio')} placeholder="About your team..." multiline numberOfLines={3} />
      <Button title="Create Team" onPress={submit} loading={loading} />
    </Screen>
  );
}
