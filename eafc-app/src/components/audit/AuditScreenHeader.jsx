import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { IconButton } from '@/components/ui';
import StatusTag from '@/components/competitions/StatusTag';
import useT from '@/hooks/useT';

/** Mockup header: back/close · centered uppercase eyebrow · optional Staff tag. */
export default function AuditScreenHeader({
  title,
  onBack,
  close = false,
  staff = false,
  testID,
}) {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);

  return (
    <View
      testID={testID}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}
    >
      <IconButton
        icon={close ? 'close' : 'arrow-back'}
        accessibilityLabel={close ? t('stage.state.cancel') : t('stage.state.back')}
        onPress={onBack || (() => router.back())}
      />
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          textAlign: 'center',
          color: tokens.muted,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 11 * 0.12,
          textTransform: 'uppercase',
        }}
      >
        {String(title || '').toUpperCase()}
      </Text>
      {staff ? (
        <StatusTag label={t('stage.audit.staff')} tone="info" />
      ) : (
        <View style={{ width: 44 }} />
      )}
    </View>
  );
}
