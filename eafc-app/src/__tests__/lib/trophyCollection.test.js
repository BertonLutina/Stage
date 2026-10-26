import { buildTrophyCollection, collectionLabel, loadTrophyCatalogue } from '../../lib/trophyCollection';

const cup = { id: 'cup', name: 'October Cup', image_url: '/cup.png' };

test('no earned awards still shows the locked catalogue', () => {
  const entries = buildTrophyCollection([cup, { id: 'secret', name: 'Admin Cup', admin_only: 1 }], [], []);
  expect(entries).toHaveLength(1);
  expect(entries[0].state).toBe('locked');
  expect(entries[0].label).toBe('Win to unlock.');
});

test('catalogue stays visible after every earned copy is placed', () => {
  const award = { id: 'a', persisted: true, status: 'earned', trophy_item_id: 'cup' };
  const placed = buildTrophyCollection([cup], [award], [{ id: 'p', award_id: 'a', locked_at: '2026-10-01' }]);
  expect(placed[0].state).toBe('placed');
  expect(placed[0].label).toBe(collectionLabel('placed'));
  const again = buildTrophyCollection(
    [cup],
    [award, { ...award, id: 'b' }],
    [{ id: 'p', award_id: 'a', locked_at: '2026-10-01' }],
  );
  expect(again[0].state).toBe('available');
  expect(again[0].available.map((copy) => copy.id)).toEqual(['b']);
});

test('a draft copy is not available to place twice', () => {
  const award = { id: 'a', persisted: true, status: 'earned', trophy_item_id: 'cup' };
  const entries = buildTrophyCollection([cup], [award], [{ id: 'p', award_id: 'a', locked_at: null }]);
  expect(entries[0].state).toBe('draft');
  expect(entries[0].available).toHaveLength(0);
});

test('an empty history shows locked designs and a failed load stays unknown', () => {
  expect(buildTrophyCollection([cup], [], []).every((entry) => entry.state === 'locked')).toBe(true);
  const unknown = buildTrophyCollection([cup], null, []);
  expect(unknown[0].state).toBe('unknown');
  expect(unknown[0].label).toBe('Availability unknown.');
});

test('earned copies stay visible when the catalogue response is empty', () => {
  const award = { id: 'a', persisted: true, status: 'earned', trophy_item_id: 'cup', display_name: 'October’s Very Own Trophy — 2026' };
  const entries = buildTrophyCollection([], [award], []);
  expect(entries).toHaveLength(1);
  expect(entries[0].state).toBe('available');
  expect(entries[0].design.name).toBe(award.display_name);
});

test('catalogue paging keeps every page', async () => {
  const pages = [[{ id: 'a' }, { id: 'b' }], [{ id: 'c' }]];
  const items = await loadTrophyCatalogue(({ offset }) => pages[offset === 0 ? 0 : 1], 2);
  expect(items.map((item) => item.id)).toEqual(['a', 'b', 'c']);
});
