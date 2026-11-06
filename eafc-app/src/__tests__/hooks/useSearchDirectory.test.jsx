import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';

const mockLoadPlayers = jest.fn();
const mockLoadClubs = jest.fn();
const mockResolveIdentity = jest.fn();

jest.mock('../../lib/stageDirectories', () => ({
  loadPlayerDirectory: (...args) => mockLoadPlayers(...args),
  loadClubDirectory: (...args) => mockLoadClubs(...args),
}));
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: (...args) => mockResolveIdentity(...args),
}));

const useSearchDirectory = require('../../hooks/useSearchDirectory').default;

function Probe({ expose }) {
  const state = useSearchDirectory();
  expose(state);
  return <Text>{state.loading ? 'loading' : state.error || `${state.data.players.length}/${state.data.clubs.length}`}</Text>;
}

describe('useSearchDirectory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadPlayers.mockResolvedValue({ players: [{ id: 'p1' }] });
    mockLoadClubs.mockResolvedValue([{ id: 'c1' }]);
    mockResolveIdentity.mockResolvedValue({ presidentClub: { id: 'own' } });
  });

  test('loads both real directories and viewer identity', async () => {
    let latest;
    const { findByText } = render(<Probe expose={(state) => { latest = state; }} />);
    await findByText('1/1');
    expect(latest.data.identity.presidentClub.id).toBe('own');
    expect(latest.error).toBeNull();
  });

  test('keeps the canonical refresh contract', async () => {
    let latest;
    render(<Probe expose={(state) => { latest = state; }} />);
    await waitFor(() => expect(latest.loading).toBe(false));
    await act(async () => latest.refetch());
    expect(mockLoadPlayers).toHaveBeenCalledTimes(2);
    expect(mockLoadClubs).toHaveBeenCalledTimes(2);
    expect(latest.refreshing).toBe(false);
  });
});
