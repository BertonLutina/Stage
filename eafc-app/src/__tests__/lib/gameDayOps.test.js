import {
  bothDressingRoomsReady,
  buildResultPayload,
  canKickoffMatch,
  countSeated,
  minutesUntil,
  parseIdList,
  resolveMatchSides,
} from '../../lib/gameDayOps';
import { getResultSubmissionControls } from '../../lib/gameDayResultFlow';
import { applyWagerOptimistic, formatStc } from '../../lib/wagerActions';
import { roleForClub } from '../../lib/scheduleEngine';
import { sortStandings } from '../../lib/competitionUtils';
import { hasStagePlus } from '../../lib/subscriptionUtils';

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

  test('resolves club and solo sides', () => {
    const club = resolveMatchSides(
      { mode: 'club', home_club_id: 'c1', away_club_id: 'c2', home_club_name: 'Home', away_club_name: 'Away' },
      { id: 'c1' },
      { id: 'p1' },
    );
    expect(club.isMyMatch).toBe(true);
    expect(club.amIHomeTeam).toBe(true);
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
      proof_url: 'https://proof',
    }));
  });

  test('minutesUntil is finite for valid dates', () => {
    expect(minutesUntil(null)).toBeNull();
    expect(typeof minutesUntil(new Date().toISOString())).toBe('number');
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
});
