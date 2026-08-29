import { unwrapAuthTokens } from '../../lib/authTokens';
import { hasStagePlus, entityHasStagePlus } from '../../lib/subscriptionUtils';

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: () => 'stage://auth/callback',
}));
jest.mock('../../store/authStore', () => ({
  __esModule: true,
  default: { getState: () => ({ setUserFromOAuth: jest.fn() }) },
}));

import { parseOAuthCallbackUrl } from '../../hooks/useSocialAuth';

describe('unwrapAuthTokens', () => {
  it('reads top-level Stage refresh payloads', () => {
    expect(unwrapAuthTokens({ accessToken: 'a', refreshToken: 'r' })).toEqual({
      accessToken: 'a',
      refreshToken: 'r',
    });
  });

  it('reads nested data.accessToken payloads used by some compat responses', () => {
    expect(unwrapAuthTokens({ data: { accessToken: 'a2', refreshToken: 'r2' } })).toEqual({
      accessToken: 'a2',
      refreshToken: 'r2',
    });
  });
});

describe('hasStagePlus expiry', () => {
  it('keeps a plus tier without an expiry date as active', () => {
    expect(hasStagePlus('stage_plus')).toBe(true);
    expect(hasStagePlus('plus')).toBe(true);
    expect(hasStagePlus('free')).toBe(false);
  });

  it('rejects an expired plus subscription', () => {
    expect(hasStagePlus('stage_plus', '2020-01-01T00:00:00.000Z')).toBe(false);
    expect(hasStagePlus('stage_plus', '2099-01-01T00:00:00.000Z')).toBe(true);
  });

  it('reads expiry from a player/user row', () => {
    expect(entityHasStagePlus({ subscription: 'stage_plus', subscription_expires_at: '2020-01-01' })).toBe(false);
    expect(entityHasStagePlus({ subscription: 'stage_plus' })).toBe(true);
  });
});

describe('parseOAuthCallbackUrl', () => {
  it('accepts camelCase tokens from the Stage mobile redirect', () => {
    const parsed = parseOAuthCallbackUrl(
      'stage://auth/callback?accessToken=at&refreshToken=rt&isNewUser=1&userId=u-1',
    );
    expect(parsed).toMatchObject({
      accessToken: 'at',
      refreshToken: 'rt',
      isNewUser: true,
    });
  });

  it('accepts snake_case tokens from the same callback path as callback.jsx', () => {
    const parsed = parseOAuthCallbackUrl(
      'stage://auth/callback?access_token=at&refresh_token=rt&isNewUser=0',
    );
    expect(parsed).toMatchObject({
      accessToken: 'at',
      refreshToken: 'rt',
      isNewUser: false,
    });
  });
});
