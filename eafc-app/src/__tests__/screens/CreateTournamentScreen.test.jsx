import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(async () => ({
    user: { id: 'u1', email: 'creator@stage.test' },
    player: { id: 'p1', subscription: 'plus', gamertag: 'NightOwl' },
  })),
  stageClient: { entities: { Tournament: { create: jest.fn() } } },
}));

import CreateTournamentScreen from '../../app/(tabs)/tournaments/createtournamentscreen';

describe('CreateTournamentScreen', () => {
  test('uses the mockup heading while retaining the richer real tournament form', async () => {
    const { findByText, getByText, getByLabelText } = render(<CreateTournamentScreen />);

    await findByText('CREATE TOURNAMENT');
    expect(getByText('NEW TOURNAMENT')).toBeTruthy();
    expect(getByText('Tournament for')).toBeTruthy();
    expect(getByText('Rules template')).toBeTruthy();
    expect(getByLabelText('Close')).toBeTruthy();
  });
});
