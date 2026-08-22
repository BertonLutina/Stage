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

  test('cards under the player identity plate use a 2px radius', () => {
    const theme = readRepoFile('lib/stageTheme.js');
    const ui = readRepoFile('components/dashboard/CommandCenterUI.jsx');
    expect(theme).toMatch(/export const CARD_RADIUS = 2/);
    expect(ui).toMatch(/export const DASHBOARD_CARD_RADIUS = CARD_RADIUS/);
    expect(lab).toMatch(/function DashCard/);
    expect(lab).toMatch(/radius=\{DASHBOARD_CARD_RADIUS\}/);
    expect(lab).toMatch(/KickoffCard[\s\S]*borderRadius: DASHBOARD_CARD_RADIUS/);
  });

  test('player and club identity cards keep their own radii', () => {
    const player = readRepoFile('components/profile/gamer/GamerProfileUI.jsx');
    const club = readRepoFile('components/club/ClubIdentityCard.jsx');
    const crest = readRepoFile('components/dashboard/CommandCenterUI.jsx');
    expect(player).toMatch(/export function FutIdentityCard/);
    expect(player).toMatch(/style=\{\{ borderRadius: 18, padding: 2\.5 \}\}/);
    expect(club).toMatch(/TrapeziumPhotoCard/);
    expect(club).not.toMatch(/CARD_RADIUS/);
    expect(crest).toMatch(/export function ClubCrest/);
    expect(crest).toMatch(/borderRadius: 16, overflow: 'hidden'/);
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
