import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Switch, Pressable } from 'react-native';
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
import Card from '@/components/ui/Card';

const TEAM_COLOURS = ['#5FE3E8', '#F59E0B', '#EF4444', '#22C55E', '#A855F7'];

export default function CreateTeamScreen({ navigation }) {
  const [form, setForm] = useState({ club_name: '', tag: '', country: '', country_code: '', bio: '' });
  const [avatarUri, setAvatarUri] = useState(null);
  const [colour, setColour] = useState(TEAM_COLOURS[0]);
  const [openToApplications, setOpenToApplications] = useState(true);
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
      const payload = {
        ...form,
        tag: form.tag.trim().toUpperCase().slice(0, 5),
        primary_color: colour,
        open_to_applications: openToApplications ? '1' : '0',
      };
      if (avatarUri && avatarUri.startsWith('file://')) {
        const ext = avatarUri.split('.').pop() || 'jpg';
        payload.avatar = {
          uri: avatarUri,
          type: ext === 'png' ? 'image/png' : 'image/jpeg',
          name: `avatar.${ext}`,
        };
      }
      const team = await createTeam(payload);
      if (navigation?.replace) navigation.replace('TeamProfile', { teamId: team.id });
      else router.replace({ pathname: '/teams/teamprofilescreen', params: { teamId: String(team.id) } });
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
          style={{ alignItems: 'center', gap: 4 }}
        >
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
              <Ionicons name="add" size={28} color={tokens.muted} />
            )}
          </View>
          <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600' }}>Crest</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0, alignSelf: 'flex-start' }}>
          <TextField
            label="Club Name *"
            accessibilityLabel="Club Name *"
            value={form.club_name}
            onChangeText={set('club_name')}
            placeholder="Night Owls B"
          />
        </View>
      </View>

      <TextField label="Tag" value={form.tag} onChangeText={set('tag')} placeholder="NOB" autoCapitalize="characters" />

      <View style={{ gap: 8 }}>
        <Text style={{ color: tokens.muted, fontSize: 12, fontWeight: '600' }}>Colours</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {TEAM_COLOURS.map((swatch) => {
            const selected = colour === swatch;
            return (
              <Pressable
                key={swatch}
                accessibilityRole="button"
                accessibilityLabel={`Team colour ${swatch}`}
                accessibilityState={{ selected }}
                onPress={() => setColour(swatch)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: swatch,
                  borderWidth: 2,
                  borderColor: selected ? '#FFFFFF' : 'transparent',
                }}
              />
            );
          })}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: tokens.muted, fontSize: 12, fontWeight: '600' }}>Invite players</Text>
        <Card style={{ paddingVertical: 10 }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/search/searchplayer')}
            accessibilityRole="button"
            accessibilityLabel="Find players"
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: tokens.borderStrong, borderRadius: 999 }}
          >
            <Text style={{ color: tokens.cyan, fontWeight: '700' }}>+ Add player</Text>
          </TouchableOpacity>
        </Card>
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }}>Open to applications</Text>
          <Text style={{ color: tokens.muted, fontSize: 12 }}>Free agents can request to join</Text>
        </View>
        <Switch
          accessibilityLabel="Open to applications"
          value={openToApplications}
          onValueChange={setOpenToApplications}
          trackColor={{ false: tokens.border, true: tokens.cyan }}
          thumbColor={tokens.bgDeep}
        />
      </Card>

      <TextField label="Country" value={form.country} onChangeText={set('country')} placeholder="Belgium" />
      <TextField label="Country Code" value={form.country_code} onChangeText={set('country_code')} placeholder="BE" autoCapitalize="characters" />
      <TextField label="Bio" value={form.bio} onChangeText={set('bio')} placeholder="About your team..." multiline numberOfLines={3} />
      <Button title="Create Team" onPress={submit} loading={loading} />
    </Screen>
  );
}
