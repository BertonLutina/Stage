import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { hexToRgba } from '@/lib/stageTheme';
import { Button, Card } from '@/components/ui';
import { innerTileChrome, sectionLabelStyle } from '@/components/dashboard/CommandCenterUI';
import { parseSubmission, absoluteProofUrl } from '@/lib/adminDisputes';
import {
  formatDeadlineCountdown,
  formatSideClaim,
  getResultSubmissionControls,
  pendingFixtureScore,
  resultDeadlineAt,
} from '@/lib/gameDayResultFlow';
import { penaltyOutcome } from '@/lib/penaltyOutcome';

export default function GameDayScoreReport({
  game,
  homeName,
  awayName,
  isMyMatch,
  amIHomeTeam,
  isLive,
  isCompleted,
  isDisputed,
  showResultForm,
  onSubmitPress,
}) {
  const tokens = useThemeStore((st) => st.tokens);
  const homeSub = parseSubmission(game?.home_submission);
  const awaySub = parseSubmission(game?.away_submission);
  const controls = getResultSubmissionControls({
    game,
    isLive,
    showResultForm,
    amIHomeTeam,
  });
  const dueAt = resultDeadlineAt(game);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!dueAt) return undefined;
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, [dueAt]);

  if (!isMyMatch) return null;

  const countdown = formatDeadlineCountdown(dueAt, now);
  const pending = pendingFixtureScore(game);
  const pensLabel = penaltyOutcome(game);
  const cta = controls.showHomeReview
    ? 'REVIEW CORRECTION'
    : controls.showConfirmResult
      ? 'CONFIRM RESULT'
      : controls.showAmendResult
        ? 'AMEND RESULT'
        : controls.showHomeSubmit || controls.showAwaySubmit
          ? (amIHomeTeam ? 'SUBMIT FULL TIME' : 'SUBMIT RESULT')
          : null;

  return (
    <Card style={{ gap: 10, borderColor: hexToRgba(tokens.success, 0.45) }}>
      <Text style={sectionLabelStyle(tokens)}>MATCH SCORE</Text>
      <Text style={hint(tokens)}>
        Home submits first. Away confirms or proposes one correction. Stats are only for your own club.
      </Text>

      {countdown ? <Text style={wait(tokens)}>{countdown}</Text> : null}

      {isCompleted || controls.showFinal ? (
        <Text style={official(tokens)}>
          Official {game.home_score ?? '?'}–{game.away_score ?? '?'}
          {Number(game.decided_on_penalties) === 1 ? ' · pens' : ''}
        </Text>
      ) : pending.pending ? (
        <Text style={official(tokens)}>
          Claimed {pending.home}–{pending.away} (awaiting confirmation)
        </Text>
      ) : null}

      {pensLabel ? <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '600', marginTop: 4 }}>{pensLabel}</Text> : null}

      {controls.showOverdue ? (
        <View style={disputeBox(tokens, tokens.warning)}>
          <Text style={{ color: tokens.warning, fontWeight: '700' }}>RESULT OVERDUE</Text>
          <Text style={hint(tokens)}>Waiting for an admin.</Text>
        </View>
      ) : null}

      {controls.showAdminReview || isDisputed ? (
        <View style={disputeBox(tokens, tokens.danger)}>
          <Text style={{ color: tokens.danger, fontWeight: '700' }}>
            {String(game?.result_state || '') === 'ADMIN_REVIEW' ? 'ADMIN REVIEW' : 'DISPUTED'}
          </Text>
          <Text style={hint(tokens)}>An admin is reviewing this.</Text>
        </View>
      ) : null}

      <Claim
        label={`${homeName} · home`}
        claim={homeSub ? formatSideClaim(homeSub, 'home') : 'Not submitted'}
        proofUrl={absoluteProofUrl(homeSub?.proof_url)}
        pending={!homeSub}
      />
      <Claim
        label={`${awayName} · away`}
        claim={awaySub ? formatSideClaim(awaySub, 'away') : 'Not submitted'}
        proofUrl={absoluteProofUrl(awaySub?.proof_url)}
        pending={!awaySub}
      />

      {cta ? (
        <Button title={cta} onPress={onSubmitPress} />
      ) : null}

      {controls.showAwayWaitingForHome ? (
        <Text style={wait(tokens)}>Home submits first. You confirm after they send it.</Text>
      ) : null}
      {controls.showHomeWaitingForAway ? (
        <Text style={wait(tokens)}>Your result is in. Waiting for the other side to confirm.</Text>
      ) : null}
      {controls.showAwaySubmittedWaitingForHome ? (
        <Text style={wait(tokens)}>Waiting for the original submitter to review the correction.</Text>
      ) : null}
    </Card>
  );
}

function Claim({ label, claim, proofUrl, pending }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <View style={[innerTileChrome(tokens, { borderRadius: 12 }), claimRow]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={sectionLabelStyle(tokens)}>{label.toUpperCase()}</Text>
        <Text style={{ color: pending ? tokens.muted : tokens.text, fontWeight: '700', marginTop: 3 }}>
          {claim}
        </Text>
      </View>
      {proofUrl ? (
        <Image source={{ uri: proofUrl }} style={[thumb, { backgroundColor: tokens.bgDeep }]} />
      ) : (
        <Text style={{ color: tokens.muted, fontSize: 11 }}>{pending ? '—' : 'No proof'}</Text>
      )}
    </View>
  );
}

const hint = (tokens) => ({ color: tokens.muted, fontSize: 13, lineHeight: 18 });
const official = (tokens) => ({ color: tokens.success, fontSize: 22, fontWeight: '700' });
const disputeBox = (tokens, color) => ({
  backgroundColor: hexToRgba(color, 0.12),
  borderWidth: 1,
  borderColor: hexToRgba(color, 0.4),
  borderRadius: 12,
  padding: 10,
  gap: 4,
});
const claimRow = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  padding: 10,
};
const thumb = { width: 52, height: 52, borderRadius: 8 };
const wait = (tokens) => ({ color: tokens.muted, fontSize: 13, textAlign: 'center' });
