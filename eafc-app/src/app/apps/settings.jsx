import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, Pressable, Modal, KeyboardAvoidingView, Platform,
  StatusBar, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { stageClient, resolveMyPlayerAndClub } from '@/api/stageClient';
import useAuthStore from '@/store/authStore';
import { createTranslator } from '@/translations';
import { DISPLAY_LANGUAGES } from '@/lib/languages';
import { localStorage } from '@/lib/polyfillStorage';
import { mergeLoaded, isColumnOn, setColumn } from '@/lib/notificationPrefs';
import {
  getNativePushStatus,
  setNativePushEnabled,
  syncOneSignalTags,
} from '@/lib/oneSignal';
import NotificationPushSection from '@/components/settings/NotificationPushSection';
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
import { OptionsBottomSheet } from '@/components/settings/SettingsListbox';
import AccountRoleUpgradeSection from '@/components/settings/AccountRoleUpgradeSection';
import TutorialPopup from '@/components/onboarding/TutorialPopup';
import {
  Button, Card, IconButton, Screen, SectionLabel, TextField, Toggle,
} from '@/components/ui';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { DASHBOARD_LAYOUTS } from '@/lib/dashboardLayouts';
import useDashboardLayoutStore from '@/store/dashboardLayoutStore';
import useThemeStore from '@/store/themeStore';
import { formatPlatformLabel, platformFamily } from '@/lib/platformDisplay';

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

