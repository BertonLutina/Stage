import React from 'react';
import { render, fireEvent, waitFor as rtlWaitFor, act } from '@testing-library/react-native';

// The full suite runs heavy files in parallel; give async assertions room.
jest.setTimeout(30000);
const waitFor = (cb) => rtlWaitFor(cb, { timeout: 10000 });

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockMatchGet = jest.fn();
let mockSubscriber = null;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: (...a) => mockPush(...a),
    back: (...a) => mockBack(...a),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ matchId: 'm1' }),
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
jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: {
    defaults: { baseURL: 'http://api.test' },
    get: (...a) => mockGet(...a),
    post: (...a) => mockPost(...a),
  },
}));
jest.mock('../../api/stageClient', () => ({
  stageClient: {
    entities: {
      Match: { get: (...a) => mockMatchGet(...a) },
      ChatMessage: {
        subscribe: (cb) => {
          mockSubscriber = cb;
          return () => { mockSubscriber = null; };
        },
      },
    },
  },
}));
jest.mock('../../store/authStore', () => {
  const user = { id: 'u1', email: 'me@x.test', gamer_tag: 'Me' };
  const useAuthStore = () => ({ user });
  return { __esModule: true, default: useAuthStore };
});

const WatchMatchScreen = require('../../app/(tabs)/matches/watchmatchscreen').default;

const MATCH = {
  id: 'm1',
  status: 'completed',
  home_club_name: 'Night Owls',
  away_club_name: 'Red Foxes',
  home_score: 3,
  away_score: 1,
  tournament_name: 'League',
  videos: [
    { id: 'v1', video_url: 'https://youtu.be/aaaaaaaaaaa', video_source: 'youtube', uploader: 'NightOwl_10' },
    { id: 'v2', video_url: 'https://youtu.be/bbbbbbbbbbb', video_source: 'youtube', uploader: 'Kaze' },
  ],
};

async function renderScreen(match = MATCH) {
  mockMatchGet.mockResolvedValue(match);
  const utils = render(<WatchMatchScreen />);
  await waitFor(() => expect(utils.queryByText('Loading...')).toBeNull());
  return utils;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSubscriber = null;
  mockGet.mockResolvedValue({ data: { data: [{ id: 'c1', content: 'hello', gamer_tag: 'Kaze', sender_email: 'k@x.test' }] } });
  mockPost.mockResolvedValue({ data: { data: { id: 'c2', content: 'gg', sender_email: 'me@x.test' } } });
});

describe('WatchMatchScreen', () => {
  it('shows the match line, context, recordings and live chat', async () => {
    const { getByText, getAllByText } = await renderScreen();
    expect(getByText('Night Owls 3 – 1 Red Foxes')).toBeTruthy();
    expect(getByText('League')).toBeTruthy();
    expect(getByText('Other recordings')).toBeTruthy();
    expect(getByText('Now playing')).toBeTruthy();
    expect(getAllByText('Tap to watch')).toHaveLength(1);
    expect(getByText('Live chat')).toBeTruthy();
    await waitFor(() => expect(getByText('hello')).toBeTruthy());
  });

  it('switches recording when a row is pressed', async () => {
    const { getByLabelText, getByText } = await renderScreen();
    // the playing recording announces its state; the other one does not
    expect(getByLabelText('NightOwl_10 youtube, Now playing')).toBeTruthy();
    expect(getByLabelText('Kaze youtube').props.accessibilityLabel).toBe('Kaze youtube');
    fireEvent.press(getByLabelText('Kaze youtube'));
    expect(getByText('Uploaded by Kaze • youtube')).toBeTruthy();
    expect(getByLabelText('Kaze youtube, Now playing')).toBeTruthy();
    expect(getByLabelText('NightOwl_10 youtube')).toBeTruthy();
  });

  it('recordings without an uploader or source never read "undefined"', async () => {
    const { getByLabelText, getByText, queryByText } = await renderScreen({
      ...MATCH,
      videos: [
        { id: 'v1', video_url: 'https://youtu.be/aaaaaaaaaaa', video_source: 'youtube' },
        { id: 'v2', video_url: 'https://youtu.be/bbbbbbbbbbb', uploader: 'Kaze' },
      ],
    });
    expect(getByLabelText('Unknown uploader youtube, Now playing')).toBeTruthy();
    expect(getByLabelText('Kaze')).toBeTruthy();
    expect(getByText('Uploaded by Unknown uploader • youtube')).toBeTruthy();
    expect(queryByText(/undefined/)).toBeNull();
  });

  it('the screen pads above the keyboard (chat input) through Screen, not an inner view', async () => {
    const { Platform, KeyboardAvoidingView } = require('react-native');
    const original = Platform.OS;
    Platform.OS = 'ios';
    try {
      const { UNSAFE_getAllByType } = await renderScreen();
      const avoiders = UNSAFE_getAllByType(KeyboardAvoidingView);
      expect(avoiders).toHaveLength(1);
      expect(avoiders[0].props.behavior).toBe('padding');
    } finally {
      Platform.OS = original;
    }
  });

  it('sends a comment, clears the field and upserts the saved message', async () => {
    const { getByLabelText, getByText } = await renderScreen();
    const send = getByLabelText('Send comment');
    expect(send.props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(getByLabelText('Add a comment'), '  gg  ');
    fireEvent.press(getByLabelText('Send comment'));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/matches/m1/chat', { content: 'gg' }));
    await waitFor(() => expect(getByText('gg')).toBeTruthy());
  });

  it('refetches chat with the toggled filter', async () => {
    const { getByText } = await renderScreen();
    fireEvent.press(getByText('Photos'));
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/matches/m1/chat', { params: { filter: 'photo' } }),
    );
  });

  it('applies realtime chat events and cleans the subscription up', async () => {
    const { getByText, queryByText, unmount } = await renderScreen();
    await waitFor(() => expect(mockSubscriber).toBeTruthy());
    act(() => mockSubscriber({ type: 'create', data: { id: 'rt1', match_id: 'm1', content: 'live!', gamer_tag: 'Vix' } }));
    expect(getByText('live!')).toBeTruthy();
    act(() => mockSubscriber({ type: 'delete', id: 'rt1', data: { id: 'rt1', match_id: 'm1' } }));
    expect(queryByText('live!')).toBeNull();
    unmount();
    expect(mockSubscriber).toBeNull();
  });

  it('opens the attachment menu', async () => {
    const { getByLabelText, queryByText, getByText } = await renderScreen();
    expect(queryByText('Voice note')).toBeNull();
    fireEvent.press(getByLabelText('Attach'));
    expect(getByText('Voice note')).toBeTruthy();
  });

  it('offers upload when the match has no videos', async () => {
    const { getByText } = await renderScreen({ ...MATCH, videos: [] });
    expect(getByText('No videos uploaded for this match yet')).toBeTruthy();
    fireEvent.press(getByText('Upload Video'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/matches/uploadvideoscreen',
      params: { matchId: 'm1' },
    });
  });

  it('shows the load error with a back button', async () => {
    mockMatchGet.mockRejectedValue(new Error('boom'));
    const { findByText, getByLabelText } = render(<WatchMatchScreen />);
    expect(await findByText('boom', {}, { timeout: 10000 })).toBeTruthy();
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
