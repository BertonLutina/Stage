import React, { useEffect, useState } from 'react';
import { Linking, Pressable, RefreshControl, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import {
  Avatar, Button, Card, ResourceState, Screen, SectionLabel,
} from '@/components/ui';
import StatusTag from '@/components/competitions/StatusTag';
import AuditScreenHeader from '@/components/audit/AuditScreenHeader';
import StickyCtaBar from '@/components/audit/StickyCtaBar';
import useTournamentRegister from '@/hooks/useTournamentRegister';
import useT from '@/hooks/useT';
import {
  submitTournamentRegistration,
  withdrawTournamentRegistration,
} from '@/lib/tournamentRegister';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageTitle } from '@/components/theme/PageTile';

export default function TournamentRegisterScreen() {
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { data, loading, error, refreshing, refetch } = useTournamentRegister();
  const [selected, setSelected] = useState(() => new Set());
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState('');
  const [done, setDone] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    if (!data) return;
    setSelected(new Set(data.selectedSlotIds || []));
    setAccepted(false);
  }, [data?.tournament?.id, data?.selectedSlotIds]);

  const toggleSlot = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const register = async () => {
    if (!data?.tournament?.id || !data?.club?.id) return;
    if (!accepted) {
      setActionError(t('stage.tournamentRegister.acceptRequired'));
      return;
    }
    setBusy('register');
    setActionError('');
    setDone('');
    try {
      await submitTournamentRegistration({
        tournamentId: data.tournament.id,
        clubId: data.club.id,
        slotIds: [...selected],
        rulesAccepted: true,
        rulesTemplateId: data.rules?.templateId || null,
        tournament: data.tournament,
      });
      setDone(t('stage.tournamentRegister.done'));
      await refetch();
    } catch (err) {
      setActionError(err?.message || t('stage.state.error'));
    } finally {
      setBusy(null);
    }
  };

  const withdraw = async () => {
    if (!data?.tournament?.id || !data?.club?.id) return;
    setBusy('withdraw');
    setActionError('');
    try {
      await withdrawTournamentRegistration(data.tournament.id, data.club.id);
      setDone(t('stage.tournamentRegister.withdrawn'));
      await refetch();
    } catch (err) {
      setActionError(err?.message || t('stage.state.error'));
    } finally {
      setBusy(null);
    }
  };

  const statusTone = data?.clubPending
    ? 'warning'
    : data?.clubEntered
      ? 'success'
      : data?.open
        ? 'success'
        : 'warning';
  const statusLabel = data?.clubPending
    ? t('stage.tournamentRegister.pending')
    : data?.clubEntered
      ? t('stage.tournamentRegister.registered')
      : data?.full
        ? t('stage.tournamentRegister.full')
        : data?.open
          ? t('stage.tournamentRegister.open')
          : t('stage.tournamentRegister.closed');

  return (
    <Screen
      tabBar={false}
      guideFab
      scroll={!loading}
      style={{ paddingBottom: guideFabClearanceStack(insets.bottom) + 100 }}
      refreshControl={loading ? undefined : (
        <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} colors={[tokens.cyan]} />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <AuditScreenHeader title={t('stage.tournamentRegister.eyebrow')} />

      <ResourceState loading={loading && !data} error={data ? null : error} onRetry={refetch}>
        {data ? (
          <View style={{ gap: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{
                width: 52, height: 52, borderRadius: 26, backgroundColor: tokens.border,
                alignItems: 'center', justifyContent: 'center',
              }}
              >
                <Ionicons name="trophy-outline" size={22} color={tokens.cyan} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <PageTitle title={String(data.tournament.name || '—').toUpperCase()} padded={false} />
                <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 3 }}>{data.metaLine}</Text>
              </View>
              <StatusTag label={String(statusLabel || '').toUpperCase()} tone={statusTone} />
            </View>

            <Card style={{ gap: 10, paddingVertical: 12 }}>
              <SectionLabel>{t('stage.tournamentRegister.club')}</SectionLabel>
              {data.club ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar initials={data.clubInitials} size={44} round />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: tokens.text, fontWeight: '700' }} numberOfLines={1}>{data.club.name}</Text>
                    <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>
                      {data.isPresident ? t('stage.tournamentRegister.youArePresident') : t('stage.tournamentRegister.notPresident')}
                    </Text>
                  </View>
                  {data.isPresident ? (
                    <Ionicons name="checkmark" size={22} color={tokens.success} />
                  ) : null}
                </View>
              ) : (
                <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>
                  {t('stage.tournamentRegister.needClub')}
                </Text>
              )}
            </Card>

            {(data.slots || []).length > 0 ? (
              <Card style={{ gap: 10, paddingVertical: 12 }}>
                <SectionLabel right={(
                  <Text style={{ color: tokens.muted, fontSize: 12 }}>
                    {t('stage.tournamentRegister.selectedCount', { count: selected.size })}
                  </Text>
                )}
                >
                  {t('stage.tournamentRegister.yourSlots')}
                </SectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {data.slots.map((slot) => {
                    const on = selected.has(slot.id);
                    return (
                      <Pressable
                        key={slot.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        disabled={!data.canRegister}
                        onPress={() => toggleSlot(slot.id)}
                        style={{
                          width: '23%',
                          minWidth: 72,
                          flexGrow: 1,
                          height: 40,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: on ? tokens.cyan : tokens.border,
                          backgroundColor: on ? tokens.cyan : tokens.bgDeep,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 4,
                        }}
                      >
                        <Text numberOfLines={1} style={{ color: on ? tokens.onCyan : tokens.textSoft, fontSize: 12, fontWeight: '600' }}>
                          {slot.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
            ) : null}

            <Card style={{ gap: 10, paddingVertical: 12 }}>
              <SectionLabel right={(
                <Pressable onPress={() => setRulesOpen((v) => !v)} accessibilityRole="button">
                  <Text style={{ color: tokens.cyan, fontSize: 12, fontWeight: '600' }}>
                    {t('stage.tournamentRegister.readAll')}
                  </Text>
                </Pressable>
              )}
              >
                {data.rulesRevision
                  ? t('stage.tournamentRegister.rulesRev', { rev: data.rulesRevision })
                  : t('stage.tournamentRegister.rules')}
              </SectionLabel>
              <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 20 }} numberOfLines={rulesOpen ? undefined : 3}>
                {data.rules?.body || t('stage.tournamentRegister.noRules')}
              </Text>
              {data.rules?.rulesFileUrl ? (
                <Pressable onPress={() => Linking.openURL(data.rules.rulesFileUrl)} accessibilityRole="link">
                  <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '600' }}>{data.rules.fileLabel}</Text>
                </Pressable>
              ) : null}
              {data.canRegister ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: accepted }}
                  accessibilityLabel={t('stage.tournamentRegister.accept')}
                  onPress={() => setAccepted((v) => !v)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
                >
                  <View style={{
                    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
                    borderColor: accepted ? tokens.cyan : tokens.borderStrong || tokens.border,
                    backgroundColor: accepted ? tokens.cyan : 'transparent',
                  }}
                  />
                  <Text style={{ flex: 1, color: tokens.text, fontSize: 13 }}>{t('stage.tournamentRegister.accept')}</Text>
                </Pressable>
              ) : null}
            </Card>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Ionicons name="information-circle-outline" size={16} color={tokens.muted} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, color: tokens.muted, fontSize: 12, lineHeight: 18 }}>
                {t('stage.tournamentRegister.reviewHint')}
              </Text>
            </View>

            {!data.isPresident && !data.playerTournament ? (
              <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 19 }}>
                {t('stage.tournamentRegister.askPresident')}
              </Text>
            ) : null}

            {actionError ? <Text style={{ color: tokens.danger, fontSize: 13 }}>{actionError}</Text> : null}
            {done ? <Text style={{ color: tokens.success, fontSize: 13 }}>{done}</Text> : null}
          </View>
        ) : null}
      </ResourceState>

      {data?.canRegister ? (
        <StickyCtaBar testID="tournament-register-cta">
          <Button
            title={t('stage.tournamentRegister.register')}
            loading={busy === 'register'}
            disabled={Boolean(busy) || !accepted}
            onPress={register}
          />
        </StickyCtaBar>
      ) : null}

      {data?.clubEntered && data?.isPresident && data?.tournament?.status === 'registration' ? (
        <StickyCtaBar testID="tournament-withdraw-cta">
          <Button
            title={t('stage.tournamentRegister.withdraw')}
            variant="secondary"
            loading={busy === 'withdraw'}
            disabled={Boolean(busy)}
            onPress={withdraw}
          />
        </StickyCtaBar>
      ) : null}
    </Screen>
  );
}
