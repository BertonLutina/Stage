import {
  checkoutReturnStatus,
  isMobileStoreReturnUrl,
  mobileStoreDeepLinkFromSearch,
  parseCheckoutSessionId,
  startCreditPackCheckout,
  startStagePlusCheckout,
  storeCheckoutUrls,
} from '../../lib/stripeCheckout';
import { stageClient } from '../../api/stageClient';

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('../../api/stageClient', () => ({
  stageClient: { functions: { invoke: jest.fn() } },
}));

jest.mock('../../utils/stageConfig', () => ({
  getStageOrigin: () => 'https://stageleagues.com',
}));

const WebBrowser = require('expo-web-browser');

describe('storeCheckoutUrls', () => {
  test('sends Stripe back to a mobile HTTPS handoff, not the website Store', () => {
    const urls = storeCheckoutUrls({ kind: 'subscription', extra: { tier: 'stage_plus', billing: 'monthly' } });
    expect(urls.successUrl).toContain('https://stageleagues.com/store/mobile-return?sub=success');
    expect(urls.successUrl).toContain('client=mobile');
    expect(urls.successUrl).toContain('session_id={CHECKOUT_SESSION_ID}');
    expect(urls.cancelUrl).toContain('/store/mobile-return?sub=cancelled');
    expect(urls.successUrl).not.toMatch(/\/store\?sub=success/);
  });
});

describe('mobile store deep link', () => {
  test('turns the HTTPS return query into a stage:// app URL', () => {
    expect(mobileStoreDeepLinkFromSearch('client=mobile&sub=success&session_id=cs_1')).toBe(
      'stage://apps/store?sub=success&session_id=cs_1',
    );
    expect(isMobileStoreReturnUrl('https://stageleagues.com/store/mobile-return?sub=success')).toBe(true);
    expect(isMobileStoreReturnUrl('stage://apps/store?sub=success')).toBe(true);
    expect(isMobileStoreReturnUrl('https://stageleagues.com/store?sub=success')).toBe(false);
  });
});

describe('checkout return parsing', () => {
  test('reads paid, cancelled, and session id from the browser return URL', () => {
    expect(checkoutReturnStatus({ url: 'https://stageleagues.com/store?sub=success&session_id=cs_1' })).toBe('paid');
    expect(checkoutReturnStatus({ url: 'https://stageleagues.com/store?sub=cancelled' })).toBe('cancelled');
    expect(checkoutReturnStatus({ type: 'cancel' })).toBe('cancelled');
    expect(parseCheckoutSessionId('https://stageleagues.com/store?sub=success&session_id=cs_live_1', 'cs_fallback')).toBe('cs_live_1');
    expect(parseCheckoutSessionId(null, 'cs_fallback')).toBe('cs_fallback');
  });
});

describe('startStagePlusCheckout', () => {
  beforeEach(() => {
    stageClient.functions.invoke.mockReset();
    WebBrowser.openAuthSessionAsync.mockReset();
  });

  test('opens Stripe Checkout then activates STAGE Plus with the session id', async () => {
    stageClient.functions.invoke
      .mockResolvedValueOnce({ data: { success: true, url: 'https://checkout.stripe.com/c/cs_test', id: 'cs_test' } })
      .mockResolvedValueOnce({ data: { success: true, tier: 'stage_plus' } });
    WebBrowser.openAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'https://stageleagues.com/store?sub=success&session_id=cs_test',
    });

    const outcome = await startStagePlusCheckout({ billing: 'yearly' });

    expect(stageClient.functions.invoke).toHaveBeenNthCalledWith(1, 'stripeSubscription', expect.objectContaining({
      tier: 'stage_plus',
      billing: 'yearly',
      successUrl: expect.stringContaining('session_id={CHECKOUT_SESSION_ID}'),
    }));
    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://checkout.stripe.com/c/cs_test',
      'https://stageleagues.com/store/mobile-return',
      expect.any(Object),
    );
    expect(stageClient.functions.invoke).toHaveBeenNthCalledWith(2, 'fixSubscription', { session_id: 'cs_test' });
    expect(outcome).toEqual({ status: 'activated', data: { success: true, tier: 'stage_plus' } });
  });

  test('returns cancelled when Stripe sends the user back to cancel', async () => {
    stageClient.functions.invoke.mockResolvedValueOnce({
      data: { success: true, url: 'https://checkout.stripe.com/c/cs_test', id: 'cs_test' },
    });
    WebBrowser.openAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'https://stageleagues.com/store?sub=cancelled&client=mobile',
    });

    await expect(startStagePlusCheckout()).resolves.toEqual({ status: 'cancelled' });
    expect(stageClient.functions.invoke).toHaveBeenCalledTimes(1);
  });
});

describe('startCreditPackCheckout', () => {
  beforeEach(() => {
    stageClient.functions.invoke.mockReset();
    WebBrowser.openAuthSessionAsync.mockReset();
  });

  test('opens a one-time Stripe payment for a credit pack', async () => {
    stageClient.functions.invoke
      .mockResolvedValueOnce({ data: { success: true, url: 'https://checkout.stripe.com/c/pay', id: 'cs_pay' } })
      .mockResolvedValueOnce({ data: { success: true, credits_added: 50 } });
    WebBrowser.openAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'https://stageleagues.com/store?payment=success&session_id=cs_pay',
    });

    const outcome = await startCreditPackCheckout({ id: 'credits_entry', credits: 50 });
    expect(stageClient.functions.invoke).toHaveBeenNthCalledWith(1, 'stripeCheckout', expect.objectContaining({
      packId: 'credits_entry',
    }));
    expect(stageClient.functions.invoke).toHaveBeenNthCalledWith(2, 'fixCredits', { session_id: 'cs_pay' });
    expect(outcome.status).toBe('activated');
  });
});
