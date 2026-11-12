import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StatusBar, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { Button, Card, EmptyState, IconButton, Screen, SectionLabel, Toggle } from '@/components/ui';
import ResourceState from '@/components/ui/ResourceState';
import { PageTitle } from '@/components/theme/PageTile';
import useT from '@/hooks/useT';
import useNotificationSettings from '@/hooks/useNotificationSettings';
import { CHANNEL_COLUMNS, isColumnOn, setColumn } from '@/lib/notificationPrefs';
import { NOTIFICATION_SETTINGS } from '@/lib/notificationTypes';
import { syncOneSignalTags } from '@/lib/oneSignal';

const BOX = 44;
const PLAY_SOUND_KEY = 'stage-notif-play-sound';

function CheckCell({ checked, label, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={onPress}
      style={{ width: BOX, height: BOX, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderColor: checked ? tokens.cyan : tokens.borderStrong,
          backgroundColor: checked ? tokens.cyan : 'transparent',
        }}
      >
        {checked ? <Ionicons name="checkmark" size={18} color={tokens.onCyan} /> : null}
      </View>
    </Pressable>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const { data, loading, error, refetch } = useNotificationSettings();
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState('idle');
  const [playSound, setPlaySound] = useState(true);

  useEffect(() => {
    if (data?.settings) setSettings(data.settings);
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(PLAY_SOUND_KEY)
      .then((raw) => {
        if (cancelled || raw == null) return;
        setPlaySound(raw !== '0');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const toggle = (column, key) => {
    setStatus('idle');
    setSettings((prev) => setColumn(prev, column, key, !isColumnOn(prev, column, key)));
  };

  const togglePlaySound = (next) => {
    setPlaySound(next);
    AsyncStorage.setItem(PLAY_SOUND_KEY, next ? '1' : '0').catch(() => {});
  };

  const save = async () => {
    if (!data?.player?.id || !settings) return;
    setStatus('saving');
    try {
      await stageClient.entities.Player.update(data.player.id, { notification_settings: settings });
      syncOneSignalTags(settings);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  const push = data?.push;
  const openPhoneSettings = () => Linking.openSettings();
  const columnLabel = (key) => t(`stage.notifSettings.${key}`);

  return (
    <Screen tabBar={false} style={{ gap: 16 }}>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="arrow-back" accessibilityLabel={t('stage.state.back')} onPress={() => router.back()} />
        <SectionLabel>{t('stage.notifications.title')}</SectionLabel>
        <View style={{ width: 44, height: 44 }} />
      </View>
      <PageTitle title={t('stage.notifSettings.title').toUpperCase()} padded={false} />

      <ResourceState
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={!data?.player}
        empty={<EmptyState icon="person-outline" title={t('stage.notifSettings.noPlayer')} body={t('stage.notifSettings.noPlayerBody')} />}
      >
        {settings ? (
          <>
            <Card style={{ paddingVertical: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 4 }}>
                <Text style={{ flex: 1, color: tokens.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {t('stage.notifSettings.type')}
                </Text>
                {CHANNEL_COLUMNS.map((col) => (
                  <Text
                    key={col.key}
                    style={{ width: BOX + 8, textAlign: 'center', color: tokens.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}
                  >
                    {columnLabel(col.key)}
                  </Text>
                ))}
              </View>
              {NOTIFICATION_SETTINGS.map((row) => (
                <View
                  key={row.key}
                  style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, borderTopWidth: 1, borderTopColor: tokens.border }}
                >
                  <Text style={{ flex: 1, color: tokens.text, fontSize: 15 }}>{t(`stage.notifSettings.cat.${row.key}`)}</Text>
                  {CHANNEL_COLUMNS.map((col) => (
                    <View key={col.key} style={{ width: BOX + 8, alignItems: 'center' }}>
                      <CheckCell
                        checked={isColumnOn(settings, col.key, row.key)}
                        label={`${t(`stage.notifSettings.cat.${row.key}`)}, ${columnLabel(col.key)}`}
                        onPress={() => toggle(col.key, row.key)}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </Card>

            <SectionLabel>{t('stage.notifSettings.sound')}</SectionLabel>
            <Card style={{ paddingVertical: 0 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('stage.notifSettings.soundRow')}
                onPress={openPhoneSettings}
                style={{
                  minHeight: 56,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: tokens.border,
                }}
              >
                <Text style={{ flex: 1, color: tokens.text, fontSize: 15 }}>{t('stage.notifSettings.soundRow')}</Text>
                <Text style={{ color: tokens.muted, fontSize: 14 }}>{t('stage.notifSettings.soundDefault')}</Text>
                <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
              </Pressable>
              <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ flex: 1, color: tokens.text, fontSize: 15 }}>{t('stage.notifSettings.playSound')}</Text>
                <Toggle
                  value={playSound}
                  onValueChange={togglePlaySound}
                  accessibilityLabel={t('stage.notifSettings.playSound')}
                />
              </View>
            </Card>

            {push && !push.configured ? (
              <Text style={{ color: tokens.muted, fontSize: 13 }}>{t('stage.notifSettings.pushNotConfigured')}</Text>
            ) : null}
            {push?.configured && !(push.permission && push.optedIn) ? (
              <Card style={{ borderColor: tokens.warning, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="warning-outline" size={22} color={tokens.warning} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: tokens.text, fontSize: 14 }}>{t('stage.notifSettings.pushOff')}</Text>
                    <Pressable
                      onPress={openPhoneSettings}
                      accessibilityRole="link"
                      accessibilityLabel={t('stage.notifSettings.openSettings')}
                      style={{ minHeight: 44, justifyContent: 'center' }}
                    >
                      <Text style={{ color: tokens.cyan, fontWeight: '700', fontSize: 14 }}>
                        {t('stage.notifSettings.openSettings')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Card>
            ) : null}

            {status === 'error' ? (
              <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 13 }}>
                {t('stage.notifSettings.saveFailed')}
              </Text>
            ) : null}
            <Button
              title={(status === 'saving' ? t('stage.notifSettings.saving') : status === 'saved' ? t('stage.notifSettings.saved') : t('stage.notifSettings.save')).toUpperCase()}
              accessibilityLabel={status === 'saved' ? t('stage.notifSettings.saved') : t('stage.notifSettings.save')}
              disabled={status === 'saving'}
              onPress={save}
            />
          </>
        ) : null}
      </ResourceState>
    </Screen>
  );
}
