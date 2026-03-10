import useAuthStore from '../../store/authStore';
import { setTokens, clearTokens } from '../../services/tokenService';

jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));
jest.mock('../../services/tokenService');

import api from '../../utils/api';

beforeEach(() => {
  useAuthStore.setState({ user: null, loading: false, error: null });
  jest.clearAllMocks();
});

const MOCK_USER = {
  id: 'u-1',
  first_name: 'Test',
  last_name: 'Player',
  email: 'test@eafc.com',
  gamer_tag: 'TestPlayer_99',
};

describe('authStore – login', () => {
  it('sets user and tokens on successful login', async () => {
    api.post.mockResolvedValueOnce({
      data: { data: { user: MOCK_USER, accessToken: 'access-tok', refreshToken: 'refresh-tok' } },
    });

    await useAuthStore.getState().login('test@eafc.com', 'Password123!');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(MOCK_USER);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(setTokens).toHaveBeenCalledWith('access-tok', 'refresh-tok');
  });

  it('sets error message on failed login', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });

    await useAuthStore.getState().login('bad@eafc.com', 'wrong');

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.error).toBe('Invalid credentials');
    expect(state.loading).toBe(false);
  });

  it('sets generic error when response message is absent', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error'));

    await useAuthStore.getState().login('test@eafc.com', 'pass');

    expect(useAuthStore.getState().error).toBe('Login failed');
  });
});

describe('authStore – register', () => {
  it('sets user and tokens on successful registration', async () => {
    api.post.mockResolvedValueOnce({
      data: { data: { user: MOCK_USER, accessToken: 'new-access', refreshToken: 'new-refresh' } },
    });

    await useAuthStore.getState().register({ first_name: 'Test', email: 'test@eafc.com', password: 'pass' });

    expect(useAuthStore.getState().user).toEqual(MOCK_USER);
    expect(setTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
  });

  it('sets error on failed registration', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Email already registered' } } });

    await useAuthStore.getState().register({ email: 'taken@eafc.com', password: 'pass' });

    expect(useAuthStore.getState().error).toBe('Email already registered');
  });
});

describe('authStore – logout', () => {
  it('clears user and calls clearTokens', async () => {
    useAuthStore.setState({ user: MOCK_USER });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(clearTokens).toHaveBeenCalledTimes(1);
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
