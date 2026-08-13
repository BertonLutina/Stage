export function isSubmittedFlag(value) {
  return Boolean(Number(value));
}

export function getResultSubmissionControls({ game, isLive, showResultForm, amIHomeTeam }) {
  const homeResultSubmitted = isSubmittedFlag(game?.result_home_submitted);
  const awayResultSubmitted = isSubmittedFlag(game?.result_away_submitted);
  const canShowResultAction = Boolean(isLive && !showResultForm);

  return {
    homeResultSubmitted,
    awayResultSubmitted,
    showHomeSubmit: canShowResultAction && Boolean(amIHomeTeam) && !homeResultSubmitted,
    showAwayWaitingForHome: canShowResultAction && !amIHomeTeam && !homeResultSubmitted && !awayResultSubmitted,
    showAwaySubmit: canShowResultAction && !amIHomeTeam && homeResultSubmitted && !awayResultSubmitted,
    showHomeWaitingForAway: canShowResultAction && Boolean(amIHomeTeam) && homeResultSubmitted,
    showAwaySubmittedWaitingForHome: canShowResultAction && !amIHomeTeam && awayResultSubmitted,
  };
}

export function isValidAdminScore(value) {
  if (value === '' || value == null) return false;
  const score = Number(value);
  return Number.isFinite(score) && Number.isInteger(score) && score >= 0;
}

export function canResolveDisputeWithScore(selectedWinner, score) {
  return Boolean(selectedWinner)
    && isValidAdminScore(score?.home_score)
    && isValidAdminScore(score?.away_score);
}

export function formatSideClaim(submission, side) {
  if (!submission) return '?';
  if (submission.own_score != null && submission.opponent_score != null) {
    return side === 'away'
      ? `Away ${submission.own_score}–Home ${submission.opponent_score}`
      : `Home ${submission.own_score}–Away ${submission.opponent_score}`;
  }
  return `Home ${submission.home_score}–Away ${submission.away_score}`;
}

export function submissionProofUrl(submission) {
  return submission?.proof_url || null;
}
