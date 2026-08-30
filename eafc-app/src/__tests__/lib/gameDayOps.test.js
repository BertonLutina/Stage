import {
  bothDressingRoomsReady,
  buildResultPayload,
  canKickoffMatch,
  countSeated,
  mapResultError,
  matchBelongsToIdentity,
  minutesUntil,
    parseIdList,
    pickMyClubForMatch,
    resolveMatchSides,
    uniqueIdentityClubs,
} from '../../lib/gameDayOps';
import { formatSideClaim, getKickoffControls, getResultSubmissionControls, declaredScoresAgree, formatDeadlineCountdown, resultDeadlineAt } from '../../lib/gameDayResultFlow';
import { applyWagerOptimistic, formatStc } from '../../lib/wagerActions';
import { roleForClub } from '../../lib/scheduleEngine';
import { sortStandings } from '../../lib/competitionUtils';
import { hasStagePlus } from '../../lib/subscriptionUtils';
import { canResolveDisputeWithScore } from '../../lib/gameDayResultFlow';
import { absoluteProofUrl, isStageAdmin, parseSubmission } from '../../lib/adminDisputes';
import {
  clubInitials,
  formatBroadcastUnit,
  gameDayArenaLayout,
  getKickoffCountdownParts,
  pad2,
} from '../../lib/gameDayPresentation';

