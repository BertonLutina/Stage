import { readFileSync } from 'fs';
import { resolve } from 'path';

function readRepoFile(path) {
  return readFileSync(resolve(__dirname, '../..', path), 'utf8');
}

describe('Home identity plate', () => {
  const lab = readRepoFile('components/dashboard/DashboardLayoutLab.jsx');

  test('every layout opens with the player identity plate, then the next-match strip', () => {
    expect(lab).toMatch(/function PlayerIdentityHero/);
    expect(lab).toMatch(/<FutIdentityCard/);
    expect(lab).toMatch(/variant="overlay"/);
    expect(lab).toMatch(/overall=\{player\?\.overall_rating/);

    const layouts = lab.split(/function Layout[ABCD]\(/).slice(1);
    expect(layouts).toHaveLength(4);
    layouts.forEach((body) => {
      const hero = body.indexOf('<PlayerIdentityHero');
      const match = body.indexOf('<KickoffCard');
      expect(hero).toBeGreaterThan(-1);
      expect(match).toBeGreaterThan(hero);
    });
  });

  test('Home plate reuses the profile overlay card, not a tradable item card', () => {
    expect(lab).toMatch(/onPress=\{openProfile\}/);
    expect(lab).toMatch(/\/\(tabs\)\/profile\/profilescreen/);
    expect(lab).not.toMatch(/COMMAND CENTER/);
    expect(lab).not.toMatch(/KICKOFF/);
    expect(lab).not.toMatch(/DashboardRankRing/);
    expect(lab).not.toMatch(/ULTIMATE TEAM|FUT form|FUT activity|FutBlock|futActivity/);
    expect(lab).not.toMatch(/Find Club|Find a club|find a club|searchclubs/);
  });
});
