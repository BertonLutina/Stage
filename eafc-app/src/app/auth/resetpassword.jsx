import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import useT from '@/hooks/useT';
import useAsyncResource from '@/hooks/useAsyncResource';
import { Button, Card, Screen, TextField } from '@/components/ui';
import ResourceState from '@/components/ui/ResourceState';
import AuthHeader from '@/components/auth/AuthHeader';

const MIN_LENGTH = 8;

function firstParam(value) {
  return String(Array.isArray(value) ? value[0] : value || '').trim();
}

function PasswordInput({ label, value, onChange, error, visible, onToggle, showLabel, hideLabel }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={onChange}
      error={error}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      right={(
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={visible ? hideLabel : showLabel}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={tokens.muted} />
        </Pressable>
      )}
    />
  );
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const token = firstParam(params?.token);

  const check = useAsyncResource(async () => {
    if (!token) return { valid: false };
    const res = await stageClient.http.get('/auth/reset-password', { token });
    return { valid: Boolean(res?.valid) };
  }, [token]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [problem, setProblem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [rejected, setRejected] = useState(false);

  const save = async () => {
    setProblem(null);
    if (password.length < MIN_LENGTH) {
      setProblem({ field: 'password', text: t('stage.forgot.tooShort') });
      return;
    }
    if (password !== confirm) {
      setProblem({ field: 'confirm', text: t('stage.forgot.mismatch') });
      return;
    }
    setSaving(true);
    try {
      await stageClient.http.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      if (err?.status === 400 && /invalid_token/.test(String(err?.message || ''))) setRejected(true);
      else setProblem({ field: 'form', text: t('stage.forgot.resetFailed') });
    } finally {
      setSaving(false);
    }
  };

  const invalid = rejected || (check.data && !check.data.valid);

  const invalidCard = (
    <Card style={{ gap: 12 }}>
      <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>{t('stage.forgot.invalidTitle')}</Text>
      <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 19 }}>{t('stage.forgot.invalidBody')}</Text>
      <Button
        title={t('stage.forgot.requestNew')}
        onPress={() => router.replace('/auth/forgotpassword')}
      />
    </Card>
  );

  return (
    <Screen keyboardAvoiding tabBar={false}>
      <View style={{ flexGrow: 1, gap: 20 }}>
        <AuthHeader title={t('stage.forgot.resetTitle')} subtitle={done || invalid ? undefined : t('stage.forgot.resetIntro')} />

        <ResourceState loading={check.loading} error={check.error} onRetry={check.refetch}>
          {done ? (
            <Card style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <Ionicons name="checkmark-circle-outline" size={22} color={tokens.success} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>{t('stage.forgot.doneTitle')}</Text>
                  <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 19 }}>{t('stage.forgot.doneBody')}</Text>
                </View>
              </View>
              <Button
                title={t('stage.forgot.signIn')}
                onPress={() => router.replace('/auth/loginscreen')}
              />
            </Card>
          ) : invalid ? invalidCard : (
            <View style={{ gap: 16 }}>
              <PasswordInput
                label={t('stage.forgot.newPassword')}
                value={password}
                onChange={(v) => { setPassword(v); setProblem(null); }}
                error={problem?.field === 'password' ? problem.text : null}
                visible={show}
                onToggle={() => setShow((v) => !v)}
                showLabel={t('stage.forgot.show')}
                hideLabel={t('stage.forgot.hide')}
              />
              <PasswordInput
                label={t('stage.forgot.confirmPassword')}
                value={confirm}
                onChange={(v) => { setConfirm(v); setProblem(null); }}
                error={problem?.field === 'confirm' ? problem.text : null}
                visible={show}
                onToggle={() => setShow((v) => !v)}
                showLabel={t('stage.forgot.show')}
                hideLabel={t('stage.forgot.hide')}
              />
              {problem?.field === 'form' ? (
                <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 13 }}>{problem.text}</Text>
              ) : null}
              <Button
                title={saving ? t('stage.forgot.saving') : t('stage.forgot.savePassword')}
                accessibilityLabel={t('stage.forgot.savePassword')}
                loading={saving}
                onPress={save}
              />
            </View>
          )}
        </ResourceState>
      </View>
    </Screen>
  );
}
