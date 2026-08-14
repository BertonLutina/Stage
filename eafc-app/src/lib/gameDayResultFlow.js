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
  const fixture = fixtureScoreFromSubmission(submission, side);
  if (Number.isFinite(fixture.home) && Number.isFinite(fixture.away)) {
    return `Home ${fixture.home}–Away ${fixture.away}`;
  }
  return '?';
}

export function submissionProofUrl(submission) {
  return submission?.proof_url || null;
}

function hasOwnOpponentScores(submission) {
  return submission?.own_score != null && submission?.own_score !== ''
    && submission?.opponent_score != null && submission?.opponent_score !== '';
}

export function fixtureScoreFromSubmission(submission, side) {
  if (!submission) return { home: NaN, away: NaN };
  if (hasOwnOpponentScores(submission)) {
    const own = Number(submission.own_score);
    const opponent = Number(submission.opponent_score);
    if (side === 'away') return { home: opponent, away: own };
    return { home: own, away: opponent };
  }
  return {
    home: Number(submission?.home_score),
    away: Number(submission?.away_score),
  };
}

export function declaredScoresAgree(homeSubmission, awaySubmission) {
  if (!homeSubmission || !awaySubmission) return false;
  const home = fixtureScoreFromSubmission(homeSubmission, 'home');
  const away = fixtureScoreFromSubmission(awaySubmission, 'away');
  return Number.isFinite(home.home)
    && Number.isFinite(home.away)
    && home.home === away.home
    && home.away === away.away;
}

export const KICKOFF_EARLY_WINDOW_MINUTES = 15;

export function getKickoffControls({
  game,
  isMyMatch,
  amIHomeTeam,
  isLive,
  showResultForm,
  minutesUntilMatch,
  isClubMatch,
  bothClubsReady,
}) {
  const isScheduled = game?.status === 'scheduled';
  const showKickoffSection = Boolean(isMyMatch && isScheduled && !isLive && !showResultForm);
  const tooEarly = minutesUntilMatch != null && minutesUntilMatch > KICKOFF_EARLY_WINDOW_MINUTES;
  const dressingBlocked = Boolean(isClubMatch && !bothClubsReady);

  return {
    showKickoffSection,
    showHomeKickoff: showKickoffSection && Boolean(amIHomeTeam),
    showAwayWaiting: showKickoffSection && !amIHomeTeam,
    tooEarly,
    dressingBlocked,
    canPressKickoff: showKickoffSection && Boolean(amIHomeTeam) && !tooEarly && !dressingBlocked,
  };
}
