import { buildPlayerPayload, savePlayerProfile } from '../../lib/savePlayerProfile';

const mockGet = jest.fn();
const mockFilter = jest.fn();
const mockUpdate = jest.fn();
const mockCreate = jest.fn();

jest.mock('../../api/stageClient', () => ({
  stageClient: {
    entities: {
      Player: {
        get: (...a) => mockGet(...a),
        filter: (...a) => mockFilter(...a),
        update: (...a) => mockUpdate(...a),
        create: (...a) => mockCreate(...a),
      },
    },
  },
}));

jest.mock('../../lib/countries', () => ({
  COUNTRIES: [{ name: 'Belgium', code: 'BE' }],
}));

beforeEach(() => jest.clearAllMocks());

describe('buildPlayerPayload', () => {
  test('maps fields, resolves country_code, nulls "none" secondary, sets starting balances', () => {
    const payload = buildPlayerPayload({
      user: { id: 'u1', email: 'me@stage.test' },
      gamertag: '  NightOwl_10 ',
      position: 'ST',
      secondaryPosition: 'none',
      country: 'Belgium',
      platform: 'PS5',
    });
    expect(payload).toMatchObject({
      user_id: 'u1',
      email: 'me@stage.test',
      gamertag: 'NightOwl_10',
      position: 'ST',
      secondary_position: null,
      country: 'Belgium',
      country_code: 'BE',
      platform: 'PS5',
      credits: 50,
      stc: 50000,
    });
  });
});

describe('savePlayerProfile', () => {
  test('updates the player found by player_id', async () => {
    mockGet.mockResolvedValue({ id: 'p1' });
    mockUpdate.mockResolvedValue({ id: 'p1', gamertag: 'NightOwl_10' });
    const saved = await savePlayerProfile({
      user: { id: 'u1', email: 'me@stage.test', player_id: 'p1' },
      gamertag: 'NightOwl_10',
      position: 'ST',
      secondaryPosition: 'CAM',
      country: 'Belgium',
      platform: 'PS5',
    });
    expect(mockGet).toHaveBeenCalledWith('p1');
    expect(mockUpdate).toHaveBeenCalledWith('p1', expect.objectContaining({
      gamertag: 'NightOwl_10',
      secondary_position: 'CAM',
    }));
    expect(mockCreate).not.toHaveBeenCalled();
    expect(saved).toEqual({ id: 'p1', gamertag: 'NightOwl_10' });
  });

  test('creates a player when none exists', async () => {
    mockFilter.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: 'p2' });
    const saved = await savePlayerProfile({
      user: { id: 'u1', email: 'me@stage.test' },
      gamertag: 'Vix',
      position: 'ST',
      secondaryPosition: 'none',
      country: 'Belgium',
      platform: 'PS5',
    });
    expect(mockFilter).toHaveBeenCalledWith({ email: 'me@stage.test' }, null, 1);
    expect(mockCreate).toHaveBeenCalled();
    expect(saved).toEqual({ id: 'p2' });
  });
});