const QUICK_NOTIFS = [
  { key: 'match_reminders', labelKey: 'matchReminders' },
  { key: 'contract_offers', labelKey: 'contractOffers' },
  { key: 'messages', labelKey: 'clubMail' },
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

function linkedAccountLabel(platform) {
  const family = platformFamily(platform);
  if (family === 'PlayStation') return 'PSN';
  if (family === 'Xbox') return 'Xbox';
  if (family === 'PC') return 'PC';
  return formatPlatformLabel(platform) || '';
}

/** Password input with a show/hide button. */
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

export default function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const tokens = useThemeStore((s) => s.tokens);
  const stageId = useThemeStore((s) => s.stageId);
  const setStageTheme = useThemeStore((s) => s.setStageTheme);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || 'en');
  const translate = useMemo(() => createTranslator(language), [language]);
  const t = useCallback((path, vars) => interpolate(translate(path, path), vars), [translate]);

  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState(detectTimezone);
  const [player, setPlayer] = useState(null);
  const [notifSettings, setNotifSettings] = useState(() => mergeLoaded(null));
  const [notifSaving, setNotifSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState({ configured: false, permission: false, optedIn: false });
  const [pushBusy, setPushBusy] = useState(false);
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
  const [layoutSheetOpen, setLayoutSheetOpen] = useState(false);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const [timezoneSheetOpen, setTimezoneSheetOpen] = useState(false);
  const homeLayout = useDashboardLayoutStore((s) => s.layout);
  const setHomeLayout = useDashboardLayoutStore((s) => s.setLayout);
  const initializeHomeLayout = useDashboardLayoutStore((s) => s.initialize);

  useEffect(() => {
    initializeHomeLayout();
  }, [initializeHomeLayout]);

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
        const p = resolved?.player || null;
        setPlayer(p);
        const settings = mergeLoaded(p?.notification_settings);
        setNotifSettings(settings);
        syncOneSignalTags(settings);
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

  const liveDarkOn = stageId === 'theme-video';
  const layoutMeta = DASHBOARD_LAYOUTS.find((item) => item.id === homeLayout) || DASHBOARD_LAYOUTS[0];
  const languageMeta = DISPLAY_LANGUAGES.find((lang) => lang.value === language);
  const languageLabel = languageMeta?.nativeLabel || language;
  const linkedLabel = linkedAccountLabel(player?.platform) || t('stage.settingsHub.noneLinked');

  const persistLanguage = async (next) => {
    setLanguage(next);
    localStorage.setItem(LANGUAGE_KEY, next);
    try {
      await stageClient.auth.updateMe({ language: next });
    } catch {
      /* keep local choice */
    }
  };

  const persistTimezone = async (next) => {
    setTimezone(next);
    try {
      await stageClient.auth.updateTimezone(next);
    } catch {
      /* keep local choice */
    }
  };

  const toggleLiveDark = (on) => {
    setStageTheme(on ? 'theme-video' : 'theme-dark');
  };

  const toggleNotif = async (categoryKey, value) => {
    const updated = setColumn(notifSettings, 'inApp', categoryKey, value);
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
    <Screen tabBar={false} keyboardAvoiding style={{ gap: 20 }}>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <IconButton icon="chevron-back" accessibilityLabel="Back" onPress={() => router.back()} />
        <SectionLabel>{t('stage.settingsHub.eyebrow')}</SectionLabel>
        <View style={{ width: 44, height: 44 }} />
      </View>

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

      <AccountRoleUpgradeSection t={t} />

      <SettingsSection rows title={t('stage.settingsHub.appearance')}>
        <SettingsRow
          title={t('stage.settingsHub.liveDark')}
          chevron={false}
          right={(
            <Toggle
              value={liveDarkOn}
              accessibilityLabel={t('stage.settingsHub.liveDark')}
              onValueChange={toggleLiveDark}
            />
          )}
        />
        <SettingsRow
          title={t('stage.settingsHub.homeLayout')}
          value={layoutMeta?.name}
          onPress={() => setLayoutSheetOpen(true)}
        />
        <SettingsRow
          title={t('stage.settingsHub.language')}
          value={languageLabel}
          onPress={() => setLanguageSheetOpen(true)}
        />
      </SettingsSection>

      <SettingsSection
        rows
        title={t('stage.settingsHub.notifications')}
        action={notifSaving ? <Text style={{ color: tokens.muted, fontSize: 11 }}>Saving...</Text> : null}
      >
        {QUICK_NOTIFS.map((row) => (
          <SettingsRow
            key={row.key}
            title={t(`stage.settingsHub.${row.labelKey}`)}
            chevron={false}
            right={(
              <Toggle
                value={isColumnOn(notifSettings, 'inApp', row.key)}
                accessibilityLabel={`${t(`stage.settingsHub.${row.labelKey}`)}, in-app`}
                onValueChange={(next) => toggleNotif(row.key, next)}
              />
            )}
          />
        ))}
      </SettingsSection>

      <SettingsSection rows title={t('stage.settingsHub.account')}>
        <SettingsRow
          title={t('stage.settingsHub.editProfile')}
          onPress={() => router.push('/(tabs)/profile/editprofilescreen')}
        />
        <SettingsRow
          title={t('stage.settingsHub.linkedAccounts')}
          value={linkedLabel}
          onPress={() => router.push('/(tabs)/profile/editprofilescreen')}
        />
        <SettingsRow
          danger
          chevron={false}
          icon="log-out-outline"
          title={t('stage.settingsHub.signOut')}
          onPress={async () => {
            await logout();
            router.replace('/auth/loginscreen');
          }}
        />
      </SettingsSection>

      <SettingsSection rows title={t('stage.settingsHub.more')}>
        <SettingsRow
          title={t('stage.settingsLinks.appearance')}
          onPress={() => router.push('/apps/appearance')}
        />
        <SettingsRow
          title={t('stage.notifications.settings')}
          onPress={() => router.push('/apps/notification-settings')}
        />
        <SettingsRow icon="bag-outline" title="Store" onPress={() => router.push('/apps/store')} />
        <SettingsRow icon="wallet-outline" title="Wallet" onPress={() => router.push('/apps/wallet')} />
        <SettingsRow icon="book-outline" title="Open tutorial" onPress={() => setTutorialOpen(true)} />
        <SettingsRow
          title="Timezone"
          value={TIMEZONES.find((z) => z.value === timezone)?.label || timezone}
          onPress={() => setTimezoneSheetOpen(true)}
        />
        {biometricAvailable ? (
          <SettingsRow
            icon="finger-print-outline"
            title={bioLabel}
            chevron={false}
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
      </SettingsSection>

      <SettingsSection title={t('settingsPage.stgAccountSecurity')} description={t('settingsPage.stgAccountSecurityDesc')} icon="lock-closed-outline">
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

      <NotificationPushSection status={pushStatus} busy={pushBusy} onToggle={handleTogglePhonePush} />

      <SettingsSection title={t('settingsPage.stgDangerZone')} description={t('settingsPage.stgDangerZoneDesc')} icon="warning-outline">
        <Button
          variant="danger"
          icon="trash-outline"
          title={t('settingsPage.stgDeleteAccount')}
          onPress={() => setDeleteOpen(true)}
        />
      </SettingsSection>

      <OptionsBottomSheet
        visible={layoutSheetOpen}
        title={t('stage.settingsHub.homeLayout')}
        options={DASHBOARD_LAYOUTS.map((item) => ({ id: item.id, label: item.name, description: item.blurb }))}
        selectedId={homeLayout}
        onClose={() => setLayoutSheetOpen(false)}
        onSelect={(id) => { setHomeLayout(id); setLayoutSheetOpen(false); }}
      />
      <OptionsBottomSheet
        visible={languageSheetOpen}
        title={t('stage.settingsHub.language')}
        options={DISPLAY_LANGUAGES.map((lang) => ({
          id: lang.value,
          label: lang.nativeLabel,
          description: lang.label,
          disabled: !lang.enabled,
        }))}
        selectedId={language}
        onClose={() => setLanguageSheetOpen(false)}
        onSelect={(id) => { persistLanguage(id); setLanguageSheetOpen(false); }}
      />
      <OptionsBottomSheet
        visible={timezoneSheetOpen}
        title="Timezone"
        options={[
          ...TIMEZONES.map((zone) => ({ id: zone.value, label: zone.label, description: zone.value })),
          ...(!TIMEZONES.some((zone) => zone.value === timezone) && timezone
            ? [{ id: timezone, label: timezone }]
            : []),
        ]}
        selectedId={timezone}
        onClose={() => setTimezoneSheetOpen(false)}
        onSelect={(id) => { persistTimezone(id); setTimezoneSheetOpen(false); }}
      />

      <TutorialPopup open={tutorialOpen} onClose={() => setTutorialOpen(false)} />

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: tokens.overlay, justifyContent: 'center', padding: 24 }}>
            <Card solid style={{ gap: 12, borderColor: tokens.danger }}>
              <Text numberOfLines={2} style={{ color: tokens.danger, fontWeight: '700', fontSize: 17 }}>
                {t('settingsPage.stgDeleteAccount')}
              </Text>
              <Text style={{ color: tokens.textSoft, fontSize: 14, lineHeight: 20 }}>
                {t('settingsPage.stgDeleteWarning')}
              </Text>
              <Text style={{ color: tokens.muted, fontSize: 13 }}>{t('settingsPage.stgTypeToConfirm')}</Text>
              <TextField
                label={t('settingsPage.stgTypeDelete')}
                value={deleteConfirm}
                onChangeText={setDeleteConfirm}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Button
                variant="danger"
                icon="trash-outline"
                title={deleting ? t('settingsPage.stgDeleting') : t('settingsPage.stgDeleteMyAccount')}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                onPress={handleDelete}
              />
              <Button
                variant="secondary"
                title="Cancel"
                onPress={() => { setDeleteOpen(false); setDeleteConfirm(''); }}
              />
            </Card>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
