import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';
import { Button, Card, SectionLabel, TextField } from '@/components/ui';
import StatusTag from '@/components/competitions/StatusTag';
import useT from '@/hooks/useT';
import {
  MIN_CONFIRMED_PLAYERS,
  applyToWindow,
  confirmParticipation,
  playerStatusKey,
  regionLabel,
  respondReserve,
  windowActions,
  windowStatus,
} from '@/lib/seasonRegistration';

const TAP = 44;

const STATUS_TONE = {
  open: 'info',
  upcoming: 'warning',
  confirmationOnly: 'warning',
  closed: 'warning',
  registered: 'warning',
  confirmationClosed: 'warning',
  confirmedPending: 'success',
  confirmedAssigned: 'success',
  withdrawn: 'warning',
  rejected: 'danger',
  waitlisted: 'warning',
};

function formatDay(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function CheckRow({ checked, disabled, label, accessibilityLabel, onPress, right }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ checked, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={{ minHeight: TAP, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: disabled ? 0.55 : 1 }}
    >
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={24}
        color={checked ? tokens.cyan : tokens.muted}
      />
      <Text style={{ flex: 1, color: tokens.text, fontSize: 14, lineHeight: 20 }}>{label}</Text>
      {right || null}
    </Pressable>
  );
}

/**
 * One published registration window: status, dates, rules and the actions the president
 * can take right now (apply, confirm with players, answer a reserve invitation).
 * Division and group are assigned by the server, never picked here.
 */
