import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, Pressable, Modal, KeyboardAvoidingView, Platform,
  StatusBar, ActivityIndicator, Linking, Image, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { stageClient, resolveMyPlayerAndClub } from '@/api/stageClient';
import useAuthStore from '@/store/authStore';
import { createTranslator } from '@/translations';
import { DISPLAY_LANGUAGES } from '@/lib/languages';
import { localStorage } from '@/lib/polyfillStorage';
import {
  NOTIFICATION_CHANNELS,
  TEST_TOAST_SAMPLES,
  getDefaultNotificationSettings,
  materializeNotificationSettings,
  setChannelCategory,
} from '@/lib/notificationTypes';
import {
  getNativePushStatus,
  setNativePushEnabled,
  syncOneSignalTags,
} from '@/lib/oneSignal';
import NotificationPushSection from '@/components/settings/NotificationPushSection';
import NotificationChannelSwitches from '@/components/settings/NotificationChannelSwitches';
import { showToast } from '@/utils/toast';
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
  getSupportedBiometricKinds,
  isBiometricAvailable,
  setBiometricEnabled,
  biometricPromptCopy,
} from '@/services/biometricAuthService';
import SettingsSection from '@/components/settings/SettingsSection';
import { SettingsGroup, SettingsRow } from '@/components/settings/SettingsRows';
import AccountRoleUpgradeSection from '@/components/settings/AccountRoleUpgradeSection';
import TutorialPopup from '@/components/onboarding/TutorialPopup';
import { readAccountIntent } from '@/lib/accountIntent';
import {
  Button, Card, Chip, IconButton, Screen, SegmentedControl, SectionLabel, TextField, Toggle,
} from '@/components/ui';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { normalizeThemeId } from '@/lib/stageTheme';
import { CUSTOM_THEME_DEFAULTS } from '@/lib/customThemeDefaults';
import { SettingsListbox } from '@/components/settings/SettingsListbox';
import useThemeStore from '@/store/themeStore';

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
  { id: 'theme-video', labelKey: 'stgThemeLiveDark' },
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

