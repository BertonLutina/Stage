import {
  buildTournamentStages,
  stageMatchSections,
  canScheduleTournamentMatch,
  isStageResult,
  stageAggregate,
} from '../../lib/tournamentStages';

describe('tournamentStages', () => {
  test('knockout stages include future rounds without inventing participants', () => {
    const stages = buildTournamentStages(
      { type: 'knockout', max_teams: 8 },
      [{ id: 'one', type: 'knockout', round: 1, status: 'scheduled' }],
    );
    expect(stages.map((s) => s.label)).toEqual([
      'Quarterfinals', 'Semifinals', 'Third-Place Playoff', 'Final',
    ]);
    expect(stages[0].matches).toHaveLength(1);
    expect(stages[1].matches).toHaveLength(0);
  });

  test('UCL legs share one stage, including when only second-leg results remain', () => {
    const matches = [9, 10].map((round) => ({
      id: String(round),
      type: 'ucl_playoff',
      round,
      result_state: 'CONFIRMED',
      status: round === 9 ? 'completed' : 'scheduled',
    }));
    const stages = buildTournamentStages({ type: 'swiss_ucl', max_teams: 36 }, matches);
    const stage = stages.find((s) => s.id === 'playoff');
    expect(stage.matches).toHaveLength(2);
    expect(stageMatchSections(stage).map((s) => s.label)).toEqual(['First leg', 'Second leg']);
    expect(stageMatchSections(stage, [matches[1]])[0].label).toBe('Second leg');
    expect(isStageResult(matches[0])).toBe(true);
    expect(isStageResult(matches[1])).toBe(false);
  });

  test('aggregate uses recorded legs in participant order and waits for both results', () => {
    const first = {
      home_player_id: 'a', away_player_id: 'b', home_score: 2, away_score: 1,
      status: 'completed', result_state: 'CONFIRMED',
    };
    const second = {
      home_player_id: 'b', away_player_id: 'a', home_score: 3, away_score: 0,
      status: 'forfeit',
    };
    const stage = { id: 'qf', matches: [first, second] };
    expect(stageAggregate(stage, first)).toEqual([2, 4]);
    expect(stageAggregate(stage, second)).toEqual([4, 2]);
    expect(stageAggregate({ ...stage, matches: [first, { ...second, status: 'scheduled' }] }, first)).toBeNull();
  });

  test('other formats retain their own rounds and byes remain results', () => {
    expect(buildTournamentStages({ type: 'swiss', max_teams: 8 }, []).map((s) => s.label))
      .toEqual(['Round 1', 'Round 2', 'Round 3']);
    expect(buildTournamentStages({ type: 'double_elimination', max_teams: 4 }, []).map((s) => s.label))
      .toEqual(['Semifinals', 'Final']);
    expect(isStageResult({ status: 'bye' })).toBe(true);
    expect(isStageResult({ status: 'cancelled' })).toBe(false);
  });

  test('group stages and leagues preserve groups and matchdays', () => {
    const matches = [
      { type: 'group', group_number: 1, round: 2 },
      { type: 'quarter_final', round: 3 },
      { type: 'quarter_final', round: 4 },
    ];
    const stages = buildTournamentStages({ type: 'group_stage', max_teams: 16, num_groups: 4 }, matches);
    expect(stages[0].label).toBe('Group Stage');
    expect(stageMatchSections(stages[0])[0].label).toBe('Group B · Matchday 2');
    expect(stageMatchSections(stages.find((s) => s.id === 'qf')).map((s) => s.label))
      .toEqual(['First leg', 'Second leg']);
    expect(buildTournamentStages({ type: 'league', max_teams: 8 }, []).map((s) => s.id)).toEqual(['league']);
    expect(buildTournamentStages({ type: 'group_stage', knockout_enabled: 0, max_teams: 8 }, []).map((s) => s.id))
      .toEqual(['group']);
  });

  test('scheduling belongs to the authenticated home player or home club manager', () => {
    const match = {
      status: 'scheduled',
      home_player_id: 'p1', away_player_id: 'p2',
      home_club_id: 'c1', away_club_id: 'c2',
    };
    const user = { id: 'u1' };
    expect(canScheduleTournamentMatch(match, { participant_type: 'player' }, user, { id: 'p1' })).toBe(true);
    expect(canScheduleTournamentMatch(match, { participant_type: 'player' }, user, { id: 'p2' })).toBe(false);
    expect(canScheduleTournamentMatch(match, {}, user, {}, [{ id: 'c1', president_user_id: 'u1' }])).toBe(true);
    expect(canScheduleTournamentMatch(match, {}, user, { club_id: 'c1' }, [{ id: 'c1', president_user_id: 'u2' }])).toBe(false);
    expect(canScheduleTournamentMatch({ ...match, status: 'completed' }, { participant_type: 'player' }, user, { id: 'p1' })).toBe(false);
    expect(canScheduleTournamentMatch({ ...match, scheduling_status: 'home_proposed' }, { participant_type: 'player' }, user, { id: 'p1' })).toBe(false);
  });
});
