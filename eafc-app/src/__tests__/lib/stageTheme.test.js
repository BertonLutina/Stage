import { readStageTheme } from '../../lib/stageTheme';

describe('stage theme palettes', () => {
  test('defaults to STAGE dark mint used on web', () => {
    const theme = readStageTheme();
    expect(theme.primary).toBe('#00E5BD');
    expect(theme.bg).toBe('#040d1a');
  });
});
