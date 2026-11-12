import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => React.createElement(View, { style }, children) };
});
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { BlurView: ({ children, style }) => React.createElement(View, { style }, children) };
});
jest.mock('expo-image-picker', () => ({}));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('../../lib/uploadProfileMedia', () => ({ uploadLocalMedia: jest.fn() }));
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({ presidentClub: { id: 'c-own' } })),
  stageClient: {
    auth: { me: () => Promise.resolve({}) },
    entities: { Player: { filter: () => Promise.resolve([]), list: () => Promise.resolve([]) } },
    http: { get: jest.fn(() => Promise.resolve({})), patch: jest.fn() },
    integrations: { Core: { UploadFile: jest.fn() } },
  },
}));
jest.mock('../../lib/stageDirectories', () => {
  const actual = jest.requireActual('../../lib/stageDirectories');
  return {
    ...actual,
    loadPlayerDirectory: jest.fn(() => Promise.resolve({
      players: [
        { id: 'p1', gamertag: 'Kaze', position: 'CAM', platform: 'PS5', overall_rating: 87 },
        { id: 'p2', gamertag: 'Vix', position: 'ST', platform: 'PS5', overall_rating: 85 },
      ],
    })),
    loadClubDirectory: jest.fn(() => Promise.resolve([
      { id: 'c1', name: 'Red Foxes', tag: 'RFX', region: 'EU', platform: 'PS5', overall_rating: 80 },
    ])),
  };
});

const SearchIndex = require('../../app/(tabs)/search/index').default;
const AppsIndex = require('../../app/apps/index').default;
const SearchPlayers = require('../../app/(tabs)/search/searchplayer').default;
const SearchClubs = require('../../app/(tabs)/search/searchclubs').default;
const FindPlayers = require('../../app/apps/find-players').default;
const FindClubs = require('../../app/apps/find-clubs').default;
const { DirectoryPlayerList, DirectoryClubList } = require('../../components/directory/DirectoryLists');
const DirectoryDetailSheet = require('../../components/directory/DirectoryDetailSheet').default;
const FilterListBox = require('../../components/directory/FilterListBox').default;

const HEX = /#[0-9A-Fa-f]{6}\b/;
function strayHex(toJSON) {
  const seen = [];
  const walk = (node) => {
    if (!node || typeof node === 'string') return;
    if (node.props?.style) {
      const flat = StyleSheet.flatten(node.props.style) || {};
      Object.values(flat).forEach((v) => { if (typeof v === 'string' && HEX.test(v) && !seen.includes(v)) seen.push(v); });
    }
    (node.children || []).forEach(walk);
  };
  walk(toJSON());
  const tokens = useThemeStore.getState().tokens;
  const allowed = new Set(Object.values(tokens).filter((v) => typeof v === 'string'));
  return seen.filter((v) => !allowed.has(v));
}

beforeEach(() => {
  mockPush.mockClear();
  mockBack.mockClear();
});

describe('Apps directory', () => {
  test('owns the app grid, filter and navigation', () => {
    const { getByLabelText, getByText, queryByText, toJSON } = render(<AppsIndex />);
    expect(getByText('APP DIRECTORY')).toBeTruthy();
    expect(getByText('Find players')).toBeTruthy();
    expect(getByText('Club')).toBeTruthy();
    expect(getByText('Compete')).toBeTruthy();
    expect(getByText('Account')).toBeTruthy();
    fireEvent.press(getByLabelText('Find clubs'));
    expect(mockPush).toHaveBeenCalledWith('/apps/find-clubs');
    fireEvent.changeText(getByLabelText('Search apps'), 'zzzz-none');
    expect(getByText(/No apps match/)).toBeTruthy();
    expect(queryByText('Find players')).toBeNull();
    fireEvent.press(getByLabelText('Clear search'));
    expect(getByText('Find players')).toBeTruthy();
    expect(strayHex(toJSON)).toEqual([]);
  });
});

