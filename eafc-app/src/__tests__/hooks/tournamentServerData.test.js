import { buildTournamentView } from '../../hooks/useTournament';

const tournament = { id: 't1', type: 'league', participant_type: 'club' };

describe('buildTournamentView — server endpoints first, derivation fallback', () => {
  test('prefers well-formed server standings over derivation', () => {
    const server = {
      standings: [
        { team_id: 'c1', club_name: 'Night Owls', played: 3, won: 2, drawn: 1, lost: 0, gf: 6, ga: 2, pts: 7, rank: 1 },
        { team_id: 'c2', club_name: 'Red Foxes', played: 3, won: 1, drawn: 0, lost: 2, gf: 3, ga: 5, pts: 3, rank: 2 },
      ],
    };
    const view = buildTournamentView(tournament, [], server);
    expect(view.standings).toHaveLength(2);
    expect(view.standings[0]).toMatchObject({
      name: 'Night Owls', P: 3, W: 2, D: 1, L: 0, GF: 6, GA: 2, GD: 4, Pts: 7, rank: 1,
    });
  });

  test('falls back to the client derivation when server standings are empty', () => {
    const view = buildTournamentView(tournament, [], { standings: [] });
    expect(view.standings).toEqual([]);
  });

  test('ignores partial server standings (a row without a name) and derives instead', () => {
    const view = buildTournamentView(tournament, [], { standings: [{ team_id: 'c1', played: 1, pts: 3 }] });
    expect(view.standings).toEqual([]);
  });

  test('prefers server brackets, flattening rounds into the match list', () => {
    const server = {
      brackets: [
        { name: 'Semi-finals', matches: [{ id: 'm1' }, { id: 'm2' }] },
        { name: 'Final', matches: [{ id: 'm3' }] },
      ],
    };
    const view = buildTournamentView(tournament, [], server);
    expect(view.bracketMatches.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
  });

  test('falls back to derived bracket matches when server brackets are empty', () => {
    const matches = [{ id: 'k1', type: 'knockout', status: 'scheduled' }];
    const view = buildTournamentView(tournament, matches, { brackets: [] });
    expect(view.bracketMatches.map((m) => m.id)).toEqual(['k1']);
  });

  test('works with no server data at all (unchanged behaviour)', () => {
    const view = buildTournamentView(tournament, []);
    expect(view.standings).toEqual([]);
    expect(view.bracketMatches).toEqual([]);
  });
});
