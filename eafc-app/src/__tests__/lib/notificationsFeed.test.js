import {
  groupNotifications, iconForType, notificationTimeLabel, prepareNotifications, unreadCount,
} from '../../lib/notificationsFeed';

// Wed 11 Nov 2026, 15:00 UTC
const NOW = new Date('2026-11-11T15:00:00Z').getTime();
const at = (iso) => new Date(iso).toISOString();

const rows = [
  { id: 'a', type: 'result_submitted', title: 'Score to confirm', body: 'Red Foxes reported 2 – 1.', read: 0, link: '/matches/m1', created_date: at('2026-11-11T13:58:00Z') },
  { id: 'b', type: 'contract_offer', title: 'New contract offer', body: 'Blue Comets offer you 20 games.', read: 0, created_date: at('2026-11-11T09:00:00Z') },
  { id: 'c', type: 'match_result', title: 'Lineup published', body: 'You start.', read: 1, created_date: at('2026-11-11T05:00:00Z') },
  { id: 'd', type: 'tournament_start', title: 'Registration approved', body: 'In the cup.', read: 1, created_date: at('2026-11-09T12:00:00Z') },
  { id: 'e', type: 'announcement', title: 'Old news', body: '', read: 1, created_date: at('2026-10-01T12:00:00Z') },
];

describe('prepareNotifications', () => {
  test('sorts newest first and normalises read / unread', () => {
    const list = prepareNotifications([rows[3], rows[0], rows[2]]);
    expect(list.map((n) => n.id)).toEqual(['a', 'c', 'd']);
    expect(list[0].unread).toBe(true);
    expect(list[1].unread).toBe(false);
  });

  test('is_read wins over read, and a missing flag counts as unread', () => {
    const [n] = prepareNotifications([{ id: 'z', is_read: true, read: 0, created_date: at('2026-11-11T10:00:00Z') }]);
    expect(n.unread).toBe(false);
    expect(prepareNotifications([{ id: 'y', created_date: at('2026-11-11T10:00:00Z') }])[0].unread).toBe(true);
  });

  test('keeps the server title and body, never invents text', () => {
    const [n] = prepareNotifications([{ id: 'q', created_date: at('2026-11-11T10:00:00Z') }]);
    expect(n.title).toBe('');
    expect(n.body).toBe('');
  });

  test('resolves the link to an app route, null when unknown', () => {
    const list = prepareNotifications([rows[0], rows[1]]);
    expect(list.find((n) => n.id === 'a').href).toEqual({ pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId: 'm1' } });
    expect(list.find((n) => n.id === 'b').href).toBeNull();
  });
});

describe('groupNotifications', () => {
  test('today, this week, earlier — empty groups are dropped', () => {
    const groups = groupNotifications(prepareNotifications(rows), NOW);
    expect(groups.map((g) => g.key)).toEqual(['today', 'week', 'earlier']);
    expect(groups[0].items.map((n) => n.id)).toEqual(['a', 'b', 'c']);
    expect(groups[1].items.map((n) => n.id)).toEqual(['d']);
    expect(groups[2].items.map((n) => n.id)).toEqual(['e']);
    expect(groupNotifications(prepareNotifications([rows[0]]), NOW).map((g) => g.key)).toEqual(['today']);
    expect(groupNotifications([], NOW)).toEqual([]);
  });
});

describe('helpers', () => {
  test('unreadCount', () => {
    expect(unreadCount(prepareNotifications(rows))).toBe(2);
  });

  test('time label: clock today, weekday this week, date earlier', () => {
    const opts = { timeZone: 'UTC' };
    expect(notificationTimeLabel(at('2026-11-11T13:58:00Z'), NOW, 'en', opts)).toBe('13:58');
    expect(notificationTimeLabel(at('2026-11-09T12:00:00Z'), NOW, 'en', opts)).toBe('Mon');
    expect(notificationTimeLabel(at('2026-10-01T12:00:00Z'), NOW, 'en', opts)).toBe('1 Oct');
    expect(notificationTimeLabel(null, NOW, 'en')).toBe('');
  });

  test('icon by type, with a default', () => {
    expect(iconForType('contract_offer')).toBe('document-text-outline');
    expect(iconForType('match_result')).toBe('football-outline');
    expect(iconForType('tournament_start')).toBe('trophy-outline');
    expect(iconForType('whatever')).toBe('notifications-outline');
  });
});
