import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ tournamentId: 't1' }),
}));
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => React.createElement(View, { style }, children) };
});
jest.mock('../../api/stageClient', () => ({
  stageClient: { http: { get: jest.fn(async () => ({})) }, entities: {} },
  resolveMyPlayerAndClub: jest.fn(async () => ({ user: { id: 1, email: 'a@b.c', credits: 100 }, player: null, club: null, presidentClub: null })),
}));
jest.mock('../../api/tournamentActions', () => ({
  acceptTournamentRules: jest.fn(), advanceTournamentRound: jest.fn(), fetchTournamentMatches: jest.fn(async () => [{
    id: 'next-1', status: 'scheduled', scheduled_at: '2030-01-02T20:00:00Z',
    home_club_name: 'Night Owls', away_club_name: 'Blue Comets',
  }]),
  fetchTournamentPublic: jest.fn(async () => ({
    id: 't1', name: 'Autumn Cup', type: 'group_stage', status: 'in_progress', max_teams: 16,
    entry_fee_stc: 100000, prize_pool_stc: 1600000, registered_clubs: [], start_date: '2030-01-01T10:00:00Z',
  })),
  initializeTournamentDraw: jest.fn(), officializeTournament: jest.fn(), isPlayerTournament: () => false,
  registerTournamentClub: jest.fn(), registerTournamentPlayer: jest.fn(), withdrawTournamentClub: jest.fn(),
}));

import StandingsTable from '../../components/tournament/StandingsTable';
import TournamentDetailScreen from '../../app/(tabs)/tournaments/tournamentdetailscreen';
import { CARD_RADIUS } from '../../lib/stageTheme';

const rows = [{ id: 1, name: 'A', played: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 0, points: 3 }];

describe('tournament restyle', () => {
  test('StandingsTable card keeps the Stage card radius, compact uses 12', () => {
    const full = StyleSheet.flatten(render(<StandingsTable rows={rows} />).toJSON().props.style);
    expect(full.borderRadius).toBe(CARD_RADIUS);
    const compact = StyleSheet.flatten(render(<StandingsTable rows={rows} compact />).toJSON().props.style);
    expect(compact.borderRadius).toBe(12);
  });

  test('detail stat grid uses Clubs / Prize / Starts in three columns', async () => {
    const { findByText, getByText, getAllByText, getByTestId, getByLabelText } = render(<TournamentDetailScreen />);
    await findByText('Autumn Cup');
    expect(getByText('16')).toBeTruthy();
    expect(getByText('1,600,000 STC')).toBeTruthy();
    expect(getAllByText('Clubs').length).toBeGreaterThan(0);
    expect(getAllByText('Prize').length).toBeGreaterThan(0);
    expect(getByTestId('stat-cell-0-2')).toBeTruthy();
    expect(getByLabelText('Share')).toBeTruthy();
  });

  test('detail exposes every mockup competition route and the real next match', async () => {
    const { findByText, getAllByText, getByText } = render(<TournamentDetailScreen />);
    await findByText('Autumn Cup');

    expect(getByText('Group stage')).toBeTruthy();
    expect(getByText('Standings')).toBeTruthy();
    expect(getAllByText('Fixtures').length).toBeGreaterThan(0);
    expect(getByText('Bracket')).toBeTruthy();
    expect(getByText('Next match · Night Owls vs Blue Comets')).toBeTruthy();
    expect(getByText(/Groups \+ knockout/i)).toBeTruthy();
  });
});
