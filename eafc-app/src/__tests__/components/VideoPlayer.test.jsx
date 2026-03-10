import React from 'react';
import { render } from '@testing-library/react-native';
import VideoPlayer from '../../components/common/VideoPlayer';

describe('VideoPlayer component', () => {
  it('renders WebView for a YouTube watch URL', () => {
    const { getByTestId } = render(
      <VideoPlayer url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" source="youtube" />
    );
    expect(getByTestId('webview')).toBeTruthy();
  });

  it('embeds correct YouTube video ID from watch URL', () => {
    const { getByText } = render(
      <VideoPlayer url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" source="youtube" />
    );
    expect(getByText(/dQw4w9WgXcQ/)).toBeTruthy();
  });

  it('embeds correct YouTube video ID from youtu.be short URL', () => {
    const { getByText } = render(
      <VideoPlayer url="https://youtu.be/dQw4w9WgXcQ" source="youtube" />
    );
    expect(getByText(/dQw4w9WgXcQ/)).toBeTruthy();
  });

  it('renders "No video" when url is null', () => {
    const { getByText } = render(<VideoPlayer url={null} source="youtube" />);
    expect(getByText('No video')).toBeTruthy();
  });

  it('renders "No video" when url is empty string', () => {
    const { getByText } = render(<VideoPlayer url="" source="youtube" />);
    expect(getByText('No video')).toBeTruthy();
  });

  it('renders WebView for a Twitch clip URL', () => {
    const { getByTestId } = render(
      <VideoPlayer url="https://clips.twitch.tv/FancyClipName" source="twitch" />
    );
    expect(getByTestId('webview')).toBeTruthy();
  });

  it('renders WebView for a Kick URL', () => {
    const { getByTestId } = render(
      <VideoPlayer url="https://kick.com/video/12345" source="kick" />
    );
    expect(getByTestId('webview')).toBeTruthy();
  });
});
