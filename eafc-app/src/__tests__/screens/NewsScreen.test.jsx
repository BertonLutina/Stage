import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

jest.setTimeout(30000);

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: jest.fn() }) }));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

const mockGet = jest.fn();
jest.mock('../../api/stageClient', () => ({ stageClient: { http: { get: (...a) => mockGet(...a) } } }));

import NewsScreen from '../../app/apps/news';

const ago = (ms) => new Date(Date.now() - ms).toISOString();
const H = 3600000;

const WORLD = { feed: [
  { id: 'w1', beat: 'club_news', title: 'Blue Comets stay unbeaten after ten games', photo_url: 'http://img/1.jpg', published_at: ago(2 * H) },
  { id: 'w2', beat: 'competitions', title: 'GOST group draw: who meets who', published_at: ago(5 * H) },
  { id: 'w3', beat: 'mercato', title: 'Kaze joins Night Owls FC', published_at: ago(30 * H) },
] };
const MERCATO = { feed: [
  { id: 1, headline: 'Rumour: Neo to Ajax', last_updated_at: ago(1 * H) },
  { id: 2, player_name: 'Kaze', to_club_name: 'Night Owls', last_updated_at: ago(3 * H) },
] };

function route(map) {
  mockGet.mockImplementation((path) => {
    if (path in map) {
      const v = map[path];
      return v instanceof Error ? Promise.reject(v) : Promise.resolve(v);
    }
    return Promise.resolve({ feed: [] });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  act(() => { useThemeStore.getState().setStageTheme('theme-dark'); });
  route({ '/news-desks/world_news': WORLD, '/mercato-transfers/desk': MERCATO });
});

describe('News screen', () => {
  test('World tab: a headline card then a list, newest first, with section and time', async () => {
    const { findByText, getByText, getAllByText } = render(<NewsScreen />);
    expect(await findByText('Blue Comets stay unbeaten after ten games')).toBeTruthy();
    expect(getByText('Headline')).toBeTruthy();
    expect(getByText('2 h ago')).toBeTruthy();
    expect(getByText('GOST group draw: who meets who')).toBeTruthy();
    expect(getByText('Competitions · 5 h ago')).toBeTruthy();
    expect(getByText('Mercato · yesterday')).toBeTruthy();
    expect(getAllByText(/ago|yesterday/).length).toBeGreaterThan(2);
    expect(mockGet).toHaveBeenCalledWith('/news-desks/world_news');
  });

  test('has the three tabs, World selected first', async () => {
    const { findByLabelText, findByText } = render(<NewsScreen />);
    await findByText('GOST group draw: who meets who');
    const world = await findByLabelText('World');
    expect(world.props.accessibilityRole).toBe('tab');
    expect(world.props.accessibilityState.selected).toBe(true);
    expect((await findByLabelText('Mercato')).props.accessibilityState.selected).toBe(false);
    expect((await findByLabelText('Beat')).props.accessibilityState.selected).toBe(false);
  });

  test('Mercato tab reads the real mercato desk', async () => {
    const { findByLabelText, findByText } = render(<NewsScreen />);
    await findByText('GOST group draw: who meets who');
    fireEvent.press(await findByLabelText('Mercato'));
    expect(await findByText('Rumour: Neo to Ajax')).toBeTruthy();
    expect(await findByText('Kaze → Night Owls')).toBeTruthy();
    expect(mockGet).toHaveBeenCalledWith('/mercato-transfers/desk');
  });

  test('Beat tab merges the four desks', async () => {
    const { findByLabelText, findByText, getByText } = render(<NewsScreen />);
    await findByText('GOST group draw: who meets who');
    route({
      '/news-desks/club_news': { feed: [{ id: 'c', beat: 'club_news', title: 'Stadium upgraded', published_at: ago(H) }] },
      '/news-desks/player_news': { feed: [{ id: 'p', beat: 'player_news', title: 'Kaze hits rank 1', published_at: ago(2 * H) }] },
      '/news-desks/tournament': { feed: [] },
      '/news-desks/competitions': { feed: [{ id: 'k', beat: 'competitions', title: 'Benelux Cup recap', published_at: ago(3 * H) }] },
    });
    fireEvent.press(await findByLabelText('Beat'));
    expect(await findByText('Stadium upgraded')).toBeTruthy();
    expect(getByText('Kaze hits rank 1')).toBeTruthy();
    expect(getByText('Benelux Cup recap')).toBeTruthy();
  });

  test('switching tab shows skeletons, never the previous tab stories', async () => {
    const { findByText, findByLabelText, getByTestId, queryByText } = render(<NewsScreen />);
    await findByText('GOST group draw: who meets who');
    mockGet.mockReturnValue(new Promise(() => {}));
    fireEvent.press(await findByLabelText('Mercato'));
    await waitFor(() => expect(getByTestId('skeleton-list')).toBeTruthy());
    expect(queryByText('GOST group draw: who meets who')).toBeNull();
  });

  test('shows skeletons while loading', async () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { getByTestId } = render(<NewsScreen />);
    expect(getByTestId('skeleton-list')).toBeTruthy();
  });

  test('empty desk shows an empty state, not fake stories', async () => {
    route({ '/news-desks/world_news': { feed: [] } });
    const { findByText } = render(<NewsScreen />);
    expect(await findByText('No news yet')).toBeTruthy();
  });

  test('error with Retry recovers', async () => {
    route({ '/news-desks/world_news': new Error('offline') });
    const { findByText, getByText } = render(<NewsScreen />);
    expect(await findByText('offline')).toBeTruthy();
    route({ '/news-desks/world_news': WORLD });
    fireEvent.press(getByText('Retry'));
    expect(await findByText('GOST group draw: who meets who')).toBeTruthy();
  });

  test('a single story still shows as the headline', async () => {
    route({ '/news-desks/world_news': { feed: [WORLD.feed[0]] } });
    const { findByText, getByText } = render(<NewsScreen />);
    expect(await findByText('Blue Comets stay unbeaten after ten games')).toBeTruthy();
    expect(getByText('Headline')).toBeTruthy();
  });

  test('back button goes back', async () => {
    const { findByLabelText, findByText } = render(<NewsScreen />);
    await findByText('GOST group draw: who meets who');
    fireEvent.press(await findByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
