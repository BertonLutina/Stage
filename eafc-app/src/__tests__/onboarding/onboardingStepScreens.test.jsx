import React from 'react';
import { render } from '@testing-library/react-native';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const PlatformSelectionScreen = require('../../app/auth/platformselection').default;
const PositionSelectionScreen = require('../../app/auth/positionselection').default;
const GamertagSetupScreen = require('../../app/auth/gamertagsetup').default;
const ClubSetupScreen = require('../../app/auth/clubsetup').default;

beforeEach(() => jest.clearAllMocks());

describe('legacy onboarding route screens redirect into the combined flow', () => {
  test.each([
    ['platform', PlatformSelectionScreen],
    ['position', PositionSelectionScreen],
    ['gamertag', GamertagSetupScreen],
    ['club', ClubSetupScreen],
  ])('%s redirects to /auth/onboarding', (_name, Screen) => {
    render(<Screen />);
    expect(mockRouter.replace).toHaveBeenCalledWith('/auth/onboarding');
  });
});
