import React, { useEffect, useState } from 'react';
import {
  Image, RefreshControl, StatusBar, Text, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import {
  Avatar, Button, Card, ResourceState, Screen, SectionLabel,
} from '@/components/ui';
import StatusTag from '@/components/competitions/StatusTag';
import AuditScreenHeader from '@/components/audit/AuditScreenHeader';
import StickyCtaBar from '@/components/audit/StickyCtaBar';
import SuccessButton from '@/components/audit/SuccessButton';
import useMatchResultScreen from '@/hooks/useMatchResultScreen';
import useT from '@/hooks/useT';
import { absoluteProofUrl, parseSubmission } from '@/lib/adminDisputes';
import {
  buildResultPayload, mapResultError, submitMatchResult,
} from '@/lib/gameDayOps';
import {
  formatDeadlineCountdown,
  fixtureScoreFromSubmission,
  resultDeadlineAt,
} from '@/lib/gameDayResultFlow';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hexToRgba } from '@/lib/stageTheme';

function clubAbbrev(name) {
  const raw = String(name || '').trim();
  if (!raw) return '?';
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  return raw.slice(0, 3).toUpperCase();
}

export default function ConfirmResultScreen() {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { data, loading, error, refreshing, refetch } = useMatchResultScreen();
  const match = data?.match;
  const sides = data?.sides;
  const controls = data?.controls;

  const [now, setNow] = useState(() => new Date());
  const [proofUrl, setProofUrl] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(null);
  const [formError, setFormError] = useState('');
  const [disputing, setDisputing] = useState(false);

  const submitSide = controls?.submitSide || 'home';
  const submission = parseSubmission(
    submitSide === 'away' ? match?.away_submission : match?.home_submission,
  );
  const score = fixtureScoreFromSubmission(submission, submitSide);
  const reporterName = submitSide === 'away'
    ? (sides?.awayName || match?.away_club_name || 'Away')
    : (sides?.homeName || match?.home_club_name || 'Home');
  const reporterHandle = submission?.submitted_by_gamertag
    || submission?.submitted_by
    || submission?.reporter
    || null;
  const reportedAt = submission?.submitted_at || submission?.created_at || null;
  const theirProof = absoluteProofUrl(submission?.proof_url);
  const dueAt = resultDeadlineAt(match);
  const countdown = formatDeadlineCountdown(dueAt, now);
  const canAct = Boolean(controls?.showConfirmResult && sides?.isMyMatch);

  useEffect(() => {
    if (!dueAt) return undefined;
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, [dueAt]);

  const pickDisputeProof = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      setFormError(t('stage.confirmResult.proofPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    setFormError('');
    setProofPreview(asset.uri);
    try {
      const uploaded = await stageClient.integrations.Core.UploadFile({
        file: { uri: asset.uri, name: asset.fileName || 'dispute.jpg', type: asset.mimeType || 'image/jpeg' },
      });
      setProofUrl(uploaded?.file_url || null);
    } catch (err) {
      setProofUrl(null);
      setFormError(err?.message || t('stage.confirmResult.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const run = async (action) => {
    if (action === 'dispute_result' && !proofUrl) {
      setDisputing(true);
      setFormError(t('stage.confirmResult.disputeNeedsProof'));
      return;
    }
    setBusy(action);
    setFormError('');
    try {
      const payload = buildResultPayload({
        game: match,
        isHomeTeam: sides.amIHomeTeam,
        myClub: data.club,
        myPlayer: data.player,
        homeScore: Number.isFinite(score.home) ? score.home : 0,
        awayScore: Number.isFinite(score.away) ? score.away : 0,
        proofUrl,
        action,
      });
      await submitMatchResult(payload);
      router.back();
    } catch (err) {
      setFormError(mapResultError(err));
    } finally {
      setBusy(null);
    }
  };

  const reportedLabel = [
    reporterHandle ? t('stage.confirmResult.reportedBy', { name: reporterHandle }) : null,
    reportedAt ? new Date(reportedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : null,
  ].filter(Boolean).join(' · ');

  return (
    <Screen
      tabBar={false}
      guideFab
      scroll={!loading}
      style={{ paddingBottom: guideFabClearanceStack(insets.bottom) + 120 }}
      refreshControl={loading ? undefined : (
        <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} colors={[tokens.cyan]} />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <AuditScreenHeader title={t('stage.confirmResult.title')} />

      <ResourceState loading={loading && !data} error={data ? null : error} onRetry={refetch}>
        {match ? (
          <View style={{ gap: 13 }}>
            {canAct && countdown ? (
              <Card style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderColor: tokens.warningBorder || tokens.warning,
                backgroundColor: tokens.warningBg || hexToRgba(tokens.warning, 0.12),
              }}
              >
                <Ionicons name="time-outline" size={22} color={tokens.warning} />
                <Text style={{ flex: 1, color: tokens.text, fontSize: 13, lineHeight: 19 }}>
                  {t('stage.confirmResult.autoConfirm', { club: reporterName, time: countdown.replace(/ left$/i, '') })}
                </Text>
              </Card>
            ) : null}

            <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 18 }}>
              <StatusTag
                label={(canAct ? t('stage.confirmResult.waitingForYou') : (controls?.showFinal ? t('stage.confirmResult.confirmed') : t('stage.confirmResult.pending'))).toUpperCase()}
                tone={canAct ? 'warning' : (controls?.showFinal ? 'success' : 'info')}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <View style={{ width: 96, alignItems: 'center', gap: 6 }}>
                  <Avatar initials={clubAbbrev(sides.homeName)} size={52} round />
                  <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 12 }} numberOfLines={1}>{sides.homeName}</Text>
                </View>
                <Text style={{ color: tokens.text, fontSize: 54, fontWeight: '800', lineHeight: 58 }}>
                  {Number.isFinite(score.home) ? score.home : '?'} – {Number.isFinite(score.away) ? score.away : '?'}
                </Text>
                <View style={{ width: 96, alignItems: 'center', gap: 6 }}>
                  <Avatar initials={clubAbbrev(sides.awayName)} size={52} round />
                  <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 12 }} numberOfLines={1}>{sides.awayName}</Text>
                </View>
              </View>
              {reportedLabel ? (
                <Text style={{ color: tokens.muted, fontSize: 12 }}>{reportedLabel}</Text>
              ) : null}
            </Card>

            <Card style={{ gap: 10, paddingVertical: 12 }}>
              <SectionLabel>{t('stage.confirmResult.theirProof')}</SectionLabel>
              {theirProof ? (
                <Image
                  source={{ uri: theirProof }}
                  style={{ height: 128, borderRadius: 10, backgroundColor: tokens.bgDeep }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{
                  height: 128, borderRadius: 10, borderWidth: 1, borderColor: tokens.border,
                  backgroundColor: tokens.bgDeep, alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                >
                  <Ionicons name="image-outline" size={22} color={tokens.muted} />
                  <Text style={{ color: tokens.muted, fontSize: 12 }}>{t('stage.confirmResult.noProof')}</Text>
                </View>
              )}
            </Card>

            {(disputing || proofPreview) ? (
              <Card style={{ gap: 10 }}>
                <SectionLabel>{t('stage.confirmResult.myProof')}</SectionLabel>
                {proofPreview ? (
                  <Image source={{ uri: proofPreview }} style={{ height: 100, borderRadius: 10 }} />
                ) : null}
                <Button
                  title={proofUrl ? t('stage.confirmResult.proofReady') : t('stage.confirmResult.addMyProof')}
                  variant="secondary"
                  loading={uploading}
                  onPress={pickDisputeProof}
                />
              </Card>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Ionicons name="information-circle-outline" size={16} color={tokens.muted} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, color: tokens.muted, fontSize: 12, lineHeight: 18 }}>
                {t('stage.confirmResult.disputeHint')}
              </Text>
            </View>

            {formError ? <Text style={{ color: tokens.danger, fontSize: 13 }}>{formError}</Text> : null}
            {!canAct && !controls?.showFinal ? (
              <Text style={{ color: tokens.muted, fontSize: 13 }}>{t('stage.confirmResult.notYourTurn')}</Text>
            ) : null}
          </View>
        ) : null}
      </ResourceState>

      {canAct ? (
        <StickyCtaBar testID="confirm-result-cta">
          <SuccessButton
            title={t('stage.confirmResult.confirm')}
            loading={busy === 'confirm_result'}
            disabled={Boolean(busy) || uploading}
            onPress={() => run('confirm_result')}
          />
          <Button
            title={t('stage.confirmResult.dispute')}
            variant="danger"
            loading={busy === 'dispute_result'}
            disabled={Boolean(busy) || uploading}
            onPress={() => {
              if (!proofUrl) {
                setDisputing(true);
                pickDisputeProof();
                return;
              }
              run('dispute_result');
            }}
          />
        </StickyCtaBar>
      ) : null}
    </Screen>
  );
}
