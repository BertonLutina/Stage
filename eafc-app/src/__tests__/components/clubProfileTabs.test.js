import { readFileSync } from 'fs';
import { resolve } from 'path';

const source = readFileSync(resolve(__dirname, '../../app/(tabs)/profile/clubProfileTabs.jsx'), 'utf8');
const profile = readFileSync(resolve(__dirname, '../../app/(tabs)/profile/profilescreen.jsx'), 'utf8');
const officeTabs = readFileSync(resolve(__dirname, '../../lib/clubOfficeTabs.js'), 'utf8');

describe('club profile web parity (mobile)', () => {
  test('uses web club tab groups: posts, squad, stats, fixtures, trophies, chat, club office', () => {
    expect(source).toMatch(/buildClubTabGroups/);
    expect(source).toMatch(/GamerClubTabNav/);
    expect(officeTabs).toMatch(/Fixtures/);
    expect(officeTabs).toMatch(/club-office/);
    expect(source).not.toMatch(/PRIMARY_TABS/);
    expect(source).not.toMatch(/operations/);
  });

  test('squad uses premium cards with nationality and fixture availability', () => {
    expect(source).toMatch(/SquadPlayerCard/);
    expect(source).toMatch(/ClubFixturesPanel/);
    expect(source).toMatch(/ClubStatsPanel/);
    expect(source).toMatch(/ClubOfficePanel/);
    expect(source).toMatch(/Release player/);
  });

  test('player profile can request a loan from another club', () => {
    expect(profile).toMatch(/canShowLoanRequestButton/);
    expect(profile).toMatch(/RequestLoanDialog/);
    expect(profile).toMatch(/Request loan/);
  });
});
