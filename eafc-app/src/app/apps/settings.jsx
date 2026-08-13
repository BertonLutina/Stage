import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Modal,
  StatusBar, ActivityIndicator, Linking, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { stageClient, resolveMyPlayerAndClub } from '@/api/stageClient';
import useAuthStore from '@/store/authStore';
import { createTranslator } from '@/translations';
import { DISPLAY_LANGUAGES } from '@/lib/languages';
import { localStorage } from '@/lib/polyfillStorage';
import {
  NOTIFICATION_SETTINGS,
  NOTIFICATION_SETTING_GROUPS,
  getDefaultNotificationSettings,
} from '@/lib/notificationTypes';
import {
  NOTIFICATION_SOUNDS,
  getSelectedNotificationSoundId,
  setSelectedNotificationSoundId,
} from '@/lib/notificationSound';
import {
  LIVE_DARK_BG_OPTIONS,
  LIVE_DARK_MAX_UPLOADS,
  getLiveDarkBgPreference,
  setLiveDarkBgPreference,
  getLiveDarkUploadSlots,
  filledUploadCount,
  addLiveDarkUpload,
  replaceLiveDarkUpload,
  clearLiveDarkUpload,
  getLiveDarkFx,
  setLiveDarkFx,
} from '@/lib/liveDarkBackground';
import { DISCORD_INVITE_URL } from '@/lib/discordConfig';
import {
  getBiometricEnabled,
  isBiometricAvailable,
  setBiometricEnabled,
} from '@/services/biometricAuthService';
import SettingsSection from '@/components/settings/SettingsSection';
import AccountRoleUpgradeSection from '@/components/settings/AccountRoleUpgradeSection';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
  AMBER,
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleLg, headingStyleSm } from '@/lib/fonts';

const THEME_KEY = 'stage-theme';
const LANGUAGE_KEY = 'language';

const TIMEZONES = [
  { value: 'Europe/Brussels', label: 'Brussels, Belgium' },
  { value: 'Europe/London', label: 'London, UK' },
  { value: 'Europe/Paris', label: 'Paris, France' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam, Netherlands' },
  { value: 'America/New_York', label: 'New York, USA' },
  { value: 'America/Los_Angeles', label: 'Los Angeles, USA' },
  { value: 'America/Toronto', label: 'Toronto, Canada' },
  { value: 'Africa/Lagos', label: 'Lagos, Nigeria' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg, South Africa' },
  { value: 'Asia/Dubai', label: 'Dubai, UAE' },
];

const THEMES = [
  { id: 'theme-dark', labelKey: 'stgThemeDark' },
  { id: 'theme-light', labelKey: 'stgThemeDay' },
  { id: 'theme-video', labelKey: 'stgThemeLiveDark' },
  { id: 'theme-white', labelKey: 'stgThemeLiveWhite' },
  { id: 'theme-custom', labelKey: 'stgThemeCustom' },
];

const PRESET_THEMES = [
  { name: 'Midnight', primary: '#00d4ff', gradient: '#0099ff', background: '#0f0f0f', text: '#ffffff', primaryText: '#ffffff', secondaryText: '#e0e0e0' },
  { name: 'Ocean', primary: '#00b8d4', gradient: '#0088bb', background: '#0a1628', text: '#e0f7ff', primaryText: '#ffffff', secondaryText: '#b3e5fc' },
  { name: 'Forest', primary: '#00c853', gradient: '#00aa47', background: '#1b3a1b', text: '#e8f5e9', primaryText: '#ffffff', secondaryText: '#c8e6c9' },
  { name: 'Sunset', primary: '#ff6d00', gradient: '#ff9100', background: '#2c1810', text: '#ffe0b2', primaryText: '#ffffff', secondaryText: '#ffe0b2' },
  { name: 'Purple', primary: '#d500f9', gradient: '#aa00ff', background: '#2a1a3a', text: '#f3e5f5', primaryText: '#ffffff', secondaryText: '#e1bee7' },
  { name: 'Cyberpunk', primary: '#ff006e', gradient: '#ff1b6d', background: '#0a0e27', text: '#ffff00', primaryText: '#ffffff', secondaryText: '#ffff88' },
  { name: 'Sakura', primary: '#ff1493', gradient: '#ff69b4', background: '#2a1a2a', text: '#ffe4f0', primaryText: '#ffffff', secondaryText: '#ffb3d9' },
  { name: 'Gold', primary: '#ffd700', gradient: '#ffed4e', background: '#2a2410', text: '#fff8dc', primaryText: '#2c2410', secondaryText: '#ffe680' },
  { name: 'Emerald', primary: '#1abc9c', gradient: '#16a085', background: '#0d2818', text: '#d5f4e6', primaryText: '#ffffff', secondaryText: '#a9e6d4' },
  { name: 'Cosmic', primary: '#9d4edd', gradient: '#7209b7', background: '#1a0f2e', text: '#e0c3fc', primaryText: '#ffffff', secondaryText: '#c77dff' },
  { name: 'Coral', primary: '#ff6b6b', gradient: '#ff8c8c', background: '#2a1515', text: '#ffe4e1', primaryText: '#ffffff', secondaryText: '#ffb3a7' },
  { name: 'Slate', primary: '#b0bec5', gradient: '#90a4ae', background: '#1a1a1a', text: '#eceff1', primaryText: '#ffffff', secondaryText: '#cfd8dc' },
  { name: 'Neon Green', primary: '#39ff14', gradient: '#80ff00', background: '#0a1a0a', text: '#ccffcc', primaryText: '#000000', secondaryText: '#99ff99' },
  { name: 'Lavender', primary: '#b19cd9', gradient: '#d8bfd8', background: '#2a1a3a', text: '#f3e5fb', primaryText: '#ffffff', secondaryText: '#e6d5f0' },
  { name: 'Terracotta', primary: '#cc5500', gradient: '#ff7f50', background: '#2a1a10', text: '#ffe4cc', primaryText: '#ffffff', secondaryText: '#ffbf99' },
];

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Brussels';
  } catch {
    return 'Europe/Brussels';
  }
}