export default function RegistrationWindowCard({ window, application, readiness, clubId, onChanged, onOpenCompetitions }) {
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const [accepted, setAccepted] = useState(false);
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const status = windowStatus(window, application);
  const { canRegister, canConfirm, canReserve } = windowActions(window, application, readiness);
  const registrarOk = readiness?.registrar_status === 'eligible';
  const needsPlayers = canConfirm || canReserve;
  const enough = selected.length >= (readiness?.minimum_players || MIN_CONFIRMED_PLAYERS);
  const players = readiness?.players || [];

  async function run(kind, action) {
    setBusy(kind);
    setError('');
    try {
      await action();
      setAccepted(false);
      setSelected([]);
      setNote('');
      await onChanged?.();
    } catch (err) {
      setError(err?.message || t('stage.state.error'));
    } finally {
      setBusy('');
    }
  }

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const deadline = application?.reserve_invitation?.deadline;
  const reserveDecision = application?.reserve_response?.decision;

  return (
    <Card style={{ gap: 14 }} testID={`registration-window-${window.id}`}>
      <View style={{ gap: 8 }}>
        <Text style={{ color: tokens.text, fontSize: 17, fontWeight: '700' }}>
          {t('stage.register.windowTitle', { region: regionLabel(window.region_slug), season: window.season_number })}
        </Text>
        <Text style={{ color: tokens.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {window.platform}
        </Text>
        <StatusTag label={t(`stage.register.status.${status}`)} tone={STATUS_TONE[status]} />
      </View>

      {status === 'confirmedAssigned' ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>
            {t('stage.register.assigned', {
              division: application.assigned_division ?? '-',
              group: application.assigned_group_code ?? '-',
            })}
          </Text>
          <Button title={t('stage.register.openCompetitions')} variant="secondary" onPress={onOpenCompetitions} />
        </View>
      ) : null}

      <View style={{ gap: 4 }}>
        {window.opens_at && window.phase === 'upcoming' ? (
          <Text style={{ color: tokens.textSoft, fontSize: 13 }}>
            {t('stage.register.opensAt', { date: formatDay(window.opens_at) })}
          </Text>
        ) : null}
        {window.registration_closes_at ? (
          <Text style={{ color: tokens.textSoft, fontSize: 13 }}>
            {t('stage.register.registrationCloses', { date: formatDay(window.registration_closes_at) })}
          </Text>
        ) : null}
        {window.confirmation_closes_at ? (
          <Text style={{ color: tokens.textSoft, fontSize: 13 }}>
            {t('stage.register.confirmationCloses', { date: formatDay(window.confirmation_closes_at) })}
          </Text>
        ) : null}
        {window.league_start_monday ? (
          <Text style={{ color: tokens.textSoft, fontSize: 13 }}>
            {t('stage.register.leagueStart', { date: formatDay(window.league_start_monday) })}
          </Text>
        ) : null}
        <Text style={{ color: tokens.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
          {t('stage.register.divisionAuto')}
        </Text>
      </View>

      {application?.reserve_invitation ? (
        <View style={{ gap: 6 }}>
          {reserveDecision ? (
            <Text style={{ color: tokens.textSoft, fontSize: 13 }}>
              {t('stage.register.reserveResponse', {
                decision: reserveDecision === 'accept' ? t('stage.register.reserveAccepted') : t('stage.register.reserveDeclined'),
              })}
            </Text>
          ) : (
            <Text style={{ color: tokens.warning, fontSize: 13, lineHeight: 19 }}>
              {t('stage.register.reserveOffer', { date: formatDay(deadline) })}
            </Text>
          )}
        </View>
      ) : null}

      {window.rules_text ? (
        <View style={{ gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rulesOpen ? t('stage.register.rulesHide') : t('stage.register.rulesShow')}
            accessibilityState={{ expanded: rulesOpen }}
            onPress={() => setRulesOpen((v) => !v)}
            style={{ minHeight: TAP, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={{ color: tokens.cyan, fontSize: 14, fontWeight: '700' }}>
              {rulesOpen ? t('stage.register.rulesHide') : t('stage.register.rulesShow')}
            </Text>
            <Ionicons name={rulesOpen ? 'chevron-up' : 'chevron-down'} size={18} color={tokens.cyan} />
          </Pressable>
          {rulesOpen ? (
            <View style={{ gap: 6 }}>
              <Text style={{ color: tokens.textSoft, fontSize: 13, lineHeight: 19 }}>{window.rules_text}</Text>
              {window.policy_version ? (
                <Text style={{ color: tokens.muted, fontSize: 12 }}>
                  {t('stage.register.rulesRevision', { version: window.policy_version })}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {needsPlayers ? (
        <View style={{ gap: 6 }}>
          <SectionLabel>{t('stage.register.playersTitle')}</SectionLabel>
          <Text style={{ color: tokens.muted, fontSize: 12, lineHeight: 18 }}>
            {t('stage.register.playersHelp', { min: readiness?.minimum_players || MIN_CONFIRMED_PLAYERS })}
          </Text>
          {players.length === 0 ? (
            <Text style={{ color: tokens.muted, fontSize: 13 }}>{t('stage.register.noPlayers')}</Text>
          ) : players.map((player) => {
            const eligible = player.status === 'eligible';
            const reason = t(`stage.register.player.${playerStatusKey(player.status)}`);
            return (
              <CheckRow
                key={player.id}
                checked={selected.includes(player.id)}
                disabled={!eligible || Boolean(busy)}
                label={player.gamertag}
                accessibilityLabel={`${player.gamertag}, ${reason}`}
                onPress={() => toggle(player.id)}
                right={<Text style={{ color: eligible ? tokens.success : tokens.warning, fontSize: 12 }}>{reason}</Text>}
              />
            );
          })}
          <Text style={{ color: tokens.textSoft, fontSize: 13 }}>
            {t('stage.register.playersSelected', { count: selected.length })}
          </Text>
        </View>
      ) : null}

      {canRegister ? (
        <TextField
          accessibilityLabel={t('stage.register.noteLabel')}
          value={note}
          onChangeText={setNote}
          placeholder={t('stage.register.notePlaceholder')}
        />
      ) : null}

      {canRegister || canConfirm || canReserve ? (
        <View style={{ gap: 10 }}>
          <CheckRow
            checked={accepted}
            disabled={Boolean(busy)}
            label={t('stage.register.acceptRules')}
            onPress={() => setAccepted((v) => !v)}
          />
          {canRegister ? (
            <Button
              title={t('stage.register.apply')}
              disabled={!accepted || !registrarOk}
              loading={busy === 'apply'}
              onPress={() => run('apply', () => applyToWindow({ window, clubId, note }))}
            />
          ) : null}
          {canConfirm ? (
            <Button
              title={t('stage.register.confirm')}
              disabled={!accepted || !registrarOk || !enough}
              loading={busy === 'confirm'}
              onPress={() => run('confirm', () => confirmParticipation({ window, application, clubId, playerIds: selected }))}
            />
          ) : null}
          {canReserve ? (
            <>
              <Button
                title={t('stage.register.reserveAccept')}
                disabled={!accepted || !registrarOk || !enough}
                loading={busy === 'accept'}
                onPress={() => run('accept', () => respondReserve({ window, application, clubId, decision: 'accept', playerIds: selected }))}
              />
              <Button
                title={t('stage.register.reserveDecline')}
                variant="secondary"
                disabled={Boolean(busy)}
                loading={busy === 'decline'}
                onPress={() => run('decline', () => respondReserve({ window, application, clubId, decision: 'decline' }))}
              />
            </>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 13 }}>{error}</Text>
      ) : null}
    </Card>
  );
}
