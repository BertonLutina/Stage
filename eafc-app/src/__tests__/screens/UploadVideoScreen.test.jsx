import React from 'react';
import { render, fireEvent, waitFor as rtlWaitFor } from '@testing-library/react-native';

jest.setTimeout(30000);
const waitFor = (cb) => rtlWaitFor(cb, { timeout: 10000 });

const mockBack = jest.fn();
const mockPost = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: (...a) => mockBack(...a), canGoBack: () => true }),
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
jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: { defaults: { baseURL: 'http://api.test' }, post: (...a) => mockPost(...a) },
}));

const UploadVideoScreen = require('../../app/(tabs)/matches/uploadvideoscreen').default;

describe('UploadVideoScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue({});
  });

  it('does not post without a url', () => {
    const { getByLabelText } = render(<UploadVideoScreen />);
    fireEvent.press(getByLabelText('Save Video'));
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('posts the chosen platform and url, then goes back', async () => {
    const { getByLabelText, getByText } = render(<UploadVideoScreen />);
    fireEvent.press(getByText('Twitch'));
    fireEvent.changeText(getByLabelText('Video URL'), 'https://twitch.tv/clip');
    fireEvent.press(getByLabelText('Save Video'));
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith('/matches/m1/video', {
        video_url: 'https://twitch.tv/clip',
        video_source: 'twitch',
      }),
    );
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('previews the video after tapping Preview Video', () => {
    const { getByLabelText, getByText, queryByText, getByTestId } = render(<UploadVideoScreen />);
    expect(queryByText('Preview Video')).toBeNull();
    fireEvent.changeText(getByLabelText('Video URL'), 'https://youtu.be/dQw4w9WgXcQ');
    fireEvent.press(getByText('Preview Video'));
    expect(getByTestId('webview')).toBeTruthy();
    expect(queryByText('Preview Video')).toBeNull();
  });
});
