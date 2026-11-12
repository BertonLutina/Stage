import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockRefetch = jest.fn();
let mockResource;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({})),
  stageClient: {
    http: { get: jest.fn(() => Promise.resolve({})) },
    entities: {
      RegionalLeagueStanding: { filter: jest.fn(() => Promise.resolve([])) },
      QualificationEntry: { filter: jest.fn(() => Promise.resolve([])) },
      RegionalLeague: { get: jest.fn(() => Promise.resolve(null)) },
    },
  },
}));
jest.mock('../../hooks/useCompetitionsHub', () => ({
  __esModule: true,
  default: () => mockResource,
}));
jest.mock('../../lib/competitionSeason', () => ({
  loadCompetitionsHub: jest.fn(() => Promise.resolve([])),
}));

import CompetitionsView from '../../components/competitions/CompetitionsView';

const baseData = {
  gost: [],
  cups: [],
  leagues: [],
  windows: [],
  registrations: [],
  errors: {},
  club: { id: 'c1', name: 'Mine', region: 'Benelux' },
  presidentClub: { id: 'c1' },
};

function resource(overrides = {}, data = {}) {
  return {
    data: { ...baseData, ...data },
    loading: false,
    error: null,
    refreshing: false,
    refetch: mockRefetch,
    ...overrides,
  };
}

describe('CompetitionsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResource = resource();
  });

  test('loading shows skeletons, not a spinner or empty copy', () => {
    mockResource = resource({ loading: true, data: undefined });
    const { getByTestId, queryByText } = render(<CompetitionsView />);
    expect(getByTestId('skeleton-list')).toBeTruthy();
    expect(queryByText('My registrations')).toBeNull();
  });

  test('error shows the message and Retry refetches', () => {
    mockResource = resource({ error: 'Network down' });
    const { getByText } = render(<CompetitionsView />);
    expect(getByText('Network down')).toBeTruthy();
    fireEvent.press(getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  test('shows my real registrations with season, division and confirmed players', () => {
    mockResource = resource({}, {
      registrations: [{
        id: 'r1', region_slug: 'benelux', season_number: 4, assigned_division: 2,
        status: 'approved', participation_status: 'confirmed', confirmed_player_ids: ['a', 'b', 'c'],
      }],
    });
    const { getByText } = render(<CompetitionsView />);
    expect(getByText('Benelux')).toBeTruthy();
    expect(getByText('Confirmed')).toBeTruthy();
    expect(getByText('Season 4 · Division 2 · 3 players confirmed')).toBeTruthy();
  });

  test('no registration: empty copy, and the open window offers the register button', () => {
    mockResource = resource({}, { windows: [{ id: 'w1', phase: 'registration', opens_at: '2026-11-01T00:00:00Z' }] });
    const { getByText, getByTestId } = render(<CompetitionsView />);
    expect(getByTestId('no-registrations')).toBeTruthy();
    expect(getByText('Registration is open')).toBeTruthy();
    fireEvent.press(getByText('Register my club'));
    expect(mockPush).toHaveBeenCalledWith('/apps/register');
  });

  test('closed window: no register button, just the state', () => {
    mockResource = resource({}, { windows: [{ id: 'w1', phase: 'closed' }] });
    const { getByText, queryByText } = render(<CompetitionsView />);
    expect(getByText('Registration is closed')).toBeTruthy();
    expect(queryByText('Register my club')).toBeNull();
  });

  test('upcoming window shows the real opening date, no register button', () => {
    mockResource = resource({}, { windows: [{ id: 'w1', phase: 'upcoming', opens_at: '2026-12-01T00:00:00Z' }] });
    const { getByText, queryByText } = render(<CompetitionsView />);
    expect(getByText(/^Registration opens /)).toBeTruthy();
    expect(queryByText('Register my club')).toBeNull();
  });

  test('regional cups: real round, participants and my next match', () => {
    mockResource = resource({}, {
      cups: [{
        id: 'cup1', name: 'Benelux Cup', status: 'running', participant_count: 16,
        participants: [{ id: 'c1', name: 'Mine' }],
        rounds: [{ number: 2, drawn: true, matches: [{ id: 'm', home_club_id: 'c1', away_club_id: 'c2', status: 'scheduled', kickoff_at: '2026-11-14T18:00:00Z' }] }],
      }],
    });
    const { getByText } = render(<CompetitionsView />);
    expect(getByText('Benelux Cup')).toBeTruthy();
    expect(getByText('In progress · Round 2 · 16 clubs')).toBeTruthy();
    expect(getByText(/^You play /)).toBeTruthy();
  });

  test('no cup: empty state, not an invented one', () => {
    const { getByText } = render(<CompetitionsView />);
    expect(getByText('No regional cup is running right now.')).toBeTruthy();
  });

  test('regional leagues open the league detail by slug; my region first', () => {
    mockResource = resource({}, {
      leagues: [
        { id: 'f', name: 'France D1', region_slug: 'france', division: 1, is_current: true, slug: 'france-d1', season_number: 4 },
        { id: 'b', name: 'Benelux D1', region_slug: 'benelux', division: 1, is_current: true, slug: 'benelux-d1', season_number: 4, status: 'registration' },
      ],
    });
    const { getByText, getAllByText } = render(<CompetitionsView />);
    expect(getByText('Open')).toBeTruthy();
    const names = getAllByText(/D1$/).map((n) => n.props.children);
    expect(names).toEqual(['Benelux D1', 'France D1']);
    fireEvent.press(getByText('Benelux D1'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/apps/leagues/[slug]', params: { slug: 'benelux-d1' } });
  });

  test('a failing section shows its own error with Retry while others still render', () => {
    mockResource = resource({}, { errors: { cups: 'boom' } });
    const { getByText, getByTestId } = render(<CompetitionsView />);
    expect(getByTestId('section-error')).toBeTruthy();
    expect(getByText('boom')).toBeTruthy();
    expect(getByText('Regional leagues')).toBeTruthy();
  });
});