/** Password input with a show/hide button. Reads its own tokens; every prop is passed explicitly. */
function PasswordField({ label, value, onChange, placeholder, visible, onToggle }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      right={(
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${String(label || 'password').toLowerCase()}`}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={tokens.muted} />
        </Pressable>
      )}
    />
  );
}

/** "Label: value" with a minus and a plus button (Live Dark blur / overlay). */
function FxStepper({ label, minusLabel, plusLabel, onMinus, onPlus }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text numberOfLines={1} style={{ flex: 1, color: tokens.textSoft, fontSize: 14 }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <IconButton icon="remove" accessibilityLabel={minusLabel} onPress={onMinus} />
        <IconButton icon="add" accessibilityLabel={plusLabel} onPress={onPlus} />
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const tokens = useThemeStore((s) => s.tokens);
  const setStageTheme = useThemeStore((s) => s.setStageTheme);
  const refreshTheme = useThemeStore((s) => s.refresh);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || 'en');
  const translate = useMemo(() => createTranslator(language), [language]);
  const t = useCallback((path, vars) => interpolate(translate(path, path), vars), [translate]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [timezone, setTimezone] = useState(detectTimezone);
  const [theme, setTheme] = useState(() => normalizeThemeId(localStorage.getItem(THEME_KEY) || 'theme-dark'));
  const [customPrimaryColor, setCustomPrimaryColor] = useState(CUSTOM_THEME_DEFAULTS.primaryColor);
  const [customGradientColor, setCustomGradientColor] = useState(CUSTOM_THEME_DEFAULTS.gradientColor);
  const [customBackgroundColor, setCustomBackgroundColor] = useState(CUSTOM_THEME_DEFAULTS.backgroundColor);
  const [customBackgroundOpacity, setCustomBackgroundOpacity] = useState(CUSTOM_THEME_DEFAULTS.backgroundOpacity);
  const [customTextColor, setCustomTextColor] = useState(CUSTOM_THEME_DEFAULTS.textColor);
  const [customPrimaryTextColor, setCustomPrimaryTextColor] = useState(CUSTOM_THEME_DEFAULTS.primaryTextColor);
  const [customSecondaryTextColor, setCustomSecondaryTextColor] = useState(CUSTOM_THEME_DEFAULTS.secondaryTextColor);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [notifSettings, setNotifSettings] = useState(getDefaultNotificationSettings());
  const [player, setPlayer] = useState(null);
  const [notifSaving, setNotifSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState({ configured: false, permission: false, optedIn: false });
  const [pushBusy, setPushBusy] = useState(false);
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
  const [bioLabel, setBioLabel] = useState('Biometric login');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, resolved, bioOn, bioOk, bioKinds] = await Promise.all([
          stageClient.auth.me().catch(() => null),
          resolveMyPlayerAndClub().catch(() => ({})),
          getBiometricEnabled(),
          isBiometricAvailable(),
          getSupportedBiometricKinds(),
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
          const parsed = materializeNotificationSettings(p.notification_settings);
          setNotifSettings(parsed);
          syncOneSignalTags(parsed);
        } else {
          const defaults = getDefaultNotificationSettings();
          setNotifSettings(defaults);
          syncOneSignalTags(defaults);
        }
        setBiometricEnabledState(bioOn);
        setBiometricAvailable(bioOk);
        setBioLabel(biometricPromptCopy(bioKinds).settingsLabel);
        const nextPush = await getNativePushStatus();
        if (cancelled) return;
        setPushStatus(nextPush);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const applyThemeId = (id) => {
    const next = normalizeThemeId(id);
    setTheme(next);
    setStageTheme(next);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0];
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
      refreshTheme();
    } finally {
      setLiveDarkUploading(false);
    }
  };

  const handleToggleNotif = async (channel, key, value) => {
    const updated = setChannelCategory(notifSettings, channel, key, value);
    setNotifSettings(updated);
    syncOneSignalTags(updated);
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

  const handleTogglePhonePush = async (value) => {
    setPushBusy(true);
    try {
      await setNativePushEnabled(value);
      setPushStatus(await getNativePushStatus());
    } finally {
      setPushBusy(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
      applyThemeId(theme);
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

  if (loading) {
    return (
      <Screen tabBar={false} scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.cyan} size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen tabBar={false} keyboardAvoiding style={{ gap: 16 }}>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <IconButton icon="chevron-back" accessibilityLabel="Back" onPress={() => router.back()} />
        <SectionLabel>STAGE</SectionLabel>
        <View style={{ width: 44, height: 44 }} />
      </View>

      <View style={{ gap: 6 }}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={{
            color: tokens.text,
            fontFamily: FONT_EA_SPORTS,
            fontSize: 34,
            letterSpacing: 34 * 0.03,
            textTransform: 'uppercase',
          }}
        >
          {t('settingsPage.title')}
        </Text>
        <Text style={{ color: tokens.muted, fontSize: 14 }}>
          {t('settingsPage.subtitle')}
        </Text>
      </View>

      <AccountRoleUpgradeSection t={t} />

      <SettingsSection
        rows
        title="Store & wallet"
        description="STAGE Plus, credit packs, and your STC balance."
        icon="bag-outline"
      >
        <SettingsRow icon="bag-outline" title="Store" onPress={() => router.push('/apps/store')} />
        <SettingsRow icon="wallet-outline" title="Wallet" onPress={() => router.push('/apps/wallet')} />
      </SettingsSection>

      <SettingsSection
        rows
        title="How STAGE works"
        description="Replay the onboarding tutorial. Same modal as desktop."
        icon="book-outline"
      >
        <SettingsRow icon="book-outline" title="Open tutorial" onPress={() => setTutorialOpen(true)} />
      </SettingsSection>

      <SettingsSection title={t('settingsPage.languageTitle')} description={t('settingsPage.languageDescription')} icon="globe-outline">
        <SettingsListbox
          flush
          label={t('settingsPage.languageTitle')}
          value={language}
          options={DISPLAY_LANGUAGES.map((lang) => ({
            id: lang.value,
            label: `${lang.flag} ${lang.nativeLabel}`,
            description: lang.label,
            disabled: !lang.enabled,
          }))}
          onChange={(id) => setLanguage(id)}
        />
        <SettingsListbox
          flush
          label="Timezone"
          value={timezone}
          options={[
            ...TIMEZONES.map((zone) => ({ id: zone.value, label: zone.label, description: zone.value })),
            ...(!TIMEZONES.some((zone) => zone.value === timezone) && timezone
              ? [{ id: timezone, label: timezone }]
              : []),
          ]}
          onChange={(id) => setTimezone(id)}
        />
        <Text style={{ color: tokens.muted, fontSize: 12, lineHeight: 16 }}>
          Match times use this timezone. Brussels automatically switches between CET and CEST.
        </Text>
      </SettingsSection>

      <SettingsSection title={t('settingsPage.stgAppTheme')} description={t('settingsPage.stgAppThemeDesc')} icon="color-palette-outline">
        <SegmentedControl
          accessibilityLabel={t('settingsPage.stgAppTheme')}
          options={THEMES.map((item) => ({ key: item.id, label: t(`settingsPage.${item.labelKey}`) }))}
          value={theme}
          onChange={(id) => applyThemeId(id)}
        />

        {theme === 'theme-video' ? (
          <View style={{ marginTop: 6, gap: 12 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '600' }}>{t('settingsPage.stgLiveDarkBgTitle')}</Text>
              <Text style={{ color: tokens.muted, fontSize: 12, lineHeight: 16 }}>{t('settingsPage.stgLiveDarkBgDesc')}</Text>
            </View>
            <SettingsListbox
              flush
              value={liveDarkBg}
              title={t('settingsPage.stgLiveDarkBgTitle')}
              options={LIVE_DARK_BG_OPTIONS.map((opt) => ({
                id: opt.id,
                label: t(`settingsPage.${opt.labelKey}`),
                description: opt.descKey ? t(`settingsPage.${opt.descKey}`) : undefined,
              }))}
              onChange={(id) => {
                setLiveDarkBg(setLiveDarkBgPreference(id));
                refreshTheme();
              }}
            />
            <Text style={{ color: tokens.muted, fontSize: 12, lineHeight: 16 }}>
              {t('settingsPage.stgLiveDarkUploadsDesc', { count: filledUploadCount(liveDarkSlots), max: LIVE_DARK_MAX_UPLOADS })}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {liveDarkSlots.map((src, index) => (
                <Pressable
                  key={`slot-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={src ? `Use upload ${index + 1} as background` : `Upload background ${index + 1}`}
                  onPress={() => (src ? setLiveDarkBg(setLiveDarkBgPreference(`custom-${index}`)) : handleLiveDarkUpload(index))}
                  onLongPress={() => src && (clearLiveDarkUpload(index), setLiveDarkSlots(getLiveDarkUploadSlots()), setLiveDarkBg(getLiveDarkBgPreference()))}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    minHeight: 44,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: liveDarkBg === `custom-${index}` ? tokens.cyan : tokens.border,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: tokens.bgDeep,
                  }}
                >
                  {src ? (
                    <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text numberOfLines={3} style={{ color: tokens.muted, fontSize: 11, textAlign: 'center', paddingHorizontal: 4 }}>
                      {liveDarkUploading ? t('settingsPage.stgLiveDarkUploading') : t('settingsPage.stgLiveDarkSlotEmpty', { n: index + 1 })}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
            <FxStepper
              label={`${t('settingsPage.stgLiveDarkBlur')}: ${Math.round(liveDarkFx.blur)}px`}
              minusLabel="Decrease blur"
              plusLabel="Increase blur"
              onMinus={() => { setLiveDarkFxState(setLiveDarkFx({ blur: liveDarkFx.blur - 2 })); refreshTheme(); }}
              onPlus={() => { setLiveDarkFxState(setLiveDarkFx({ blur: liveDarkFx.blur + 2 })); refreshTheme(); }}
            />
            <FxStepper
              label={`${t('settingsPage.stgLiveDarkOverlay')}: ${Math.round(liveDarkFx.overlay * 100)}%`}
              minusLabel="Decrease overlay"
              plusLabel="Increase overlay"
              onMinus={() => { setLiveDarkFxState(setLiveDarkFx({ overlay: liveDarkFx.overlay - 0.05 })); refreshTheme(); }}
              onPlus={() => { setLiveDarkFxState(setLiveDarkFx({ overlay: liveDarkFx.overlay + 0.05 })); refreshTheme(); }}
            />
          </View>
        ) : null}
      </SettingsSection>

      <SettingsSection title={t('settingsPage.stgAccountSecurity')} description={t('settingsPage.stgAccountSecurityDesc')} icon="lock-closed-outline">
        {biometricAvailable ? (
          <SettingsRow
            icon="finger-print-outline"
            title={bioLabel}
            right={(
              <Toggle
                value={biometricEnabled}
                accessibilityLabel={bioLabel}
                onValueChange={async (next) => {
                  setBiometricEnabledState(next);
                  await setBiometricEnabled(next);
                }}
              />
            )}
          />
        ) : null}
        {!showPasswordForm ? (
          <Button
            variant="secondary"
            icon="key-outline"
            title={t('settingsPage.stgChangePassword')}
            onPress={() => setShowPasswordForm(true)}
          />
        ) : (
          <View style={{ gap: 12 }}>
            <PasswordField label={t('settingsPage.stgCurrentPassword')} value={currentPassword} onChange={setCurrentPassword} placeholder={t('settingsPage.stgEnterCurrentPassword')} visible={showCurrentPass} onToggle={() => setShowCurrentPass((v) => !v)} />
            <PasswordField label={t('settingsPage.stgNewPassword')} value={newPassword} onChange={setNewPassword} placeholder={t('settingsPage.stgEnterNewPassword')} visible={showNewPass} onToggle={() => setShowNewPass((v) => !v)} />
            <PasswordField label={t('settingsPage.stgConfirmPassword')} value={confirmPassword} onChange={setConfirmPassword} placeholder={t('settingsPage.stgConfirmNewPassword')} visible={showConfirmPass} onToggle={() => setShowConfirmPass((v) => !v)} />
            {passwordMessage ? (
              <Text
                accessibilityRole="alert"
                style={{ color: passwordMessage.includes('success') ? tokens.success : tokens.danger, fontSize: 12 }}
              >
                {passwordMessage}
              </Text>
            ) : null}
            <Button
              title={passwordLoading ? t('settingsPage.stgUpdating') : t('settingsPage.stgUpdatePassword')}
              onPress={handleChangePassword}
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
            />
            <Button
              variant="secondary"
              title="Cancel"
              onPress={() => { setShowPasswordForm(false); setPasswordMessage(''); }}
            />
          </View>
        )}
      </SettingsSection>

      <SettingsSection title={t('nav.discord') || 'Community'} description={t('settingsPage.stgCommunityDesc')} icon="logo-discord">
        <Button
          variant="secondary"
          icon="logo-discord"
          title="Join Discord"
          onPress={() => DISCORD_INVITE_URL && Linking.openURL(DISCORD_INVITE_URL)}
        />
      </SettingsSection>

      {NOTIFICATION_CHANNELS.map((channel) => (
        <SettingsSection
          key={channel.key}
          title={channel.label}
          description={channel.description}
          icon={channel.key === 'email' ? 'mail-outline' : channel.key === 'mobile' ? 'phone-portrait-outline' : 'notifications-outline'}
          action={notifSaving ? <Text style={{ color: tokens.muted, fontSize: 11 }}>Saving...</Text> : null}
        >
          {channel.key === 'push' ? (
            <NotificationPushSection
              status={pushStatus}
              busy={pushBusy}
              onToggle={handleTogglePhonePush}
              embedded
            />
          ) : null}
          <NotificationChannelSwitches
            settings={notifSettings}
            channel={channel.key}
            onToggle={handleToggleNotif}
          />
          {channel.key === 'mobile' ? (
            <View style={{ gap: 12 }}>
              <Button
                variant="secondary"
                title="Send all test toasts"
                onPress={() => TEST_TOAST_SAMPLES.forEach((row) => showToast(row.message))}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {TEST_TOAST_SAMPLES.map((row) => (
                  <Chip key={row.key} label={row.label} onPress={() => showToast(row.message)} />
                ))}
              </View>
            </View>
          ) : null}
        </SettingsSection>
      ))}

      <Button
        title={saving ? t('settingsPage.saving') : saved ? t('settingsPage.saved') : t('settingsPage.saveChanges')}
        onPress={handleSave}
        disabled={saving}
      />

      <SettingsGroup>
        <SettingsRow
          danger
          chevron={false}
          icon="log-out-outline"
          title={t('settingsPage.stgSignOut')}
          onPress={async () => {
            await logout();
            router.replace('/auth/loginscreen');
          }}
        />
      </SettingsGroup>

      <SettingsSection title={t('settingsPage.stgDangerZone')} description={t('settingsPage.stgDangerZoneDesc')} icon="warning-outline">
        <Button
          variant="danger"
          icon="trash-outline"
          title={t('settingsPage.stgDeleteAccount')}
          onPress={() => setDeleteOpen(true)}
        />
      </SettingsSection>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: tokens.overlay, justifyContent: 'center', padding: 24 }}
        >
          <Card solid style={{ gap: 12, borderColor: tokens.danger }}>
            <Text numberOfLines={2} style={{ color: tokens.danger, fontWeight: '700', fontSize: 17 }}>
              {t('settingsPage.stgDeleteAccount')}
            </Text>
            <Text style={{ color: tokens.textSoft, fontSize: 14, lineHeight: 20 }}>
              {t('settingsPage.stgDeleteWarning')} {t('settingsPage.stgCannotUndo')}
            </Text>
            <Text style={{ color: tokens.muted, fontSize: 13 }}>{t('settingsPage.stgTypeToConfirm')}</Text>
            <TextField
              value={deleteConfirm}
              onChangeText={setDeleteConfirm}
              placeholder={t('settingsPage.stgTypeDelete')}
              accessibilityLabel={t('settingsPage.stgTypeToConfirm')}
              autoCapitalize="characters"
            />
            <View style={{ gap: 10, marginTop: 4 }}>
              <Button
                variant="secondary"
                title="Cancel"
                onPress={() => { setDeleteOpen(false); setDeleteConfirm(''); }}
              />
              <Button
                variant="danger"
                icon="trash-outline"
                title={deleting ? t('settingsPage.stgDeleting') : t('settingsPage.stgDeleteMyAccount')}
                onPress={handleDelete}
                disabled={deleteConfirm !== 'DELETE' || deleting}
              />
            </View>
          </Card>
        </KeyboardAvoidingView>
      </Modal>
      <TutorialPopup
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        intent={readAccountIntent(user?.id)}
      />
    </Screen>
  );
}
