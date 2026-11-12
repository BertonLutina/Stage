const mockGet = jest.fn();
jest.mock('../../api/stageClient', () => ({ stageClient: { http: { get: (...a) => mockGet(...a) } } }));

import {
  BEAT_SECTIONS,
  loadBeatNews,
  loadMercatoNews,
  loadWorldNews,
  newsTimeLabel,
  mercatoToItem,
  storyToItem,
} from '../../lib/newsFeed';

const NOW = new Date('2026-11-11T12:00:00Z').getTime();
const t = (key, vars) => (vars ? `${key}:${JSON.stringify(vars)}` : key);

beforeEach(() => mockGet.mockReset());

describe('storyToItem', () => {
  test('keeps the server title, photo and time; never invents a body', () => {
    const item = storyToItem({ id: 's1', beat: 'competitions', title: 'GOST group draw', body: '', photo_url: 'http://img', published_at: '2026-11-11T07:00:00.000Z' });
    expect(item).toMatchObject({ id: 's1', section: 'competitions', title: 'GOST group draw', photoUrl: 'http://img' });
    expect(item.at).toBe(new Date('2026-11-11T07:00:00.000Z').getTime());
    expect(item.body).toBe('');
  });

  test('a story with no title is dropped', () => {
    expect(storyToItem({ id: 's2', beat: 'club_news', title: '' })).toBeNull();
    expect(storyToItem(null)).toBeNull();
  });
});

describe('mercatoToItem', () => {
  test('uses the headline, else player to club', () => {
    expect(mercatoToItem({ id: 1, headline: 'Kaze joins Night Owls FC', last_updated_at: '2026-11-10T10:00:00Z' }).title).toBe('Kaze joins Night Owls FC');
    expect(mercatoToItem({ id: 2, player_name: 'Kaze', to_club_name: 'Night Owls' }).title).toBe('Kaze → Night Owls');
    expect(mercatoToItem({ id: 3 })).toBeNull();
  });

  test('section is mercato and the photo is the player avatar', () => {
    const item = mercatoToItem({ id: 4, player_name: 'Kaze', to_club_name: 'NO', player_avatar_url: 'http://a' });
    expect(item.section).toBe('mercato');
    expect(item.photoUrl).toBe('http://a');
    expect(item.id).toBe('mercato_4');
  });
});

describe('loaders', () => {
  test('world news reads /news-desks/world_news, newest first', async () => {
    mockGet.mockResolvedValue({ feed: [
      { id: 'a', beat: 'club_news', title: 'Old', published_at: '2026-11-01T00:00:00Z' },
      { id: 'b', beat: 'mercato', title: 'New', published_at: '2026-11-11T00:00:00Z' },
    ] });
    const items = await loadWorldNews();
    expect(mockGet).toHaveBeenCalledWith('/news-desks/world_news');
    expect(items.map((i) => i.id)).toEqual(['b', 'a']);
  });

  test('mercato reads the real mercato desk', async () => {
    mockGet.mockResolvedValue({ feed: [{ id: 9, headline: 'Deal done', last_updated_at: '2026-11-11T00:00:00Z' }] });
    const items = await loadMercatoNews();
    expect(mockGet).toHaveBeenCalledWith('/mercato-transfers/desk');
    expect(items).toHaveLength(1);
    expect(items[0].section).toBe('mercato');
  });

  test('mercato desk without a feed is an error', async () => {
    mockGet.mockResolvedValue({});
    await expect(loadMercatoNews()).rejects.toThrow();
  });

  test('beat merges the four desks and sorts them newest first', async () => {
    expect(BEAT_SECTIONS).toEqual(['club_news', 'player_news', 'tournament', 'competitions']);
    mockGet.mockImplementation((path) => {
      const section = path.split('/').pop();
      return Promise.resolve({ feed: [{ id: section, beat: section, title: section, published_at: { club_news: '2026-11-01', player_news: '2026-11-04', tournament: '2026-11-03', competitions: '2026-11-02' }[section] }] });
    });
    const items = await loadBeatNews();
    expect(items.map((i) => i.id)).toEqual(['player_news', 'tournament', 'competitions', 'club_news']);
  });

  test('beat survives one failing desk but fails when all fail', async () => {
    mockGet.mockImplementation((path) => (path.endsWith('club_news')
      ? Promise.reject(new Error('x'))
      : Promise.resolve({ feed: [{ id: path, beat: 'x', title: 'ok', published_at: '2026-11-01' }] })));
    expect(await loadBeatNews()).toHaveLength(3);
    mockGet.mockRejectedValue(new Error('down'));
    await expect(loadBeatNews()).rejects.toThrow('down');
  });
});

describe('newsTimeLabel', () => {
  const at = (iso) => new Date(iso).getTime();
  test('minutes, hours, yesterday, weekday, date', () => {
    expect(newsTimeLabel(at('2026-11-11T11:30:00Z'), NOW, t)).toBe('stage.news.minutesAgo:{"n":30}');
    expect(newsTimeLabel(at('2026-11-11T07:00:00Z'), NOW, t)).toBe('stage.news.hoursAgo:{"n":5}');
    expect(newsTimeLabel(at('2026-11-10T09:00:00Z'), NOW, t)).toBe('stage.news.yesterday');
    expect(newsTimeLabel(at('2026-11-08T09:00:00Z'), NOW, t, 'en')).toMatch(/^Sun/);
    expect(newsTimeLabel(at('2026-10-01T09:00:00Z'), NOW, t, 'en')).toMatch(/1 Oct/);
    expect(newsTimeLabel(0, NOW, t)).toBe('');
  });
});
