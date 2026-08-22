import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditProfileScreen from '../../app/(tabs)/profile/editprofilescreen';
import * as ImagePicker from 'expo-image-picker';
import { stageClient, resolveMyPlayerAndClub } from '../../api/stageClient';

const mockBack = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack, replace: jest.fn() }),
}));

jest.mock('../../store/authStore', () => ({
  __esModule: true,
  default: () => ({
    user: {
      id: 'user-1',
      email: 'lutina@stage.com',
      first_name: 'Lutina',
      last_name: '',
      gamer_tag: 'Lutina',
    },
    updateUser: (...args) => mockUpdateUser(...args),
  }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  const LinearGradient = ({ children, style }) => React.createElement(View, { style }, children);
  return { LinearGradient };
});

jest.mock('../../api/stageClient', () => ({
  stageClient: {
    entities: {
      Player: {
        update: jest.fn(async (_id, body) => ({ id: 'player-1', ...body })),
        create: jest.fn(),
      },
      President: {
        update: jest.fn(async (_id, body) => ({ id: 'prez-1', ...body })),
      },
    },
    integrations: { Core: { UploadFile: jest.fn() } },
  },
  resolveMyPlayerAndClub: jest.fn(),
}));

describe('EditProfileScreen', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockUpdateUser.mockClear();
    stageClient.entities.Player.update.mockClear();
    stageClient.entities.President.update.mockClear();
    stageClient.integrations.Core.UploadFile.mockClear();
    resolveMyPlayerAndClub.mockResolvedValue({
      player: {
        id: 'player-1',
        gamertag: 'Lutina',
        bio: 'Hello pitch',
        country: 'Belgium',
        country_code: 'BE',
        position: 'ST',
        secondary_position: 'CAM',
        platform: 'PlayStation',
        avatar_url: 'https://cdn.example/a.png',
      },
      president: {
        id: 'prez-1',
        display_name: 'Lutina',
        bio: 'Hello pitch',
      },
    });
  });

  it('loads Stage player fields with readable themed labels', async () => {
    const { getByText, getByLabelText } = render(<EditProfileScreen />);

    await waitFor(() => {
      expect(getByLabelText('Gamertag').props.value).toBe('Lutina');
    });

    expect(getByText('Edit Profile')).toBeTruthy();
    expect(getByLabelText('First name').props.value).toBe('Lutina');
    expect(getByText('Main position')).toBeTruthy();
    expect(getByText('Save Changes')).toBeTruthy();
    expect(getByLabelText('Bio').props.value).toBe('Hello pitch');
  });

  it('saves gamertag, bio and avatar metadata to Player and President', async () => {
    const { getByLabelText, getByText } = render(<EditProfileScreen />);

    await waitFor(() => {
      expect(getByLabelText('Gamertag').props.value).toBe('Lutina');
    });

    fireEvent.changeText(getByLabelText('Gamertag'), 'Neo');
    fireEvent.changeText(getByLabelText('Bio'), 'Free agent');
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(stageClient.entities.Player.update).toHaveBeenCalledWith(
        'player-1',
        expect.objectContaining({
          gamertag: 'Neo',
          bio: 'Free agent',
          position: 'ST',
          secondary_position: 'CAM',
          platform: 'PS5',
          country_code: 'BE',
          avatar_url: 'https://cdn.example/a.png',
        }),
      );
    });

    expect(stageClient.entities.President.update).toHaveBeenCalledWith(
      'prez-1',
      expect.objectContaining({
        display_name: 'Neo',
        bio: 'Free agent',
        avatar_url: 'https://cdn.example/a.png',
      }),
    );
    expect(mockUpdateUser).toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });

  it('uploads a local avatar to the server instead of saving the phone file path', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/photo.jpg' }],
    });
    stageClient.integrations.Core.UploadFile.mockResolvedValueOnce({
      file_url: 'https://stageleagues.com/uploads/hosted.jpg',
    });

    const { getByLabelText, getByText } = render(<EditProfileScreen />);
    await waitFor(() => {
      expect(getByLabelText('Gamertag').props.value).toBe('Lutina');
    });

    fireEvent.press(getByLabelText('Change photo'));
    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(stageClient.integrations.Core.UploadFile).toHaveBeenCalled();
      expect(stageClient.entities.Player.update).toHaveBeenCalledWith(
        'player-1',
        expect.objectContaining({
          avatar_url: 'https://stageleagues.com/uploads/hosted.jpg',
        }),
      );
    });
    expect(stageClient.entities.Player.update.mock.calls[0][1].avatar_url).not.toMatch(/^file:/);
  });
});
