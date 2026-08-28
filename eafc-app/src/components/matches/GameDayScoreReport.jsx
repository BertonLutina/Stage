import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { FUT } from '@/components/dashboard/CommandCenterUI';
import { parseSubmission, absoluteProofUrl } from '@/lib/adminDisputes';
import {
  formatDeadlineCountdown,
  formatSideClaim,
  getResultSubmissionControls,
  resultDeadlineAt,
} from '@/lib/gameDayResultFlow';

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
  const cta = controls.showHomeReview
    ? 'REVIEW CORRECTION'
    : controls.showConfirmResult
      ? 'CONFIRM RESULT'
      : controls.showHomeSubmit || controls.showAwaySubmit
        ? (amIHomeTeam ? 'SUBMIT FULL TIME' : 'SUBMIT RESULT')
        : null;

  return (
    <View style={card}>
      <Text style={title}>MATCH SCORE</Text>
      <Text style={hint}>
        Home submits first. Away confirms or proposes one correction. Stats are only for your own club.
      </Text>

      {countdown ? <Text style={wait}>{countdown}</Text> : null}

      {isCompleted || controls.showFinal ? (
        <Text style={official}>
          Official {game.home_score ?? '?'}–{game.away_score ?? '?'}
          {Number(game.decided_on_penalties) === 1 ? ' · pens' : ''}
        </Text>
      ) : null}

      {controls.showOverdue ? (
        <View style={disputeBox}>
          <Text style={{ color: FUT.gold, fontWeight: '900' }}>RESULT OVERDUE</Text>
          <Text style={hint}>Waiting for an admin.</Text>
        </View>
      ) : null}

      {controls.showAdminReview || isDisputed ? (
        <View style={disputeBox}>
          <Text style={{ color: FUT.rose, fontWeight: '900' }}>
            {String(game?.result_state || '') === 'ADMIN_REVIEW' ? 'ADMIN REVIEW' : 'DISPUTED'}
          </Text>
          <Text style={hint}>An admin is reviewing this.</Text>
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
        <TouchableOpacity onPress={onSubmitPress} style={ctaStyle}>
          <Text style={{ color: '#041018', fontWeight: '900' }}>{cta}</Text>
        </TouchableOpacity>
      ) : null}

      {controls.showAwayWaitingForHome ? (
        <Text style={wait}>Home submits first. You confirm after they send it.</Text>
      ) : null}
      {controls.showHomeWaitingForAway ? (
        <Text style={wait}>Your result is in. Waiting for the other side to confirm.</Text>
      ) : null}
      {controls.showAwaySubmittedWaitingForHome ? (
        <Text style={wait}>Waiting for the original submitter to review the correction.</Text>
      ) : null}
    </View>
  );
}

function Claim({ label, claim, proofUrl, pending }) {
  return (
    <View style={claimRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800' }}>{label.toUpperCase()}</Text>
        <Text style={{ color: pending ? 'rgba(255,255,255,0.4)' : '#fff', fontWeight: '800', marginTop: 3 }}>
          {claim}
        </Text>
      </View>
      {proofUrl ? (
        <Image source={{ uri: proofUrl }} style={thumb} />
      ) : (
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{pending ? '—' : 'No proof'}</Text>
      )}
    </View>
  );
}

const card = {
  backgroundColor: 'rgba(124,255,107,0.06)',
  borderWidth: 1.5,
  borderColor: 'rgba(124,255,107,0.28)',
  borderRadius: 2,
  padding: 14,
  gap: 10,
};
const title = { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 };
const hint = { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 17 };
const official = { color: FUT.lime, fontSize: 22, fontWeight: '900' };
const disputeBox = {
  backgroundColor: 'rgba(255,77,109,0.12)',
  borderWidth: 1,
  borderColor: 'rgba(255,77,109,0.35)',
  borderRadius: 12,
  padding: 10,
  gap: 4,
};
const claimRow = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  backgroundColor: 'rgba(0,0,0,0.22)',
  borderRadius: 12,
  padding: 10,
};
const thumb = { width: 52, height: 52, borderRadius: 8, backgroundColor: '#0A1222' };
const ctaStyle = {
  backgroundColor: FUT.lime,
  borderRadius: 14,
  paddingVertical: 14,
  alignItems: 'center',
};
const wait = { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' };
