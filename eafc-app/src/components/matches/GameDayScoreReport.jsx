import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { FUT } from '@/components/dashboard/CommandCenterUI';
import { parseSubmission, absoluteProofUrl } from '@/lib/adminDisputes';
import {
  declaredScoresAgree,
  formatSideClaim,
  getResultSubmissionControls,
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
  if (!isMyMatch) return null;

  const homeSub = parseSubmission(game?.home_submission);
  const awaySub = parseSubmission(game?.away_submission);
  const controls = getResultSubmissionControls({
    game,
    isLive,
    showResultForm,
    amIHomeTeam,
  });
  const agree = homeSub && awaySub ? declaredScoresAgree(homeSub, awaySub) : false;

  return (
    <View style={card}>
      <Text style={title}>MATCH SCORE</Text>
      <Text style={hint}>
        Both sides enter the score and a screenshot. Matching scores complete the match. A mismatch goes to admin with the proofs.
      </Text>

      {isCompleted ? (
        <Text style={official}>
          Official {game.home_score ?? '?'}–{game.away_score ?? '?'}
        </Text>
      ) : null}

      {isDisputed ? (
        <View style={disputeBox}>
          <Text style={{ color: FUT.rose, fontWeight: '900' }}>DISPUTED</Text>
          <Text style={hint}>
            Scores do not match. An admin will check both screenshots and pick the official result.
          </Text>
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

      {homeSub && awaySub && !isDisputed && agree ? (
        <Text style={{ color: FUT.lime, fontSize: 12, fontWeight: '800' }}>Both sides reported the same score.</Text>
      ) : null}

      {controls.showHomeSubmit || controls.showAwaySubmit ? (
        <TouchableOpacity onPress={onSubmitPress} style={cta}>
          <Text style={{ color: '#041018', fontWeight: '900' }}>
            {amIHomeTeam ? 'SUBMIT FULL TIME' : 'SUBMIT MY RESULT'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {controls.showAwayWaitingForHome ? (
        <Text style={wait}>Home submits first. You confirm the score after they send it.</Text>
      ) : null}
      {controls.showHomeWaitingForAway ? (
        <Text style={wait}>Your result is in. Waiting for away to confirm with their screenshot.</Text>
      ) : null}
      {controls.showAwaySubmittedWaitingForHome ? (
        <Text style={wait}>Waiting for home to submit the result.</Text>
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
  borderRadius: 16,
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
const cta = {
  backgroundColor: FUT.lime,
  borderRadius: 14,
  paddingVertical: 14,
  alignItems: 'center',
};
const wait = { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' };
