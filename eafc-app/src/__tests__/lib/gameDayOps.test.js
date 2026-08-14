import {
  bothDressingRoomsReady,
  buildResultPayload,
  canKickoffMatch,
  countSeated,
  minutesUntil,
  parseIdList,
  resolveMatchSides,
} from '../../lib/gameDayOps';
import { formatSideClaim, getKickoffControls, getResultSubmissionControls, declaredScoresAgree } from '../../lib/gameDayResultFlow';
import { applyWagerOptimistic, formatStc } from '../../lib/wagerActions';
import { roleForClub } from '../../lib/scheduleEngine';
import { sortStandings } from '../../lib/competitionUtils';
import { hasStagePlus } from '../../lib/subscriptionUtils';
import { canResolveDisputeWithScore } from '../../lib/gameDayResultFlow';
import { absoluteProofUrl, isStageAdmin, parseSubmission } from '../../lib/adminDisputes';
import {
  clubInitials,
  formatBroadcastUnit,
  getKickoffCountdownParts,
  pad2,
} from '../../lib/gameDayPresentation';

describe('gameDayOps', () => {
  test('parses seated player lists', () => {
    expect(parseIdList('["a","b"]')).toEqual(['a', 'b']);
    expect(countSeated(['x'])).toBe(1);
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

  test('club kickoff needs both dressing rooms', () => {
    expect(bothDressingRoomsReady(true, { home: 1, away: 0 })).toBe(false);
    expect(bothDressingRoomsReady(true, { home: 1, away: 1 })).toBe(true);
    expect(bothDressingRoomsReady(false, { home: 0, away: 0 })).toBe(true);
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
});
