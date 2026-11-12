import React, { useState } from 'react';
import { RefreshControl, StatusBar, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/store/themeStore';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import {
  Button, Card, EmptyState, IconButton, ResourceState, Screen, SectionLabel,
} from '@/components/ui';
import { PageTitle } from '@/components/theme/PageTile';
import RegistrationWindowCard from '@/components/register/RegistrationWindowCard';
import useSeasonRegistration from '@/hooks/useSeasonRegistration';
import useT from '@/hooks/useT';
import { applicationFor } from '@/lib/seasonRegistration';

/** Season registration: the published regional windows and what my club can do on each. */
export default function SeasonRegisterScreen() {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { data, loading, error, refreshing, refetch } = useSeasonRegistration();
  const [done, setDone] = useState(false);

  const windows = data?.windows || [];
  const readiness = data?.readiness || null;
  const club = data?.club || null;
  const canManage = Boolean(readiness?.can_manage_registration);
  const registrarOk = readiness?.registrar_status === 'eligible';
  const minPlayers = readiness?.minimum_players || 3;
  const eligibleCount = readiness?.eligible_count ?? 0;

  const onChanged = async () => {
    setDone(true);
    await refetch();
  };

  return (
    <Screen
      tabBar={false}
      scroll={!loading}
      style={{ paddingBottom: guideFabClearanceStack(insets.bottom) }}
      keyboardAvoiding
      refreshControl={loading ? undefined : (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setDone(false); refetch(); }}
          tintColor={tokens.cyan}
          colors={[tokens.cyan]}
        />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <IconButton icon="arrow-back" accessibilityLabel={t('stage.state.back')} onPress={() => router.back()} />
        <SectionLabel>{t('stage.register.title')}</SectionLabel>
        {canManage ? (
          <View
            style={{
              height: 32,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: tokens.border,
              backgroundColor: tokens.card,
              paddingHorizontal: 12,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: tokens.cyan, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {t('stage.register.president')}
            </Text>
          </View>
        ) : <View style={{ width: 44, height: 44 }} />}
      </View>
      <PageTitle title={t('stage.register.subtitle')} padded={false} />

      <View style={{ gap: 14 }}>
        <ResourceState loading={loading && !data} error={data ? null : error} onRetry={refetch}>
          {!club ? (
            <Card>
              <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>{t('stage.register.noClub')}</Text>
            </Card>
          ) : null}

          {club && !readiness ? (
            <Card>
              <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>
                {data?.accessNote || t('stage.register.notPresident')}
              </Text>
            </Card>
          ) : null}

          {readiness ? (
            <Card style={{ gap: 8 }}>
              <Text style={{ color: tokens.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                {t('stage.register.myClub')}
              </Text>
              <Text style={{ color: tokens.text, fontSize: 17, fontWeight: '700' }}>{readiness.club?.name}</Text>
              <Text style={{ color: tokens.textSoft, fontSize: 13 }}>
                {t('stage.register.eligibleLine', { eligible: eligibleCount, min: minPlayers })}
              </Text>
              {eligibleCount < minPlayers ? (
                <Text style={{ color: tokens.warning, fontSize: 13, lineHeight: 19 }}>
                  {t('stage.register.insufficient', { eligible: eligibleCount, min: minPlayers })}
                </Text>
              ) : null}
              {!canManage ? (
                <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 19 }}>{t('stage.register.notPresident')}</Text>
              ) : null}
            </Card>
          ) : null}

          {readiness && canManage && !registrarOk ? (
            <Card style={{ gap: 12 }}>
              <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>{t('stage.register.plusTitle')}</Text>
              <Text style={{ color: tokens.textSoft, fontSize: 14, lineHeight: 20 }}>{t('stage.register.plusBody')}</Text>
              <Button
                title={t('stage.register.openStore')}
                variant="secondary"
                icon="storefront-outline"
                onPress={() => router.push('/apps/store')}
              />
            </Card>
          ) : null}

          {done && !error ? (
            <Text accessibilityRole="alert" style={{ color: tokens.success, fontSize: 13 }}>
              {t('stage.register.done')}
            </Text>
          ) : null}

          {windows.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title={t('stage.register.noWindows')}
              testID="register-empty"
            />
          ) : windows.map((window) => (
            <RegistrationWindowCard
              key={window.id}
              window={window}
              application={applicationFor(readiness, window)}
              readiness={readiness}
              clubId={club?.id || null}
              onChanged={onChanged}
              onOpenCompetitions={() => router.push('/apps/competitions')}
            />
          ))}
        </ResourceState>
      </View>
    </Screen>
  );
}
