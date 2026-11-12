import {
  loadSeasonRegistration,
  windowStatus,
  windowActions,
  playerStatusKey,
  applyToWindow,
  confirmParticipation,
  respondReserve,
  MIN_CONFIRMED_PLAYERS,
} from '../../lib/seasonRegistration';

const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('../../api/stageClient', () => ({
  stageClient: {
    http: { get: (...a) => mockGet(...a), post: (...a) => mockPost(...a) },
  },
}));

const win = (over = {}) => ({
  id: 'w1', region_slug: 'benelux', platform: 'ps5', season_number: 5, phase: 'registration',
  policy_version: 'regional_registration_v1', opens_at: '2026-11-01T00:00:00Z',
  registration_closes_at: '2026-11-29T00:00:00Z', confirmation_closes_at: '2026-12-06T00:00:00Z',
  ...over,
});
const app = (over = {}) => ({
  id: 'a1', registration_window_id: 'w1', status: 'pending', participation_status: 'registered', ...over,
});
const readiness = (over = {}) => ({
  club: { id: 'c1', name: 'Mine' },
  can_manage_registration: true,
  registrar_status: 'eligible',
  minimum_players: 3,
  eligible_count: 4,
  players: [],
  registrations: [],
  ...over,
});

describe('loadSeasonRegistration', () => {
  beforeEach(() => jest.clearAllMocks());

  test('loads the published windows and the club readiness', async () => {
    mockGet.mockImplementation((path) => {
      if (path === '/regional-leagues/registration-windows') return Promise.resolve({ windows: [win()] });
      if (path === '/regional-leagues/registration-readiness/c1') return Promise.resolve(readiness());
      return Promise.reject(new Error(`unexpected ${path}`));
    });
    const data = await loadSeasonRegistration({ clubId: 'c1' });
    expect(data.windows).toHaveLength(1);
    expect(data.readiness.club.id).toBe('c1');
    expect(data.accessNote).toBe('');
  });

  test('a 403 on readiness keeps the windows readable and explains why', async () => {
    mockGet.mockImplementation((path) => {
      if (path.includes('registration-readiness')) return Promise.reject({ status: 403, message: 'Only the president' });
      return Promise.resolve({ windows: [win()] });
    });
    const data = await loadSeasonRegistration({ clubId: 'c1' });
    expect(data.readiness).toBeNull();
    expect(data.accessNote).toBe('Only the president');
    expect(data.windows).toHaveLength(1);
  });

  test('no club: only the windows are read', async () => {
    mockGet.mockResolvedValue({ windows: [win()] });
    const data = await loadSeasonRegistration({ clubId: null });
    expect(data.readiness).toBeNull();
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  test('malformed data is an error, never a half screen', async () => {
    mockGet.mockResolvedValue({});
    await expect(loadSeasonRegistration({ clubId: null })).rejects.toThrow(/incomplete/i);
  });

  test('a server failure on the windows propagates', async () => {
    mockGet.mockRejectedValue({ status: 500, message: 'down' });
    await expect(loadSeasonRegistration({ clubId: 'c1' })).rejects.toMatchObject({ message: 'down' });
  });
});

describe('windowStatus', () => {
  test('open / upcoming / confirmation-only / closed without an application', () => {
    expect(windowStatus(win({ phase: 'registration' }), null)).toBe('open');
    expect(windowStatus(win({ phase: 'upcoming' }), null)).toBe('upcoming');
    expect(windowStatus(win({ phase: 'confirmation' }), null)).toBe('confirmationOnly');
    expect(windowStatus(win({ phase: 'closed' }), null)).toBe('closed');
  });

  test('with an application', () => {
    expect(windowStatus(win({ phase: 'registration' }), app())).toBe('registered');
    expect(windowStatus(win({ phase: 'confirmation' }), app())).toBe('registered');
    expect(windowStatus(win({ phase: 'closed' }), app())).toBe('confirmationClosed');
    expect(windowStatus(win(), app({ status: 'withdrawn' }))).toBe('withdrawn');
    expect(windowStatus(win(), app({ status: 'rejected' }))).toBe('rejected');
    expect(windowStatus(win(), app({ status: 'waitlisted' }))).toBe('waitlisted');
    expect(windowStatus(win({ phase: 'closed' }), app({ status: 'approved', participation_status: 'confirmed' }))).toBe('confirmedPending');
    expect(windowStatus(win({ phase: 'closed' }), app({ status: 'approved', participation_status: 'confirmed', assigned_league_id: 'l1', assigned_division: 2 }))).toBe('confirmedAssigned');
  });
});

describe('windowActions', () => {
  test('president can register in the registration phase', () => {
    expect(windowActions(win(), null, readiness())).toEqual({ canRegister: true, canConfirm: false, canReserve: false });
  });
  test('a withdrawn application can register again', () => {
    expect(windowActions(win(), app({ status: 'withdrawn' }), readiness()).canRegister).toBe(true);
  });
  test('confirm only in the confirmation week for a pending application', () => {
    expect(windowActions(win({ phase: 'confirmation' }), app(), readiness())).toEqual({ canRegister: false, canConfirm: true, canReserve: false });
    expect(windowActions(win({ phase: 'registration' }), app(), readiness()).canConfirm).toBe(false);
  });
  test('reserve place: invitation, no answer yet, before its deadline, window closed', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();
    const invited = app({ reserve_invitation: { deadline: future } });
    expect(windowActions(win({ phase: 'closed' }), invited, readiness()).canReserve).toBe(true);
    expect(windowActions(win({ phase: 'closed' }), app({ reserve_invitation: { deadline: past } }), readiness()).canReserve).toBe(false);
    expect(windowActions(win({ phase: 'closed' }), app({ reserve_invitation: { deadline: future }, reserve_response: { decision: 'decline' } }), readiness()).canReserve).toBe(false);
  });
  test('nothing is possible without management rights', () => {
    expect(windowActions(win(), null, readiness({ can_manage_registration: false }))).toEqual({ canRegister: false, canConfirm: false, canReserve: false });
    expect(windowActions(win(), null, null)).toEqual({ canRegister: false, canConfirm: false, canReserve: false });
  });
});

describe('playerStatusKey and the minimum', () => {
  test('keys', () => {
    expect(playerStatusKey('eligible')).toBe('eligible');
    expect(playerStatusKey('plus_required')).toBe('plusRequired');
    expect(playerStatusKey('plus_expired')).toBe('plusExpired');
    expect(playerStatusKey('subscription_review')).toBe('subscriptionReview');
    expect(playerStatusKey('registered_elsewhere')).toBe('registeredElsewhere');
    expect(playerStatusKey('weird')).toBe('review');
  });
  test('three players minimum', () => {
    expect(MIN_CONFIRMED_PLAYERS).toBe(3);
  });
});

describe('actions hit the real endpoints with the real bodies', () => {
  beforeEach(() => { jest.clearAllMocks(); mockPost.mockResolvedValue({ applied: true }); });

  test('apply', async () => {
    await applyToWindow({ window: win(), clubId: 'c1', note: ' hi ' });
    expect(mockPost).toHaveBeenCalledWith('/regional-leagues/registration-windows/w1/apply', {
      club_id: 'c1', policy_version: 'regional_registration_v1', note: 'hi',
    });
  });

  test('confirm with the selected players', async () => {
    await confirmParticipation({ window: win(), application: app(), clubId: 'c1', playerIds: ['p1', 'p2', 'p3'] });
    expect(mockPost).toHaveBeenCalledWith('/regional-leagues/registrations/a1/confirm', {
      club_id: 'c1', policy_version: 'regional_registration_v1', player_ids: ['p1', 'p2', 'p3'],
    });
  });

  test('confirm refuses fewer than three players before calling the server', async () => {
    await expect(confirmParticipation({ window: win(), application: app(), clubId: 'c1', playerIds: ['p1'] }))
      .rejects.toThrow(/3/);
    expect(mockPost).not.toHaveBeenCalled();
  });

  test('reserve accept needs players, decline does not', async () => {
    await respondReserve({ window: win(), application: app(), clubId: 'c1', decision: 'accept', playerIds: ['a', 'b', 'c'] });
    expect(mockPost).toHaveBeenLastCalledWith('/regional-leagues/registrations/a1/reserve', {
      club_id: 'c1', policy_version: 'regional_registration_v1', decision: 'accept', player_ids: ['a', 'b', 'c'],
    });
    await respondReserve({ window: win(), application: app(), clubId: 'c1', decision: 'decline' });
    expect(mockPost).toHaveBeenLastCalledWith('/regional-leagues/registrations/a1/reserve', {
      club_id: 'c1', policy_version: 'regional_registration_v1', decision: 'decline',
    });
    await expect(respondReserve({ window: win(), application: app(), clubId: 'c1', decision: 'accept', playerIds: [] }))
      .rejects.toThrow(/3/);
  });
});
