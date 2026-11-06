import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };

jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
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
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }) => React.createElement(Text, null, name) };
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { Ionicons: ({ name }) => React.createElement(Text, null, name) };
});
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({ user: { id: 'u1', email: 'a@b.c', timezone: 'Europe/Paris' }, player: null })),
  userNeedsOnboarding: jest.fn(() => true),
  stageClient: {
    auth: { updateTimezone: jest.fn(() => Promise.resolve()) },
    entities: { Player: { get: jest.fn(), filter: jest.fn(() => Promise.resolve([])), create: jest.fn(), update: jest.fn() } },
    identityClaims: { list: jest.fn(() => Promise.resolve([])), submit: jest.fn() },
    clubs: { createFounder: jest.fn() },
    functions: { invoke: jest.fn() },
  },
}));
jest.mock('../../lib/accountIntent', () => ({ writeAccountIntent: jest.fn() }));
jest.mock('../../lib/discordConfig', () => ({ isDiscordConfigured: () => false, DISCORD_INVITE_URL: '' }));
jest.mock('../../services/onboardingService', () => ({ markOnboardingComplete: jest.fn(() => Promise.resolve()) }));
jest.mock('../../lib/polyfillStorage', () => ({ localStorage: { setItem: jest.fn(), getItem: jest.fn() } }));

const OnboardingScreen = require('../../app/auth/onboarding').default;
const PresidentContractSetup = require('../../components/onboarding/PresidentContractSetup').default;
const FounderPlayerTermsSetup = require('../../components/onboarding/FounderPlayerTermsSetup').default;
const ClubSetup = require('../../components/onboarding/ClubSetup').default;
const DiscordJoinStep = require('../../components/onboarding/DiscordJoinStep').default;
const TutorialPopup = require('../../components/onboarding/TutorialPopup').default;

beforeEach(() => {
  jest.clearAllMocks();
  const store = {};
  global.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[String(key)] = String(value); },
    removeItem: (key) => { delete store[String(key)]; },
  };
  useThemeStore.getState().setStageTheme('theme-dark');
});

describe('onboarding flow (Stage restyle)', () => {
  test('choose step offers both paths; Player runs the mockup 4-step flow with validation', async () => {
    const { findByText, getByLabelText, getByText, getAllByTestId, queryAllByTestId } = render(<OnboardingScreen />);
    await findByText('Who are you on the pitch?');
    expect(queryAllByTestId(/step-bar-/)).toHaveLength(0);
    expect(getByLabelText('Player + President')).toBeTruthy();
    expect(getByText('Match times timezone')).toBeTruthy();

    fireEvent.press(getByLabelText('Player'));
    await findByText('Where do you play?');
    expect(getAllByTestId(/step-bar-/)).toHaveLength(4);

    fireEvent.press(getByText('Continue')); // platform → position
    await findByText('Your position');

    fireEvent.press(getByText('Continue')); // position → gamertag
    await findByText('Your gamertag');

    // gamertag step requires a gamertag + country before it persists
    fireEvent.press(getByText('Continue'));
    expect(await findByText('Gamertag and country are required')).toBeTruthy();

    // back walks the steps, then returns to the role choice
    fireEvent.press(getByLabelText('Back'));
    await findByText('Your position');
    fireEvent.press(getByLabelText('Back'));
    await findByText('Where do you play?');
    fireEvent.press(getByLabelText('Back'));
    await findByText('Who are you on the pitch?');
  });

  test('Player + President uses a 6-bar progress', async () => {
    const { findByText, getByLabelText, getAllByTestId } = render(<OnboardingScreen />);
    await findByText('Who are you on the pitch?');
    fireEvent.press(getByLabelText('Player + President'));
    await findByText('Your name on the pitch');
    expect(getAllByTestId(/step-bar-/)).toHaveLength(6);
  });

  test('founder terms: Next is disabled until the wage is allowed', () => {
    const onComplete = jest.fn();
    const { getByLabelText, getByText } = render(<FounderPlayerTermsSetup onComplete={onComplete} />);
    expect(getByLabelText('Next').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(getByText('+ Add target'));
    expect(getByText('Remove target')).toBeTruthy();
    fireEvent.press(getByText('Remove target'));
  });

  test('club setup: president phase validates, then club phase, then back', () => {
    const { getByText, getByLabelText } = render(<ClubSetup player={{ id: 'p1', gamertag: '' }} user={{ id: 'u1' }} required />);
    fireEvent.press(getByText('Next'));
    expect(getByText('President display name is required')).toBeTruthy();
    fireEvent.changeText(getByLabelText('Display name *'), 'Boss');
    fireEvent.press(getByText('Next'));
    expect(getByText('Name the club')).toBeTruthy();
    fireEvent.press(getByText('Create club'));
    expect(getByText('Club name, tag, and country are required')).toBeTruthy();
    fireEvent.press(getByText('Back'));
    expect(getByText('How should they call you?')).toBeTruthy();
  });

  test('president contract shows the president and club name', () => {
    const { getByText } = render(
      <PresidentContractSetup club={{ name: 'Night Owls' }} player={{ gamertag: 'NightOwl' }} user={{}} onComplete={jest.fn()} />,
    );
    expect(getByText('NightOwl')).toBeTruthy();
    expect(getByText('Night Owls')).toBeTruthy();
    expect(getByText('Sign')).toBeTruthy();
  });

  test('discord step wires skip and continue', () => {
    const onSkip = jest.fn();
    const onContinue = jest.fn();
    const { getByText } = render(<DiscordJoinStep onSkip={onSkip} onContinue={onContinue} />);
    fireEvent.press(getByText('Skip for now'));
    fireEvent.press(getByText('Continue to STAGE'));
    expect(onSkip).toHaveBeenCalled();
    expect(onContinue).toHaveBeenCalled();
  });

  test('tutorial popup pages through and closes, without emoji icons', () => {
    const onClose = jest.fn();
    const { getByText, queryByText } = render(<TutorialPopup open onClose={onClose} intent="player" />);
    expect(getByText('Your path')).toBeTruthy();
    expect(getByText('compass-outline')).toBeTruthy();
    fireEvent.press(getByText('Next'));
    expect(getByText('Back')).toBeTruthy();
    fireEvent.press(getByText('Back'));
    fireEvent.press(getByText('Skip'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(queryByText(/\p{Extended_Pictographic}/u)).toBeNull();
  });
});
