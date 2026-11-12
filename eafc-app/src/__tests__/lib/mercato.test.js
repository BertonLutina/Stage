import {
  loadMercatoDesk,
  describeFeedItem,
  loadMyOffers,
  offerIsLive,
  summarizeOffers,
} from '../../lib/mercato';

const mockGet = jest.fn();
const mockContractFilter = jest.fn();
const mockClubGet = jest.fn();
const mockPlayerGet = jest.fn();
jest.mock('../../api/stageClient', () => ({
  stageClient: {
    http: { get: (...a) => mockGet(...a) },
    entities: {
      PlayerContract: { filter: (...a) => mockContractFilter(...a) },
      Club: { get: (...a) => mockClubGet(...a) },
      Player: { get: (...a) => mockPlayerGet(...a) },
    },
  },
}));

describe('loadMercatoDesk', () => {
  beforeEach(() => jest.clearAllMocks());

  test('reads the desk feed', async () => {
    mockGet.mockResolvedValue({ window: { id: 'w' }, feed: [{ id: 't1', player_name: 'Kaze' }] });
    const desk = await loadMercatoDesk();
    expect(mockGet).toHaveBeenCalledWith('/mercato-transfers/desk');
    expect(desk.feed).toHaveLength(1);
    expect(desk.feed[0]).toMatchObject({ id: 't1', name: 'Kaze' });
  });

  test('a desk without a feed array is an error', async () => {
    mockGet.mockResolvedValue({ window: null });
    await expect(loadMercatoDesk()).rejects.toThrow(/incomplete/i);
  });

  test('server errors propagate', async () => {
    mockGet.mockRejectedValue(new Error('down'));
    await expect(loadMercatoDesk()).rejects.toThrow('down');
  });
});

describe('describeFeedItem', () => {
  test('a signed transfer between clubs', () => {
    const item = describeFeedItem({
      id: 't1', player_id: 'p1', player_name: 'Kaze', player_position: 'CAM',
      from_club_name: 'Storm United', to_club_name: 'Night Owls FC',
      status: 'signed', status_label: 'SIGNED', deal_type_label: 'Permanent', transfer_fee: 1500,
    });
    expect(item).toMatchObject({
      id: 't1', playerId: 'p1', name: 'Kaze', initials: 'KA', position: 'CAM',
      from: 'Storm United', to: 'Night Owls FC', fromIsFree: false,
      status: 'signed', statusLabel: 'SIGNED', tone: 'success', fee: 1500, dealType: 'Permanent',
    });
  });

  test('free agent signing has no origin club', () => {
    const item = describeFeedItem({ id: 't2', player_name: 'Tikka', to_club_name: 'Night Owls FC', status: 'official' });
    expect(item.from).toBeNull();
    expect(item.fromIsFree).toBe(true);
    expect(item.tone).toBe('success');
  });

  test('tones', () => {
    expect(describeFeedItem({ id: 'a', status: 'negotiation' }).tone).toBe('warning');
    expect(describeFeedItem({ id: 'a', status: 'rumour' }).tone).toBe('warning');
    expect(describeFeedItem({ id: 'a', status: 'failed' }).tone).toBe('danger');
    expect(describeFeedItem({ id: 'a', status: 'official' }).tone).toBe('success');
  });

  test('no fee is not zero money', () => {
    expect(describeFeedItem({ id: 'a', transfer_fee: 0 }).fee).toBeNull();
    expect(describeFeedItem({ id: 'a' }).fee).toBeNull();
  });

  test('missing name falls back to the headline, never an invented one', () => {
    expect(describeFeedItem({ id: 'a', headline: 'Big move' }).name).toBe('Big move');
    expect(describeFeedItem({ id: 'a' }).name).toBe('');
  });
});

describe('offers', () => {
  beforeEach(() => jest.clearAllMocks());

  const received = { id: 'k1', team_id: 'c9', user_id: 'p1', target_player_id: 'p1', status: 'pending', contract_type: 'squad', weekly_salary_stc: 40, created_date: '2026-11-10T10:00:00Z' };
  const sent = { id: 'k2', team_id: 'c1', user_id: 'p7', target_player_id: 'p7', status: 'negotiating', contract_type: 'star', created_date: '2026-11-11T10:00:00Z' };

  test('live statuses', () => {
    ['pending', 'pending_window', 'negotiating'].forEach((status) => expect(offerIsLive({ status })).toBe(true));
    ['active', 'rejected', 'cancelled', 'expired'].forEach((status) => expect(offerIsLive({ status })).toBe(false));
  });

  test('received and sent offers, newest first, with the other party resolved', async () => {
    mockContractFilter.mockImplementation((query) => Promise.resolve(
      query.target_player_id ? [received] : query.team_id ? [sent] : [],
    ));
    mockClubGet.mockResolvedValue({ id: 'c9', name: 'Storm United' });
    mockPlayerGet.mockResolvedValue({ id: 'p7', gamertag: 'Vix' });
    const offers = await loadMyOffers({ player: { id: 'p1' }, presidentClub: { id: 'c1' } });
    expect(mockContractFilter).toHaveBeenCalledWith({ target_player_id: 'p1' });
    expect(mockContractFilter).toHaveBeenCalledWith({ team_id: 'c1' });
    expect(offers.map((o) => o.id)).toEqual(['k2', 'k1']);
    expect(offers[0]).toMatchObject({ direction: 'sent', counterpart: 'Vix', live: true });
    expect(offers[1]).toMatchObject({ direction: 'received', counterpart: 'Storm United', live: true, weeklyWage: 40 });
  });

  test('without a president club only received offers are read', async () => {
    mockContractFilter.mockResolvedValue([received]);
    mockClubGet.mockResolvedValue({ id: 'c9', name: 'Storm United' });
    const offers = await loadMyOffers({ player: { id: 'p1' }, presidentClub: null });
    expect(mockContractFilter).toHaveBeenCalledTimes(1);
    expect(offers).toHaveLength(1);
  });

  test('lifecycle contracts (ownership, founder) are not offers', async () => {
    mockContractFilter.mockResolvedValue([{ ...received, id: 'k3', contract_type: 'ownership' }, received]);
    mockClubGet.mockResolvedValue({ id: 'c9', name: 'Storm United' });
    const offers = await loadMyOffers({ player: { id: 'p1' }, presidentClub: null });
    expect(offers.map((o) => o.id)).toEqual(['k1']);
  });

  test('a counterpart that cannot be resolved stays empty, not invented', async () => {
    mockContractFilter.mockResolvedValue([received]);
    mockClubGet.mockRejectedValue(new Error('gone'));
    const offers = await loadMyOffers({ player: { id: 'p1' }, presidentClub: null });
    expect(offers[0].counterpart).toBe('');
  });

  test('nobody to look up: no offers, no calls', async () => {
    expect(await loadMyOffers({ player: null, presidentClub: null })).toEqual([]);
    expect(mockContractFilter).not.toHaveBeenCalled();
  });

  test('summary counts live offers and those waiting for me', () => {
    const list = [
      { direction: 'received', live: true },
      { direction: 'received', live: false },
      { direction: 'sent', live: true },
    ];
    expect(summarizeOffers(list)).toEqual({ liveCount: 2, waitingCount: 1 });
  });
});
