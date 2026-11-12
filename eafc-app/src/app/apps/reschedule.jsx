import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StatusBar, Text, View } from 'react-native';
import useThemeStore from '@/store/themeStore';
import {
  Button, Card, ResourceState, Screen, SectionLabel,
} from '@/components/ui';
import StatusTag from '@/components/competitions/StatusTag';
import AuditScreenHeader from '@/components/audit/AuditScreenHeader';
import StickyCtaBar from '@/components/audit/StickyCtaBar';
import SuccessButton from '@/components/audit/SuccessButton';
import useOfficialReschedule from '@/hooks/useOfficialReschedule';
import useT from '@/hooks/useT';
import { postOfficialReschedule } from '@/lib/officialReschedule';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function plannedLabel(match) {
  if (!match?.scheduled_date) return '';
  const d = new Date(match.scheduled_date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    weekday: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function RescheduleScreen() {
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { data, loading, error, refreshing, refetch } = useOfficialReschedule();
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState('');
  const [done, setDone] = useState('');

  const selected = useMemo(
    () => (data?.slots || []).find((s) => s.id === selectedSlotId) || null,
    [data?.slots, selectedSlotId],
  );

  const opponent = data?.opponent
    || (data?.club && data?.match
      ? (String(data.match.home_club_id) === String(data.club.id)
        ? data.match.away_club_name
        : data.match.home_club_name)
      : '—');

  const canAct = Boolean(data?.staff && data?.available && data?.club?.id);

  const run = async (action, extra = {}) => {
    if (!data?.match?.id || !data?.club?.id) return;
    setBusy(action);
    setActionError('');
    setDone('');
    try {
      await postOfficialReschedule(data.match.id, {
        action,
        club_id: data.club.id,
        engine_fixture_id: data.match.source_fixture_id || null,
        ...extra,
      });
      setDone(t('stage.reschedule.done'));
      await refetch();
    } catch (err) {
      setActionError(err?.message || t('stage.state.error'));
    } finally {
      setBusy(null);
    }
  };

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
      <AuditScreenHeader title={t('stage.reschedule.title')} staff />

      <ResourceState loading={loading && !data} error={data ? null : error} onRetry={refetch}>
        {data ? (
          <View style={{ gap: 12 }}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
                  vs {opponent || '—'}
                </Text>
                <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 3 }} numberOfLines={2}>
                  {[
                    plannedLabel(data.match) ? t('stage.reschedule.planned', { when: plannedLabel(data.match) }) : null,
                    data.match?.competition_context,
                  ].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {data.windowLabel || data.windowEndsAt ? (
                <StatusTag
                  label={data.windowLabel || t('stage.reschedule.windowOpen')}
                  tone="warning"
                />
              ) : null}
            </Card>

            {!data.available ? (
              <Card>
                <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>
                  {t('stage.reschedule.unavailable')}
                </Text>
              </Card>
            ) : null}

            {data.pendingProposal ? (
              <Card style={{ gap: 10, borderColor: tokens.cyan, paddingVertical: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Text style={{
                    color: tokens.cyan, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase',
                  }}
                  >
                    {t('stage.reschedule.theyPropose', { club: data.pendingProposal.from })}
                  </Text>
                  {data.pendingProposal.when ? (
                    <Text style={{ color: tokens.muted, fontSize: 12 }}>{data.pendingProposal.when}</Text>
                  ) : null}
                </View>
                <Text style={{ color: tokens.text, fontSize: 26, fontWeight: '800', textTransform: 'uppercase' }}>
                  {data.pendingProposal.label}
                </Text>
                {canAct ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <SuccessButton
                        title={t('stage.reschedule.accept')}
                        loading={busy === 'accept'}
                        disabled={Boolean(busy)}
                        onPress={() => run('accept', { proposal_id: data.pendingProposal.id })}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        title={t('stage.reschedule.decline')}
                        variant="danger"
                        loading={busy === 'decline'}
                        disabled={Boolean(busy)}
                        onPress={() => run('decline', { proposal_id: data.pendingProposal.id })}
                      />
                    </View>
                  </View>
                ) : null}
              </Card>
            ) : null}

            <SectionLabel right={<Text style={{ color: tokens.muted, fontSize: 12 }}>{t('stage.reschedule.withinWindow')}</Text>}>
              {t('stage.reschedule.orPropose')}
            </SectionLabel>

            {(data.slots || []).length === 0 && data.available ? (
              <Card>
                <Text style={{ color: tokens.muted, fontSize: 14 }}>{t('stage.reschedule.noSlots')}</Text>
              </Card>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(data.slots || []).map((slot) => {
                  const on = selectedSlotId === slot.id;
                  return (
                    <Pressable
                      key={slot.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={slot.label}
                      disabled={!canAct}
                      onPress={() => setSelectedSlotId(slot.id)}
                      style={{
                        width: '31.5%',
                        minWidth: 100,
                        flexGrow: 1,
                        height: 44,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: on ? tokens.cyan : tokens.border,
                        backgroundColor: on ? tokens.cyan : tokens.bgDeep,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 6,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: on ? tokens.onCyan : tokens.textSoft,
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {slot.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {(data.history || []).length > 0 ? (
              <View style={{ gap: 4, marginTop: 2 }}>
                <SectionLabel>{t('stage.reschedule.history')}</SectionLabel>
                {data.history.map((ev, index) => (
                  <View
                    key={ev.id}
                    style={{
                      flexDirection: 'row',
                      gap: 10,
                      paddingVertical: 9,
                      borderBottomWidth: index === data.history.length - 1 ? 0 : 1,
                      borderBottomColor: tokens.border,
                    }}
                  >
                    <View style={{
                      width: 8, height: 8, borderRadius: 4, marginTop: 6,
                      backgroundColor: ev.tone === 'danger' ? tokens.danger : tokens.cyan,
                    }}
                    />
                    <Text style={{ flex: 1, color: tokens.text, fontSize: 13 }}>{ev.text}</Text>
                    {ev.when ? <Text style={{ color: tokens.muted, fontSize: 12 }}>{ev.when}</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}

            {!data.staff ? (
              <Text style={{ color: tokens.muted, fontSize: 13 }}>{t('stage.reschedule.readOnly')}</Text>
            ) : null}
            {actionError ? <Text style={{ color: tokens.danger, fontSize: 13 }}>{actionError}</Text> : null}
            {done ? <Text style={{ color: tokens.success, fontSize: 13 }}>{done}</Text> : null}
          </View>
        ) : null}
      </ResourceState>

      {canAct && selected ? (
        <StickyCtaBar testID="reschedule-cta">
          <Button
            title={t('stage.reschedule.propose', { slot: selected.label })}
            loading={busy === 'propose'}
            disabled={Boolean(busy)}
            onPress={() => run('propose', {
              slot_id: selected.id,
              starts_at: selected.startsAt,
              new_date: selected.date,
              new_time: selected.time,
            })}
          />
        </StickyCtaBar>
      ) : null}
    </Screen>
  );
}
