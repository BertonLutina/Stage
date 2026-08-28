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
    expect(read('../../app/(tabs)/_layout.jsx')).toMatch(/bottom: tabBottom/);
  });
});
