import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import useT from '@/hooks/useT';
import { Button, Card, Screen, TextField } from '@/components/ui';
import AuthHeader from '@/components/auth/AuthHeader';

const RESEND_SECONDS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clock(total) {
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const send = async () => {
    const identifier = email.trim();
    if (!EMAIL_RE.test(identifier)) {
      setFieldError(t('stage.forgot.invalidEmail'));
      return;
    }
    setFieldError(null);
    setFailed(false);
    setSending(true);
    try {
      await stageClient.http.post('/auth/forgot-password', { identifier });
      setSent(true);
      setRemaining(RESEND_SECONDS);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen keyboardAvoiding tabBar={false}>
      <View style={{ flexGrow: 1, gap: 20 }}>
        <AuthHeader title={t('stage.forgot.title')} subtitle={t('stage.forgot.intro')} />

        <TextField
          label={t('stage.forgot.emailLabel')}
          value={email}
          onChangeText={(v) => { setEmail(v); setFieldError(null); }}
          error={fieldError}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder={t('stage.forgot.emailPlaceholder')}
        />
        {failed ? (
          <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 13 }}>{t('stage.forgot.failed')}</Text>
        ) : null}

        <Button
          title={sending ? t('stage.forgot.sending') : t('stage.forgot.send')}
          accessibilityLabel={t('stage.forgot.send')}
          loading={sending}
          onPress={send}
        />

        {sent ? (
          <>
            <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <Ionicons name="mail-outline" size={22} color={tokens.success} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>{t('stage.forgot.sentTitle')}</Text>
                <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 19 }}>{t('stage.forgot.sentBody')}</Text>
              </View>
            </Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
              <Text style={{ color: tokens.muted, fontSize: 13 }}>{t('stage.forgot.noEmail')}</Text>
              {remaining > 0 ? (
                <Text style={{ color: tokens.textSoft, fontSize: 13, fontWeight: '700' }}>
                  {t('stage.forgot.resendIn', { time: clock(remaining) })}
                </Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('stage.forgot.resend')}
                  onPress={send}
                  disabled={sending}
                  style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
                >
                  <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '700' }}>{t('stage.forgot.resend')}</Text>
                </Pressable>
              )}
            </View>
          </>
        ) : null}

        <Pressable
          onPress={() => router.replace('/auth/loginscreen')}
          accessibilityRole="link"
          accessibilityLabel={t('stage.forgot.signIn')}
          style={{ marginTop: 'auto', minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: tokens.muted, fontSize: 14, textAlign: 'center' }}>
            {t('stage.forgot.remembered')}{' '}
            <Text style={{ color: tokens.cyan, fontWeight: '600' }}>{t('stage.forgot.signIn')}</Text>
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
