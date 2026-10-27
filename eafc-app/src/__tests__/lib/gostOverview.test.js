import { clubPathway, qualificationRange } from '../../lib/gostOverview';

describe('gostOverview', () => {
  test('qualificationRange uses STAGE rules', () => {
    expect(qualificationRange('supreme')).toBe('1 – 6');
    expect(qualificationRange('elite')).toBe('7 – 12');
    expect(qualificationRange('missing')).toBe('Not configured');
  });

  test('clubPathway guides guests without a club', () => {
    expect(clubPathway(null, [], [], []).text).toMatch(/Join a regional club/);
  });

  test('clubPathway reports provisional GOST destination', () => {
    const club = { id: 'c1', name: 'Alpha' };
    const league = {
      id: 'l1',
      name: 'Premier',
      division: 1,
      season_number: 3,
      status: 'active',
      slug: 'uk-ireland-div-1',
    };
    const path = clubPathway(
      club,
      [league],
      [{ club_id: 'c1', league_id: 'l1', played: 4, position: 2 }],
      [],
    );
    expect(path.destination).toBe('STAGE Supreme League');
    expect(path.text).toMatch(/Provisional position: 2/);
  });
});
