import useAuthStore from '../../store/authStore';
import { setTokens, clearTokens, getAccessToken } from '../../services/tokenService';

jest.mock('../../lib/polyfillStorage', () => ({
  hydrateStageStorage: jest.fn(async () => {}),
  localStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  sessionStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  installStoragePolyfill: jest.fn(),
}));

jest.mock('../../api/stageClient', () => ({
  stageClient: {
    auth: {
      me: jest.fn(),
      loginViaEmailPassword: jest.fn(),
      registerViaEmailPassword: jest.fn(),
      logout: jest.fn(),
    },
    entities: {
      Player: {
        update: jest.fn(),
        create: jest.fn(),
      },
    },
  },
  storeTokens: jest.fn(async () => {}),
}));
jest.mock('../../services/tokenService');

import { stageClient } from '../../api/stageClient';

beforeEach(() => {
  useAuthStore.setState({ user: null, loading: false, error: null });
  jest.clearAllMocks();
});

const MOCK_ME = {
  id: 'u-1',
  email: 'test@eafc.com',
  gamertag: 'TestPlayer_99',
  player_id: 'p-1',
};

const MOCK_USER = {
  id: 'u-1',
  first_name: 'TestPlayer',
  last_name: '99',
  email: 'test@eafc.com',
  gamer_tag: 'TestPlayer_99',
  gamertag: 'TestPlayer_99',
  avatar: null,
  team_id: null,
  player_id: 'p-1',
};

describe('authStore – initialize', () => {
  it('restores user from stored token via stageClient.auth.me', async () => {
    getAccessToken.mockResolvedValueOnce('stored-token');
    stageClient.auth.me.mockResolvedValueOnce(MOCK_ME);

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().user).toMatchObject({
      id: 'u-1',
      email: 'test@eafc.com',
      gamer_tag: 'TestPlayer_99',
    });
    expect(stageClient.auth.me).toHaveBeenCalled();
  });

  it('does nothing when no token stored', async () => {
    getAccessToken.mockResolvedValueOnce(null);

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().user).toBeNull();
    expect(stageClient.auth.me).not.toHaveBeenCalled();
  });

  it('clears tokens when /auth/me fails with 401', async () => {
    getAccessToken.mockResolvedValueOnce('expired-token');
    stageClient.auth.me.mockRejectedValueOnce({ status: 401 });

    await useAuthStore.getState().initialize();

    expect(clearTokens).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('authStore – login', () => {
  it('sets user and returns true on successful login', async () => {
    stageClient.auth.loginViaEmailPassword.mockResolvedValueOnce({ access_token: 'access-tok' });
    stageClient.auth.me.mockResolvedValueOnce(MOCK_ME);

    const ok = await useAuthStore.getState().login('test@eafc.com', 'Password123!');

    const state = useAuthStore.getState();
    expect(ok).toBe(true);
    expect(state.user).toMatchObject({ id: 'u-1', gamer_tag: 'TestPlayer_99' });
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(stageClient.auth.loginViaEmailPassword).toHaveBeenCalledWith('test@eafc.com', 'Password123!');
  });

  it('sets error message on failed login', async () => {
    stageClient.auth.loginViaEmailPassword.mockRejectedValueOnce({ message: 'Invalid credentials' });

    const ok = await useAuthStore.getState().login('bad@eafc.com', 'wrong');

    const state = useAuthStore.getState();
    expect(ok).toBe(false);
    expect(state.user).toBeNull();
    expect(state.error).toBe('Invalid credentials');
    expect(state.loading).toBe(false);
  });

  it('sets generic error when response message is absent', async () => {
    stageClient.auth.loginViaEmailPassword.mockRejectedValueOnce({ status: 500 });

    await useAuthStore.getState().login('test@eafc.com', 'pass');

    expect(useAuthStore.getState().error).toBe('Login failed');
  });

  it('requires identifier and password', async () => {
    const ok = await useAuthStore.getState().login('  ', '');
    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe('Email/gamer tag and password are required');
    expect(stageClient.auth.loginViaEmailPassword).not.toHaveBeenCalled();
  });
});

describe('authStore – register', () => {
  it('sets user and tokens on successful registration', async () => {
    stageClient.auth.registerViaEmailPassword.mockResolvedValueOnce({ access_token: 'new-access' });
    stageClient.auth.me.mockResolvedValueOnce(MOCK_ME);

    await useAuthStore.getState().register({ first_name: 'Test', email: 'test@eafc.com', password: 'pass' });

    expect(useAuthStore.getState().user).toMatchObject({ id: 'u-1' });
  });

  it('sets error on failed registration', async () => {
    stageClient.auth.registerViaEmailPassword.mockRejectedValueOnce({ message: 'Email already registered' });

    await useAuthStore.getState().register({ email: 'taken@eafc.com', password: 'pass' });

    expect(useAuthStore.getState().error).toBe('Email already registered');
  });
});

describe('authStore – logout', () => {
  it('clears user and calls logout', async () => {
    useAuthStore.setState({ user: MOCK_USER });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(stageClient.auth.logout).toHaveBeenCalled();
  });
});

describe('authStore – updateUser', () => {
  it('updates user in state', () => {
    useAuthStore.setState({ user: MOCK_USER });
    const updated = { ...MOCK_USER, gamer_tag: 'NewTag_77' };
    useAuthStore.getState().updateUser(updated);
    expect(useAuthStore.getState().user.gamer_tag).toBe('NewTag_77');
  });
});
