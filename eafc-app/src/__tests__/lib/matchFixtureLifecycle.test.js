import fs from 'fs';
import path from 'path';
import {
  canConfirmMatchCancel,
  canRequestMatchCancel,
  isPlayerManagedMatch,
} from '../../lib/matchFixtureLifecycle';

const arranged = {
  id: 'match-1',
  status: 'scheduled',
  mode: 'solo',
  home_player_id: 'p-home',
  away_player_id: 'p-away',
  home_player_email: 'home@example.test',
  away_player_email: 'away@example.test',
};

describe('match fixture cancel confirmation', () => {
  test('one player can only request cancel; opponent must confirm', () => {
    const home = { email: 'home@example.test', playerId: 'p-home' };
    expect(isPlayerManagedMatch(arranged)).toBe(true);
    expect(canRequestMatchCancel(arranged, home)).toBe(true);
    expect(canConfirmMatchCancel(arranged, home)).toBe(false);
  });

  test('Game Day match detail exposes fixture cancel actions', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../app/(tabs)/matches/matchdetailscreen.jsx'),
      'utf8',
    );
    expect(source).toMatch(/GameDayFixtureActions/);
  });
});