function interpolate(value, vars) {
  if (!vars) return String(value ?? '');
  return Object.entries(vars).reduce(
    (acc, [key, next]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(next)),
    String(value ?? ''),
  );
}

function Chip({ label, selected, onPress, color }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? (color || CYAN) : 'rgba(255,255,255,0.14)',
        backgroundColor: selected ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.04)',
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Text style={{ color: selected ? (color || CYAN) : 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PasswordField({ label, value, onChange, placeholder, visible, onToggle }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }}>
        {String(label || '').toUpperCase()}
      </Text>
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.35)"
          secureTextEntry={!visible}
          style={{
            backgroundColor: 'rgba(0,0,0,0.28)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            borderRadius: 12,
            color: '#fff',
            paddingHorizontal: 14,
            paddingVertical: 12,
            paddingRight: 44,
          }}
        />
        <TouchableOpacity onPress={onToggle} style={{ position: 'absolute', right: 12, height: '100%', justifyContent: 'center' }}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.45)" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || 'en');
  const translate = useMemo(() => createTranslator(language), [language]);
  const t = useCallback((path, vars) => interpolate(translate(path, path), vars), [translate]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [timezone, setTimezone] = useState(detectTimezone);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'theme-dark');
  const [customPrimaryColor, setCustomPrimaryColor] = useState('#00d4ff');
  const [customGradientColor, setCustomGradientColor] = useState('#0099ff');
  const [customBackgroundColor, setCustomBackgroundColor] = useState('#220e0e');
  const [customBackgroundOpacity, setCustomBackgroundOpacity] = useState(0.95);
  const [customTextColor, setCustomTextColor] = useState('#ffffff');
  const [customPrimaryTextColor, setCustomPrimaryTextColor] = useState('#ffffff');
  const [customSecondaryTextColor, setCustomSecondaryTextColor] = useState('#e0e0e0');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [notificationSound, setNotificationSound] = useState(() => getSelectedNotificationSoundId());
  const [notifSettings, setNotifSettings] = useState(getDefaultNotificationSettings());
  const [player, setPlayer] = useState(null);
  const [notifSaving, setNotifSaving] = useState(false);
  const [liveDarkBg, setLiveDarkBg] = useState(() => getLiveDarkBgPreference());
  const [liveDarkSlots, setLiveDarkSlots] = useState(() => getLiveDarkUploadSlots());
  const [liveDarkFx, setLiveDarkFxState] = useState(() => getLiveDarkFx());
  const [liveDarkUploading, setLiveDarkUploading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, resolved, bioOn, bioOk] = await Promise.all([
          stageClient.auth.me().catch(() => null),
          resolveMyPlayerAndClub().catch(() => ({})),
          getBiometricEnabled(),
          isBiometricAvailable(),
        ]);
        if (cancelled) return;
        if (me?.language) setLanguage(me.language);
        setTimezone(me?.timezone || detectTimezone());
        if (me?.customPrimaryColor) setCustomPrimaryColor(me.customPrimaryColor);
        if (me?.customGradientColor) setCustomGradientColor(me.customGradientColor);
        if (me?.customBackgroundColor) setCustomBackgroundColor(me.customBackgroundColor);
        if (me?.customBackgroundOpacity != null) setCustomBackgroundOpacity(Number(me.customBackgroundOpacity));
        if (me?.customTextColor) setCustomTextColor(me.customTextColor);
        if (me?.customPrimaryTextColor) setCustomPrimaryTextColor(me.customPrimaryTextColor);
        if (me?.customSecondaryTextColor) setCustomSecondaryTextColor(me.customSecondaryTextColor);
        if (me?.backgroundImage) setBackgroundImage(me.backgroundImage);
        const p = resolved?.player || null;
        setPlayer(p);
        if (p?.notification_settings) {
          setNotifSettings({ ...getDefaultNotificationSettings(), ...p.notification_settings });
        }
        setBiometricEnabledState(bioOn);
        setBiometricAvailable(bioOk);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const applyPreset = (preset) => {
    setCustomPrimaryColor(preset.primary);
    setCustomGradientColor(preset.gradient);
    setCustomBackgroundColor(preset.background);
    setCustomTextColor(preset.text);
    setCustomPrimaryTextColor(preset.primaryText);
    setCustomSecondaryTextColor(preset.secondaryText);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0];
  };

  const handleBackgroundUpload = async () => {
    const asset = await pickImage();
    if (!asset) return;
    setSaving(true);
    try {
      const uploaded = await stageClient.integrations.Core.UploadFile({
        file: { uri: asset.uri, name: asset.fileName || 'background.jpg', type: asset.mimeType || 'image/jpeg' },
      });
      setBackgroundImage(uploaded?.file_url || asset.uri);
    } catch (err) {
      Alert.alert('Upload failed', err?.message || 'Could not upload that image');
    } finally {
      setSaving(false);
    }
  };

  const handleLiveDarkUpload = async (forcedIndex = null) => {
    const asset = await pickImage();
    if (!asset) return;
    setLiveDarkUploading(true);
    try {
      let result;
      if (forcedIndex != null) {
        result = replaceLiveDarkUpload(forcedIndex, asset.uri);
      } else if (filledUploadCount(liveDarkSlots) >= LIVE_DARK_MAX_UPLOADS) {
        Alert.alert(t('settingsPage.stgLiveDarkUploadFullTitle'), t('settingsPage.stgLiveDarkUploadFullDesc'));
        return;
      } else {
        result = addLiveDarkUpload(asset.uri);
      }
      if (!result.ok) {
        Alert.alert(t('settingsPage.stgLiveDarkUploadFullTitle'), t('settingsPage.stgLiveDarkUploadFullDesc'));
        return;
      }
      const slots = getLiveDarkUploadSlots();
      setLiveDarkSlots(slots);
      const idx = result.index ?? forcedIndex;
      if (idx != null && idx >= 0) setLiveDarkBg(setLiveDarkBgPreference(`custom-${idx}`));
    } finally {
      setLiveDarkUploading(false);
    }
  };

  const handleToggleNotif = async (key, value) => {
    const updated = { ...notifSettings, [key]: value };
    setNotifSettings(updated);
    if (!player?.id) return;
    setNotifSaving(true);
    try {
      await stageClient.entities.Player.update(player.id, { notification_settings: updated });
    } catch {
      /* keep local toggle */
    } finally {
      setNotifSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      setSelectedNotificationSoundId(notificationSound);
      localStorage.setItem(LANGUAGE_KEY, language);
      localStorage.setItem(THEME_KEY, theme);
      await stageClient.auth.updateMe({
        language,
        customPrimaryColor,
        customGradientColor,
        customBackgroundColor,
        customBackgroundOpacity,
        customTextColor,
        customPrimaryTextColor,
        customSecondaryTextColor,
        backgroundImage,
      });
      await stageClient.auth.updateTimezone(timezone);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      Alert.alert('Save failed', err?.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await stageClient.functions.invoke('changePassword', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordForm(false), 1200);
    } catch (err) {
      setPasswordMessage(err?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE' || deleting) return;
    setDeleting(true);
    try {
      await stageClient.functions.invoke('deleteAccount', {});
      setDeleteOpen(false);
      await logout();
      router.replace('/auth/loginscreen');
    } catch (err) {
      Alert.alert('Delete failed', err?.message || 'Could not delete your account.');
    } finally {
      setDeleting(false);
    }
  };

  const sportSounds = NOTIFICATION_SOUNDS.filter((s) => s.category === 'sport' || s.category === 'digital');
  const classicSounds = NOTIFICATION_SOUNDS.filter((s) => s.category === 'classic');
  const settingsByKey = Object.fromEntries(NOTIFICATION_SETTINGS.map((row) => [row.key, row]));

  if (loading) {
    return (
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={CYAN} size="large" />
        </View>
      </GamerProfileShell>
    );
  }

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', alignItems: 'center' }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[headingStyleSm, { color: CYAN, fontSize: 10, letterSpacing: 2 }]}>STAGE</Text>
            <Text style={[headingStyleLg, { color: '#fff', fontSize: 22 }]}>{t('settingsPage.title')}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 14 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: -4 }}>
            {t('settingsPage.subtitle')}
          </Text>

          <AccountRoleUpgradeSection t={t} />

          <SettingsSection title={t('settingsPage.languageTitle')} description={t('settingsPage.languageDescription')} icon="globe-outline">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DISPLAY_LANGUAGES.map((lang) => (
                <Chip
                  key={lang.value}
                  label={`${lang.flag} ${lang.nativeLabel}`}
                  selected={language === lang.value}
                  onPress={() => lang.enabled && setLanguage(lang.value)}
                />
              ))}
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 12 }}>Timezone</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {TIMEZONES.map((zone) => (
                <Chip
                  key={zone.value}
                  label={zone.label}
                  selected={timezone === zone.value}
                  onPress={() => setTimezone(zone.value)}
                />
              ))}
              {!TIMEZONES.some((zone) => zone.value === timezone) ? (
                <Chip label={timezone} selected onPress={() => {}} />
              ) : null}
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, marginTop: 8, lineHeight: 16 }}>
              Match times use this timezone. Brussels automatically switches between CET and CEST.
            </Text>
          </SettingsSection>

          <SettingsSection title={t('settingsPage.stgAppTheme')} description={t('settingsPage.stgAppThemeDesc')} icon="color-palette-outline">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {THEMES.map((item) => (
                <Chip
                  key={item.id}
                  label={t(`settingsPage.${item.labelKey}`)}
                  selected={theme === item.id}
                  onPress={() => {
                    localStorage.setItem(THEME_KEY, item.id);
                    setTheme(item.id);
                  }}
                />
              ))}
            </View>

            {theme === 'theme-custom' ? (
              <View style={{ marginTop: 14, gap: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{t('settingsPage.stgPresetThemes')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {PRESET_THEMES.map((preset) => (
                    <TouchableOpacity
                      key={preset.name}
                      onPress={() => applyPreset(preset)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.12)',
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                      }}
                    >
                      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: preset.primary }} />
                      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: preset.gradient }} />
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{preset.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  {t('settingsPage.stgPrimaryColor')}: {customPrimaryColor} · {t('settingsPage.stgBackgroundColor')}: {customBackgroundColor}
                </Text>
                <TouchableOpacity onPress={handleBackgroundUpload} style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 12, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>
                    {backgroundImage ? t('settingsPage.stgChangeBackground') : t('settingsPage.stgUploadBackground')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {theme === 'theme-video' ? (
              <View style={{ marginTop: 14, gap: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{t('settingsPage.stgLiveDarkBgTitle')}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{t('settingsPage.stgLiveDarkBgDesc')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {LIVE_DARK_BG_OPTIONS.map((opt) => (
                    <Chip
                      key={opt.id}
                      label={t(`settingsPage.${opt.labelKey}`)}
                      selected={liveDarkBg === opt.id}
                      onPress={() => setLiveDarkBg(setLiveDarkBgPreference(opt.id))}
                    />
                  ))}
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  {t('settingsPage.stgLiveDarkUploadsDesc', { count: filledUploadCount(liveDarkSlots), max: LIVE_DARK_MAX_UPLOADS })}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {liveDarkSlots.map((src, index) => (
                    <TouchableOpacity
                      key={`slot-${index}`}
                      onPress={() => (src ? setLiveDarkBg(setLiveDarkBgPreference(`custom-${index}`)) : handleLiveDarkUpload(index))}
                      onLongPress={() => src && (clearLiveDarkUpload(index), setLiveDarkSlots(getLiveDarkUploadSlots()), setLiveDarkBg(getLiveDarkBgPreference()))}
                      style={{
                        flex: 1,
                        aspectRatio: 1,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: liveDarkBg === `custom-${index}` ? CYAN : 'rgba(255,255,255,0.12)',
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                      }}
                    >
                      {src ? (
                        <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textAlign: 'center' }}>
                          {liveDarkUploading ? t('settingsPage.stgLiveDarkUploading') : t('settingsPage.stgLiveDarkSlotEmpty', { n: index + 1 })}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)' }}>{t('settingsPage.stgLiveDarkBlur')}: {Math.round(liveDarkFx.blur)}px</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Chip label="-" selected={false} onPress={() => setLiveDarkFxState(setLiveDarkFx({ blur: liveDarkFx.blur - 2 }))} />
                    <Chip label="+" selected={false} onPress={() => setLiveDarkFxState(setLiveDarkFx({ blur: liveDarkFx.blur + 2 }))} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)' }}>{t('settingsPage.stgLiveDarkOverlay')}: {Math.round(liveDarkFx.overlay * 100)}%</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Chip label="-" selected={false} onPress={() => setLiveDarkFxState(setLiveDarkFx({ overlay: liveDarkFx.overlay - 0.05 }))} />
                    <Chip label="+" selected={false} onPress={() => setLiveDarkFxState(setLiveDarkFx({ overlay: liveDarkFx.overlay + 0.05 }))} />
                  </View>
                </View>
              </View>
            ) : null}
          </SettingsSection>

          <SettingsSection title={t('settingsPage.stgAccountSecurity')} description={t('settingsPage.stgAccountSecurityDesc')} icon="lock-closed-outline">
            {biometricAvailable ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Biometric login</Text>
                <Switch
                  value={biometricEnabled}
                  onValueChange={async (next) => {
                    setBiometricEnabledState(next);
                    await setBiometricEnabled(next);
                  }}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: CYAN }}
                  thumbColor="#fff"
                />
              </View>
            ) : null}
            {!showPasswordForm ? (
              <TouchableOpacity
                onPress={() => setShowPasswordForm(true)}
                style={{ borderWidth: 1, borderColor: 'rgba(0,240,255,0.3)', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
              >
                <Text style={{ color: CYAN, fontWeight: '800' }}>{t('settingsPage.stgChangePassword')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 10 }}>
                <PasswordField label={t('settingsPage.stgCurrentPassword')} value={currentPassword} onChange={setCurrentPassword} placeholder={t('settingsPage.stgEnterCurrentPassword')} visible={showCurrentPass} onToggle={() => setShowCurrentPass((v) => !v)} />
                <PasswordField label={t('settingsPage.stgNewPassword')} value={newPassword} onChange={setNewPassword} placeholder={t('settingsPage.stgEnterNewPassword')} visible={showNewPass} onToggle={() => setShowNewPass((v) => !v)} />
                <PasswordField label={t('settingsPage.stgConfirmPassword')} value={confirmPassword} onChange={setConfirmPassword} placeholder={t('settingsPage.stgConfirmNewPassword')} visible={showConfirmPass} onToggle={() => setShowConfirmPass((v) => !v)} />
                {passwordMessage ? (
                  <Text style={{ color: passwordMessage.includes('success') ? '#34D399' : '#FB7185', fontSize: 12 }}>{passwordMessage}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={handleChangePassword}
                    disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                    style={{ flex: 1, backgroundColor: CYAN, borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: passwordLoading ? 0.6 : 1 }}
                  >
                    <Text style={{ color: '#041018', fontWeight: '900' }}>
                      {passwordLoading ? t('settingsPage.stgUpdating') : t('settingsPage.stgUpdatePassword')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setShowPasswordForm(false); setPasswordMessage(''); }}
                    style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </SettingsSection>

          <SettingsSection title={t('nav.discord') || 'Community'} description={t('settingsPage.stgCommunityDesc')} icon="logo-discord">
            <TouchableOpacity
              onPress={() => DISCORD_INVITE_URL && Linking.openURL(DISCORD_INVITE_URL)}
              style={{ backgroundColor: '#5865F2', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '900' }}>Join Discord</Text>
            </TouchableOpacity>
          </SettingsSection>

          <SettingsSection
            title="Notification Settings"
            description="Choose which notifications you want to receive"
            icon="notifications-outline"
            action={notifSaving ? <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Saving...</Text> : null}
          >
            {NOTIFICATION_SETTING_GROUPS.map((group) => (
              <View key={group.label} style={{ marginBottom: 10 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 6 }}>
                  {group.label.toUpperCase()}
                </Text>
                {group.keys.map((key) => {
                  const row = settingsByKey[key];
                  if (!row) return null;
                  return (
                    <View key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{row.label}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{row.description}</Text>
                      </View>
                      <Switch
                        value={notifSettings[key] !== false}
                        onValueChange={(next) => handleToggleNotif(key, next)}
                        trackColor={{ false: 'rgba(255,255,255,0.15)', true: CYAN }}
                        thumbColor="#fff"
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </SettingsSection>

          <SettingsSection title={t('settingsPage.notificationSoundTitle')} description={t('settingsPage.notificationSoundDesc')} icon="volume-high-outline">
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 8 }}>
              {t('settingsPage.soundSport')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {sportSounds.map((sound) => (
                <Chip
                  key={sound.id}
                  label={sound.label}
                  selected={notificationSound === sound.id}
                  color={AMBER}
                  onPress={() => setNotificationSound(sound.id)}
                />
              ))}
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 8 }}>
              {t('settingsPage.soundClassic')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {classicSounds.map((sound) => (
                <Chip
                  key={sound.id}
                  label={sound.label}
                  selected={notificationSound === sound.id}
                  color={AMBER}
                  onPress={() => setNotificationSound(sound.id)}
                />
              ))}
            </View>
          </SettingsSection>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{ backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
          >
            <Text style={{ color: '#0d2461', fontWeight: '900', letterSpacing: 0.8 }}>
              {saving ? t('settingsPage.saving') : saved ? t('settingsPage.saved') : t('settingsPage.saveChanges')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              await logout();
              router.replace('/auth/loginscreen');
            }}
            style={{ borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#F59E0B', fontWeight: '900' }}>{t('settingsPage.stgSignOut')}</Text>
          </TouchableOpacity>

          <SettingsSection title={t('settingsPage.stgDangerZone')} description={t('settingsPage.stgDangerZoneDesc')} icon="warning-outline">
            <TouchableOpacity
              onPress={() => setDeleteOpen(true)}
              style={{ borderWidth: 1, borderColor: 'rgba(244,63,94,0.4)', borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
            >
              <Text style={{ color: '#FB7185', fontWeight: '900' }}>{t('settingsPage.stgDeleteAccount')}</Text>
            </TouchableOpacity>
          </SettingsSection>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#111827', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)' }}>
            <Text style={{ color: '#FB7185', fontWeight: '900', fontSize: 16 }}>{t('settingsPage.stgDeleteAccount')}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, lineHeight: 18 }}>
              {t('settingsPage.stgDeleteWarning')} {t('settingsPage.stgCannotUndo')}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>{t('settingsPage.stgTypeToConfirm')}</Text>
            <TextInput
              value={deleteConfirm}
              onChangeText={setDeleteConfirm}
              placeholder={t('settingsPage.stgTypeDelete')}
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoCapitalize="characters"
              style={{
                marginTop: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.14)',
                borderRadius: 10,
                color: '#fff',
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity onPress={() => { setDeleteOpen(false); setDeleteConfirm(''); }} style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                style={{ flex: 1, backgroundColor: '#FB7185', borderRadius: 10, paddingVertical: 12, alignItems: 'center', opacity: deleteConfirm === 'DELETE' ? 1 : 0.4 }}
              >
                <Text style={{ color: '#1A0508', fontWeight: '900' }}>
                  {deleting ? t('settingsPage.stgDeleting') : t('settingsPage.stgDeleteMyAccount')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GamerProfileShell>
  );
}
