import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { loadMercatoDesk, loadNewsDesk } from '@/lib/stageNews';
import { loadNews } from '@/lib/stageDirectories';
import StageTimesNews from '../../components/news/StageTimesNews';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
}));

jest.mock('@/lib/stageNews', () => {
  const actual = jest.requireActual('../../lib/stageNews');
  return {
    ...actual,
    loadNewsDesk: jest.fn(),
    loadMercatoDesk: jest.fn(),
    loadMercatoTransfer: jest.fn(async () => null),
  };
});

jest.mock('@/lib/stageDirectories', () => {
  const actual = jest.requireActual('../../lib/stageDirectories');
  return {
    ...actual,
    loadNews: jest.fn(async () => ({ items: [] })),
  };
});

describe('STAGE TIMES mobile news', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
    loadNewsDesk.mockReset();
    loadMercatoDesk.mockReset();
    loadNews.mockReset();
    loadNews.mockResolvedValue({
      items: [{
        id: 'n1',
        title: 'Neo joined Ajax',
        body: 'Contract signed.',
        _category: 'transfers',
        player_name: 'Neo',
        player_avatar_url: 'https://img.test/neo.jpg',
        club_name: 'Ajax',
      }],
    });
    loadNewsDesk.mockImplementation(async (section) => {
      if (section === 'world_news') {
        return {
          kicker: 'World News',
          line: 'Pick a continent',
          feed: [],
          continents: [
            { id: 'europe', name: 'Europe', kicker: 'UEFA desk', count: 2 },
            { id: 'asia', name: 'Asia', kicker: 'AFC desk', count: 1 },
          ],
          countries: [
            { code: 'BE', name: 'Belgium', continent: 'europe', count: 2 },
            { code: 'JP', name: 'Japan', continent: 'asia', count: 1 },
          ],
          board: {},
        };
      }
      if (section === 'daily_news') {
        return { kicker: 'Daily News', line: 'Today', feed: [], board: { club: [], player: [], mercato: [] } };
      }
      return { kicker: section, line: 'Live tape', feed: [], fields: [], board: {} };
    });
    loadMercatoDesk.mockResolvedValue({
      feed: [{
        id: 't1',
        headline: 'Neo to Ajax',
        player_name: 'Neo',
        player_avatar_url: 'https://img.test/neo.jpg',
        to_club_name: 'Ajax',
        transfer_fee: 12_000_000,
        status: 'official',
        player_id: 'p1',
      }],
      top: {},
      rankings: {},
      deadline: { active: false },
    });
  });

  test("prints THE STAGE TIMES masthead with All first and Mercato next", async () => {
    const { getByText, getAllByText } = render(<StageTimesNews />);

    expect(getByText('THE STAGE TIMES')).toBeTruthy();
    expect(getByText('Mercato')).toBeTruthy();
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Club News')).toBeTruthy();
    expect(getByText('Player News')).toBeTruthy();
    expect(getByText('Tournaments')).toBeTruthy();
    expect(getByText('Competitions')).toBeTruthy();
    expect(getAllByText('Daily News').length).toBeGreaterThan(0);
    expect(getByText('World News')).toBeTruthy();

    await waitFor(() => expect(loadNews).toHaveBeenCalled());
    expect(getByText('Neo joined Ajax')).toBeTruthy();
    expect(getByText('Transfers')).toBeTruthy();
  });

  test('World News opens the geographic map and country picker', async () => {
    const { getByText, getAllByText } = render(<StageTimesNews initialSection="world_news" />);

    await waitFor(() => expect(getByText('AFC desk')).toBeTruthy());
    expect(getByText('UEFA desk')).toBeTruthy();
    expect(getAllByText('Asia').length).toBeGreaterThan(0);
    expect(getByText('Select a country after a continent on the map.')).toBeTruthy();

    fireEvent.press(getByText('AFC desk'));
    await waitFor(() => expect(getByText('Asia Live')).toBeTruthy());
    expect(getByText(/Japan/)).toBeTruthy();
    expect(getByText('No news from this place yet.')).toBeTruthy();
  });

  test('All tab opens the mixed newspaper front', async () => {
    loadNews.mockResolvedValue({ items: [] });
    const { getByText } = render(<StageTimesNews />);
    fireEvent.press(getByText('All'));
    await waitFor(() => expect(loadNews).toHaveBeenCalled());
    expect(getByText('Nothing here yet.')).toBeTruthy();
  });
});