describe('gameDayOps', () => {
  test('parses seated player lists', () => {
    expect(parseIdList('["a","b"]')).toEqual(['a', 'b']);
    expect(countSeated(['x'])).toBe(1);
    expect(bothDressingRoomsReady(true, { home: 1, away: 0 })).toBe(false);
  });

  test('kickoff window is 15 minutes early', () => {
    expect(canKickoffMatch({ status: 'scheduled', scheduled_date: new Date(Date.now() + 10 * 60000).toISOString() })).toBe(true);
    expect(canKickoffMatch({ status: 'scheduled', scheduled_date: new Date(Date.now() + 40 * 60000).toISOString() })).toBe(false);
    expect(canKickoffMatch({ status: 'in_progress' })).toBe(false);
  });

  test('home still sees kickoff 75 hours out, but cannot press it yet', () => {
    const controls = getKickoffControls({
      game: { status: 'scheduled' },
      isMyMatch: true,
      amIHomeTeam: true,
      isLive: false,
      showResultForm: false,
      minutesUntilMatch: 75 * 60,
      isClubMatch: false,
      bothClubsReady: true,
    });
    expect(controls.showHomeKickoff).toBe(true);
    expect(controls.tooEarly).toBe(true);
    expect(controls.canPressKickoff).toBe(false);
  });

  test('resolves club and solo sides', () => {
    const club = resolveMatchSides(
      { mode: 'club', home_club_id: 'c1', away_club_id: 'c2', home_club_name: 'Home', away_club_name: 'Away' },
      { id: 'c1' },
      { id: 'p1' },
    );
    expect(club.isMyMatch).toBe(true);
    expect(club.amIHomeTeam).toBe(true);
    const clubLoose = resolveMatchSides(
      { mode: 'club', home_club_id: 12, away_club_id: 34, home_club_name: 'Home', away_club_name: 'Away' },
      { id: '12' },
      { id: 'p1' },
    );
    expect(clubLoose.isMyMatch).toBe(true);
    expect(clubLoose.amIHomeTeam).toBe(true);
    const solo = resolveMatchSides(
      { mode: 'solo', home_player_id: 'p2', away_player_id: 'p1' },
      null,
      { id: 'p1' },
    );
    expect(solo.isMyMatch).toBe(true);
    expect(solo.amIHomeTeam).toBe(false);
  });

  test('picks the club that is actually in the fixture for dual accounts', () => {
    const signed = { id: 'signed' };
    const owned = { id: 'owned' };
    expect(uniqueIdentityClubs(signed, owned, { id: 'signed' }).map((c) => c.id)).toEqual(['signed', 'owned']);
    expect(pickMyClubForMatch(
      { home_club_id: 'owned', away_club_id: 'other' },
      [signed, owned],
    )?.id).toBe('owned');
    const dual = resolveMatchSides(
      { mode: 'club', home_club_id: 'owned', away_club_id: 'other' },
      [signed, owned],
      { id: 'p1' },
    );
    expect(dual.isMyMatch).toBe(true);
    expect(dual.amIHomeTeam).toBe(true);
    expect(dual.myClub.id).toBe('owned');
    expect(pickMyClubForMatch(
      { home_club_id: 'other', away_club_id: 'else' },
      [signed, owned],
    )).toBeNull();
    expect(matchBelongsToIdentity(
      { home_club_id: 'owned', away_club_id: 'else' },
      { clubs: [signed, owned], playerId: 'p1' },
    )).toBe(true);
    expect(matchBelongsToIdentity(
      { home_club_id: 'x', away_club_id: 'y', home_player_id: 'p9' },
      { clubs: [signed], playerId: 'p1' },
    )).toBe(false);
  });

  test('matching home/away own scores complete, swapped team goals dispute', () => {
    expect(declaredScoresAgree(
      { own_score: 5, opponent_score: 2 },
      { own_score: 2, opponent_score: 5 },
    )).toBe(true);
    expect(declaredScoresAgree(
      { home_score: 5, away_score: 2 },
      { home_score: 2, away_score: 5 },
    )).toBe(false);
  });

  test('club payload only includes ticked players', () => {
    const payload = buildResultPayload({
      game: { id: 'm1', mode: 'club' },
      isHomeTeam: true,
      myClub: { id: 'c1' },
      seatedPlayers: [
        { id: 'p1', email: 'a@b.c', gamertag: 'Neo' },
        { id: 'p2', email: 'b@c.d', gamertag: 'Rival' },
      ],
      participatingIds: ['p1'],
      playerMarks: { p1: { goals: 2, assists: 0, rating: 8 } },
      homeScore: 2,
      awayScore: 1,
    });
    expect(payload.participating_player_ids).toEqual(['p1']);
    expect(payload.player_stats).toHaveLength(1);
    expect(payload.player_stats[0].player_id).toBe('p1');
    expect(payload.player_stats[0].club_id).toBe('c1');
    expect(payload.action).toBe('submit_result');
  });

  test('builds matchKickoff submit_result payload', () => {
    const payload = buildResultPayload({
      game: { id: 'm1', mode: 'solo' },
      isHomeTeam: true,
      myPlayer: { id: 'p1', email: 'a@b.c', gamertag: 'Neo' },
      homeScore: 2,
      awayScore: 1,
      proofUrl: 'https://proof',
    });
    expect(payload).toEqual(expect.objectContaining({
      match_id: 'm1',
      action: 'submit_result',
      is_home_team: true,
      home_score: 2,
      away_score: 1,
      own_score: 2,
      opponent_score: 1,
      proof_url: 'https://proof',
    }));
  });

  test('away payload maps own 2 and opponent 5 to home 5-2', () => {
    const payload = buildResultPayload({
      game: { id: 'm1', mode: 'solo' },
      isHomeTeam: false,
      myPlayer: { id: 'p2', email: 'b@c.d', gamertag: 'Rival' },
      ownScore: 2,
      opponentScore: 5,
      proofUrl: 'https://proof',
    });
    expect(payload).toEqual(expect.objectContaining({
      is_home_team: false,
      home_score: 5,
      away_score: 2,
      own_score: 2,
      opponent_score: 5,
    }));
  });

  test('minutesUntil is finite for valid dates', () => {
    expect(minutesUntil(null)).toBeNull();
    expect(typeof minutesUntil(new Date().toISOString())).toBe('number');
  });

  test('kickoff arena countdown and crest initials', () => {
    expect(clubInitials('Lutina FC')).toBe('LF');
    expect(clubInitials('Lengarose')).toBe('LEN');
    expect(pad2(5)).toBe('05');
    expect(formatBroadcastUnit(73)).toBe('73');
    const parts = getKickoffCountdownParts('2026-08-17T22:00:00.000Z', new Date('2026-08-14T21:00:00.000Z'));
    expect(parts.started).toBe(false);
    expect(parts.hours).toBe(73);
  });

  test('match details arena crests shrink on phone widths', () => {
    const phone = gameDayArenaLayout(320);
    expect(phone.compact).toBe(true);
    expect(phone.crest * 2 + phone.vsW + 8 + phone.padH * 2).toBeLessThanOrEqual(320);
    const tablet = gameDayArenaLayout(780, { compact: false });
    expect(tablet.compact).toBe(false);
    expect(tablet.crest).toBeGreaterThan(phone.crest);
  });
});

