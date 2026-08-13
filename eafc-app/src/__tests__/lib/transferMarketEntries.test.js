import {
  buildTransferMarketEntries,
  normalizeTransferMarketPlayers,
} from '../../lib/transferMarketEntries';

describe('transfer market entries', () => {
  test('normalizes free agents and expiring players', () => {
    const normalized = normalizeTransferMarketPlayers({
      free_agents: [{ id: 'p1', gamertag: 'Free' }, { gamertag: 'no-id' }],
      expiring_players: [{ player: { id: 'p2' }, days_left: 2, contract: { id: 'c1' } }],
    });
    expect(normalized.freeAgents).toEqual([{ id: 'p1', gamertag: 'Free' }]);
    expect(normalized.expiringPlayers).toEqual([
      { player: { id: 'p2' }, contract: { id: 'c1' }, days_left: 2 },
    ]);
  });

  test('marks contracts with 3 days or less as expiring soon', () => {
    const entries = buildTransferMarketEntries(
      [{ id: 'p1' }],
      [{ player: { id: 'p2' }, days_left: 3 }, { player: { id: 'p3' }, days_left: 8 }],
    );
    expect(entries.map((row) => row.badgeType)).toEqual(['free_agent', 'expiring_soon', 'expiring']);
  });
});
