const fs = require('fs');
const path = require('path');
import { PAGE_BOTTOM_PAD, pageBottomPad } from '../../lib/pageInsets';

function read(rel) {
  return fs.readFileSync(path.join(__dirname, rel), 'utf8');
}

describe('page bottom inset', () => {
  it('never goes below 30 when the device inset is missing or smaller', () => {
    expect(PAGE_BOTTOM_PAD).toBe(30);
    expect(pageBottomPad(0)).toBe(30);
    expect(pageBottomPad(16)).toBe(30);
    expect(pageBottomPad(48)).toBe(48);
  });

  it('pads the shared page shell and the tab bar with that inset', () => {
    expect(read('../../components/profile/gamer/GamerProfileUI.jsx')).toMatch(/pageBottomPad\(insets\.bottom\)/);
    expect(read('../../components/ui/FloatingTabBar.jsx')).toMatch(/bottom: tabBottom/);
  });

  it('tab pages take their bottom clearance (tab bar + Guide button) from the shared helper, inset included', () => {
    const profile = read('../../app/(tabs)/profile/index.jsx');
    expect(profile).toMatch(/guideFabClearance\(insets\.bottom\)/);
    expect(profile).not.toMatch(/TAB_BAR_/);
    const fixtures = read('../../app/(tabs)/tournaments/fixturesscreen.jsx');
    expect(fixtures).toMatch(/guideFabClearance\(insets\.bottom\)/);
    expect(fixtures).not.toMatch(/TAB_BAR_/);
    const screen = read('../../components/ui/Screen.jsx');
    expect(screen).toMatch(/guideFabClearance\(insets\.bottom\)/);
    expect(screen).not.toMatch(/TAB_BAR_/);
  });
});
