import React from 'react';
import { StyleSheet } from 'react-native';
import { FlatList } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockTournamentMatches = [
  {
    id: 'g1', tournament_id: 't1', type: 'group', group: 0, round: 1,
    status: 'completed', result_state: 'confirmed', stats_processed: 1,
    home_club_id: 'night', home_club_name: 'Night Owls',
    away_club_id: 'blue', away_club_name: 'Blue Comets', home_score: 3, away_score: 1,
    videos: [{}],
  },
  {
    id: 'g2', tournament_id: 't1', type: 'group', group: 0, round: 2,
    status: 'scheduled', home_club_id: 'blue', home_club_name: 'Blue Comets',
    away_club_id: 'night', away_club_name: 'Night Owls', scheduled_at: '2030-11-04T21:00:00Z',
  },
  {
    id: 'k1', tournament_id: 't1', type: 'quarter_final', round: 1,
    status: 'completed', home_club_name: 'Iron Wolves', away_club_name: 'Storm United',
    home_score: 2, away_score: 0,
  },
];
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ tournamentId: 't1' }),
}));
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => React.createElement(View, { style }, children) };
});
jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(async (url) => {
      if (url.includes('/fixtures')) {
        return {
          data: {
            data: [
              { id: 'f1', tournament_name: 'Autumn Cup', home_team_name: 'Blue Comets', away_team_name: 'Red Foxes', status: 'completed', home_score: 3, away_score: 1, videos: [{}] },
              { id: 'f2', tournament_name: 'Autumn Cup', home_team_name: 'Iron Wolves', away_team_name: 'Storm United', status: 'scheduled' },
            ],
          },
        };
      }
      return { data: { data: [] } };
    }),
  },
}));
jest.mock('../../api/tournamentActions', () => ({
  fetchTournamentMatches: jest.fn(async () => mockTournamentMatches),
  fetchTournamentPublic: jest.fn(async () => ({
    id: 't1', name: 'Autumn Cup', type: 'group_stage', participant_type: 'club', num_groups: 1,
  })),
  fetchTournamentStandings: jest.fn(async () => []),
  fetchTournamentBrackets: jest.fn(async () => []),
}));

import BracketView from '../../components/tournament/BracketView';
import { guideFabClearance } from '../../components/ui/metrics';
import FixturesScreen from '../../app/(tabs)/tournaments/fixturesscreen';
import GroupStageScreen from '../../app/(tabs)/tournaments/groupstagescreen';
import BracketScreen from '../../app/(tabs)/tournaments/bracketscreen';

const bracket = [
  { id: 'a', round: 1, type: 'quarter_final', status: 'completed', home_club_name: 'Night Owls', away_club_name: 'Storm Utd', home_score: 3, away_score: 1 },
  { id: 'b', round: 1, type: 'quarter_final', status: 'completed', home_club_name: 'Red Foxes', away_club_name: 'Iron Wolves', home_score: 0, away_score: 2 },
  { id: 'c', round: 2, type: 'semi_final', status: 'scheduled', home_club_name: 'Night Owls', away_club_name: 'Iron Wolves' },
  { id: 'd', round: 3, type: 'final', status: 'scheduled' },
];

describe('competition views restyle', () => {
  test('BracketView shows round labels, results, TBD slots and one connector for the 2:1 round pair', () => {
    const { getByText, getAllByText, toJSON } = render(<BracketView matches={bracket} />);
    expect(getByText('Quarter-finals')).toBeTruthy();
    expect(getByText('Semi-finals')).toBeTruthy();
    expect(getByText('Final')).toBeTruthy();
    expect(getAllByText('TBD')).toHaveLength(2);
    expect(getByText('Storm Utd')).toBeTruthy();
    // QF (2 matches) -> SF (1 match) gets a "]" connector; SF -> Final (1:1) does not
    const json = JSON.stringify(toJSON());
    expect((json.match(/"borderLeftWidth":0/g) || []).length).toBe(1);
  });

  test('BracketView bolds the winner and mutes the loser', () => {
    const { getByText } = render(<BracketView matches={[bracket[0]]} />);
    expect(StyleSheet.flatten(getByText('Night Owls').props.style).fontWeight).toBe('700');
    expect(StyleSheet.flatten(getByText('Storm Utd').props.style).fontWeight).toBe('500');
  });

  test('BracketView empty state', () => {
    expect(render(<BracketView matches={[]} />).getByText('No bracket data')).toBeTruthy();
  });

  test('Fixtures lists matches, filters and opens match detail', async () => {
    const { findByText, getByText } = render(<FixturesScreen />);
    fireEvent.press(await findByText('Storm United'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/matches/matchdetailscreen',
      params: { matchId: 'k1' },
    });
    expect(getByText('3 - 1')).toBeTruthy();
    expect(getByText('10:00 PM')).toBeTruthy();
    expect(getByText('Video available')).toBeTruthy();
    expect(getByText('Scheduled')).toBeTruthy();
  });

  test('Fixtures header and filter chips sit outside the list so they stay reachable', async () => {
    const { findAllByText, getByText, getByLabelText, queryByText, UNSAFE_getByType } = render(<FixturesScreen />);
    await findAllByText('Blue Comets');
    const list = UNSAFE_getByType(FlatList);
    expect(list.props.ListHeaderComponent).toBeUndefined();
    // the list ends above the tab bar and the Guide button
    expect(StyleSheet.flatten(list.props.contentContainerStyle).paddingBottom).toBe(guideFabClearance(0));
    // neither the title nor a chip is rendered inside the scrolling list
    expect(list.findAll((n) => n.props?.accessibilityLabel === 'Back')).toHaveLength(0);
    expect(list.findAll((n) => n.props?.children === 'Completed')).toHaveLength(0);
    expect(getByText('Fixtures')).toBeTruthy();
    expect(getByLabelText('Back')).toBeTruthy();
    // chips filter the already-loaded real tournament match records.
    fireEvent.press(getByText('Completed'));
    await waitFor(() => expect(queryByText('10:00 PM')).toBeNull());
    expect(getByText('3 - 1')).toBeTruthy();
  });

  test('Group stage and bracket screens render real match-derived data', async () => {
    const group = render(<GroupStageScreen />);
    await waitFor(() => expect(group.getAllByText('Group A').length).toBeGreaterThan(0));
    expect(group.getAllByText('Night Owls').length).toBeGreaterThan(0);
    expect(group.getByText('3 - 1')).toBeTruthy();
    const br = render(<BracketScreen />);
    await waitFor(() => expect(br.getByText('Quarter-finals')).toBeTruthy());
    expect(br.getByText('Iron Wolves')).toBeTruthy();
    expect(br.getByLabelText('Back')).toBeTruthy();
  });
});