describe('Apps tile borders', () => {
  test('a ready tile uses the stronger border, a not-ready tile the dimmer one', () => {
    const miniApps = require('../../lib/miniApps');
    const real = miniApps.getMiniAppGroups;
    const spy = jest.spyOn(miniApps, 'getMiniAppGroups').mockImplementation((mode) => [{
      id: 'g', label: 'Group',
      items: [
        { ...real(mode)[0].items[0], id: 'ready-app', label: 'Ready App', ready: true },
        { ...real(mode)[0].items[0], id: 'soon-app', label: 'Soon App', ready: false },
      ],
    }]);
    try {
      const { getByLabelText } = render(<AppsIndex />);
      const tokens = useThemeStore.getState().tokens;
      const border = (label) => StyleSheet.flatten(getByLabelText(label).props.style).borderColor;
      expect(border('Ready App')).toBe(tokens.borderStrong);
      expect(border('Soon App')).toBe(tokens.border);
      expect(tokens.borderStrong).not.toBe(tokens.border);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('search tab directories', () => {
  test('combines players and clubs behind a segmented control', async () => {
    const { findByText, getByLabelText, getByText, queryByText, toJSON } = render(<SearchIndex />);
    await findByText('Kaze');
    expect(getByText('2 players')).toBeTruthy();
    expect(queryByText('Find Players')).toBeNull();
    fireEvent.press(getByLabelText('Clubs'));
    await findByText('Red Foxes');
    expect(getByText('1 club')).toBeTruthy();
    fireEvent.changeText(getByLabelText('Search clubs'), 'zzz');
    expect(await findByText('No clubs found')).toBeTruthy();
    expect(strayHex(toJSON)).toEqual([]);
  });

  test('unified search preserves profile, club and challenge routes', async () => {
    const { findByText, getByLabelText } = render(<SearchIndex />);
    await findByText('Kaze');
    fireEvent.press(getByLabelText('Kaze, CAM, Free agent · PS5'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/profile/profilescreen',
      params: { playerId: 'p1' },
    });
    fireEvent.press(getByLabelText('Clubs'));
    await findByText('Red Foxes');
    fireEvent.press(getByLabelText('Red Foxes, RFX, EU · PS5'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/apps/club/[id]', params: { id: 'c1' } });
  });

  test('shows a retry action when directory loading fails', async () => {
    const directories = require('../../lib/stageDirectories');
    directories.loadPlayerDirectory.mockRejectedValueOnce(new Error('Directory unavailable'));
    const { findByText, getByText } = render(<SearchIndex />);
    await findByText('Directory unavailable');
    fireEvent.press(getByText('Try again'));
    expect(await findByText('Kaze')).toBeTruthy();
  });

  test('players: rows, view action and challenge action', async () => {
    const { findByText, getByLabelText, toJSON } = render(<SearchPlayers />);
    await findByText('Kaze');
    fireEvent.press(getByLabelText('Kaze, CAM, Player · PS5'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/profile/profilescreen',
      params: { playerId: 'p1' },
    });
    fireEvent.press(getByLabelText('INVITE Kaze'));
    expect(mockPush.mock.calls[1][0].params).toMatchObject({ opponentKind: 'player', opponentId: 'p1' });
    fireEvent.changeText(getByLabelText('Search players...'), 'zzz');
    expect(await findByText('No players found')).toBeTruthy();
    expect(strayHex(toJSON)).toEqual([]);
  });

  test('clubs: VIEW PROFILE and rows open the club', async () => {
    const { findByText, getByLabelText } = render(<SearchClubs />);
    await findByText('Red Foxes');
    fireEvent.press(getByLabelText('VIEW PROFILE Red Foxes'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/apps/club/[id]', params: { id: 'c1' } });
    fireEvent.press(getByLabelText(/^Red Foxes, /));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/apps/club/[id]', params: { id: 'c1' } });
  });
});

describe('find players / find clubs hubs', () => {
  test('find players: back, view toggle and detail sheet actions', async () => {
    const { findByText, getByLabelText, getByText, queryByText, toJSON } = render(<FindPlayers />);
    await findByText('1 / 2', { exact: false });
    expect(getByText('2 public profiles')).toBeTruthy();
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
    fireEvent.press(getByLabelText('List'));
    fireEvent.press(await findByText('Vix'));
    expect(await findByText('Player details')).toBeTruthy();
    fireEvent.press(getByText('View full profile'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/profile/profilescreen',
      params: { playerId: 'p2' },
    });
    fireEvent.changeText(getByLabelText('Search gamertag'), 'zzz');
    expect(await findByText('No players found')).toBeTruthy();
    expect(queryByText('Vix')).toBeNull();
    expect(strayHex(toJSON)).toEqual([]);
  });

  test('find clubs: list mode and challenge', async () => {
    const { findByText, getByLabelText, getByText } = render(<FindClubs />);
    await findByText('1 club');
    fireEvent.press(getByLabelText('List'));
    fireEvent.press(await findByText('Red Foxes'));
    expect(await findByText('Club details')).toBeTruthy();
    fireEvent.press(getByText('VS'));
    expect(mockPush.mock.calls[0][0].params).toMatchObject({ opponentKind: 'club', opponentId: 'c1' });
  });
});

describe('directory building blocks', () => {
  test('rows expose selected state and OVR in their label', () => {
    const onSelect = jest.fn();
    const { getByLabelText } = render(
      <DirectoryPlayerList
        players={[{ id: 'p1', gamertag: 'Kaze', position: 'CAM', platform: 'PS5', overall_rating: 87 }]}
        selectedId="p1"
        onSelect={onSelect}
      />,
    );
    const row = getByLabelText('Kaze, CAM, OVR 87, PS5');
    expect(row.props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(row);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }), { openDetails: true });
  });

  test('club rows round an averaged OVR to one decimal like the club card', () => {
    const { getByText, getAllByText, getByLabelText, queryByText } = render(
      <DirectoryClubList
        clubs={[
          { id: 'a', name: 'Avg FC', tag: 'AVG', region: 'EU', platform: 'PS5', overall_rating: 80.456 },
          { id: 'b', name: 'Whole FC', tag: 'WHL', region: 'EU', platform: 'PS5', overall_rating: 80 },
          { id: 'c', name: 'Near FC', tag: 'NER', region: 'EU', platform: 'PS5', overall_rating: 79.96 },
        ]}
      />,
    );
    expect(getByText('80.5')).toBeTruthy();
    expect(queryByText('80.456')).toBeNull();
    expect(getByLabelText('Avg FC, AVG, EU, OVR 80.5, PS5')).toBeTruthy();
    expect(getAllByText('80')).toHaveLength(2); // the whole 80 and 79.96 rounded up
    expect(getByLabelText('Whole FC, WHL, EU, OVR 80, PS5')).toBeTruthy();
    expect(getByLabelText('Near FC, NER, EU, OVR 80, PS5')).toBeTruthy();
  });

  test('empty lists keep their message', () => {
    expect(render(<DirectoryPlayerList players={[]} />).getByText('No players found')).toBeTruthy();
    expect(render(<DirectoryClubList clubs={[]} />).getByText('No clubs found')).toBeTruthy();
  });

  test('detail sheet shows stats and fires both actions', () => {
    const onPrimary = jest.fn();
    const onSecondary = jest.fn();
    const { getByText } = render(
      <DirectoryDetailSheet
        visible
        title="Red Foxes"
        eyebrow="Club details"
        initials="RFX"
        stats={[{ label: 'REGION', value: 'EU' }, { label: 'OVR', value: undefined }]}
        primaryLabel="View club"
        onPrimary={onPrimary}
        secondaryLabel="VS"
        onSecondary={onSecondary}
      />,
    );
    expect(getByText('EU')).toBeTruthy();
    expect(getByText('—')).toBeTruthy();
    fireEvent.press(getByText('View club'));
    fireEvent.press(getByText('VS'));
    expect(onPrimary).toHaveBeenCalled();
    expect(onSecondary).toHaveBeenCalled();
  });

  test('filter list box announces its value and changes selection', () => {
    const onChange = jest.fn();
    const { getByLabelText, getByText } = render(
      <FilterListBox label="CONSOLE" value="All" options={['All', 'PS5']} onChange={onChange} />,
    );
    expect(getByLabelText('CONSOLE').props.accessibilityValue).toMatchObject({ text: 'All' });
    fireEvent.press(getByLabelText('CONSOLE'));
    fireEvent.press(getByText('PS5'));
    expect(onChange).toHaveBeenCalledWith('PS5');
  });
});