describe('result + wager + season helpers', () => {
  test('away waits until home submits', () => {
    const controls = getResultSubmissionControls({
      game: { result_home_submitted: 0, result_away_submitted: 0 },
      isLive: true,
      showResultForm: false,
      amIHomeTeam: false,
    });
    expect(controls.showAwayWaitingForHome).toBe(true);
    expect(controls.showAwaySubmit).toBe(false);
    expect(controls.showConfirmResult).toBe(false);
  });

  test('away confirm stays available after status leaves in_progress', () => {
    const controls = getResultSubmissionControls({
      game: {
        result_state: 'AWAITING_AWAY_CONFIRMATION',
        result_submit_side: 'home',
        result_home_submitted: 1,
      },
      isLive: false,
      showResultForm: false,
      amIHomeTeam: false,
    });
    expect(controls.showConfirmResult).toBe(true);
    expect(controls.showAwaySubmit).toBe(false);
  });

  test('away confirm state opens confirm, not a second submit_result', () => {
    const controls = getResultSubmissionControls({
      game: {
        result_state: 'AWAITING_AWAY_CONFIRMATION',
        result_submit_side: 'home',
        result_home_submitted: 1,
      },
      isLive: true,
      showResultForm: false,
      amIHomeTeam: false,
    });
    expect(controls.showConfirmResult).toBe(true);
    expect(controls.showAwaySubmit).toBe(false);
    expect(controls.showHomeReview).toBe(false);
  });

  test('home review offers one counter until it is used', () => {
    const open = getResultSubmissionControls({
      game: { result_state: 'AWAITING_HOME_REVIEW', result_submit_side: 'home', home_counter_count: 0 },
      isLive: true,
      showResultForm: false,
      amIHomeTeam: true,
    });
    expect(open.showHomeReview).toBe(true);
    expect(open.canCounter).toBe(true);
    const spent = getResultSubmissionControls({
      game: { result_state: 'AWAITING_HOME_REVIEW', result_submit_side: 'home', home_counter_count: 1 },
      isLive: true,
      showResultForm: false,
      amIHomeTeam: true,
    });
    expect(spent.canCounter).toBe(false);
  });

  test('maps negotiation error codes without hiding the server message fallback', () => {
    expect(mapResultError({ data: { code: 'FOREIGN_PLAYER_STATS' } })).toMatch(/own club/);
    expect(mapResultError({ data: { code: 'MATCH_SIDE_REQUIRED' } })).toMatch(/other side/);
    expect(mapResultError({ data: { code: 'PENALTIES_NOT_ALLOWED' } })).toMatch(/not allowed/);
    expect(mapResultError({ message: 'Nope' })).toBe('Nope');
  });

  test('wager optimistic updates', () => {
    expect(applyWagerOptimistic({ wager_stc: 10 }, 'accept_wager').wager_status).toBe('active');
    expect(formatStc(20000)).toBe('20K');
  });

  test('fixture role and standings sort', () => {
    expect(roleForClub({ home_club_id: 'a', away_club_id: 'b' }, 'b')).toBe('away');
    const sorted = sortStandings([
      { points: 3, goal_difference: 1, goals_for: 2, club_name: 'B' },
      { points: 6, goal_difference: 0, goals_for: 1, club_name: 'A' },
    ]);
    expect(sorted[0].club_name).toBe('A');
  });

  test('STAGE Plus gate', () => {
    expect(hasStagePlus('stage_plus')).toBe(true);
    expect(hasStagePlus('free')).toBe(false);
  });

  test('admin dispute resolve needs a side and a score', () => {
    expect(canResolveDisputeWithScore('home', { home_score: 5, away_score: 2 })).toBe(true);
    expect(canResolveDisputeWithScore('', { home_score: 5, away_score: 2 })).toBe(false);
    expect(isStageAdmin({ role_id: 0 })).toBe(true);
    expect(parseSubmission('{"home_score":5,"away_score":2}').home_score).toBe(5);
    expect(formatSideClaim({ own_score: 2, opponent_score: 5 }, 'away')).toBe('Home 5–Away 2');
    expect(formatSideClaim({ own_score: 2, opponent_score: 5 }, 'home')).toBe('Home 2–Away 5');
    expect(absoluteProofUrl('/uploads/home.png')).toMatch(/\/uploads\/home\.png$/);
    expect(absoluteProofUrl('https://cdn.example/proof.png')).toBe('https://cdn.example/proof.png');
  });

  test('countdown uses the server due timestamp', () => {
    expect(resultDeadlineAt({ result_state: 'AWAITING_AWAY_CONFIRMATION', confirmation_due_at: '2026-08-30T00:00:00Z' }))
      .toBe('2026-08-30T00:00:00Z');
    expect(formatDeadlineCountdown('2026-08-30T12:00:00Z', new Date('2026-08-30T10:00:00Z'))).toBe('2h 0m left');
    expect(formatDeadlineCountdown('2026-08-30T10:00:00Z', new Date('2026-08-30T11:00:00Z'))).toBe('Deadline reached — pull to refresh');
  });
});
