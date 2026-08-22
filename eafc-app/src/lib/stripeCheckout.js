import * as WebBrowser from 'expo-web-browser';
import { stageClient } from '@/api/stageClient';
import { getStageOrigin } from '@/utils/stageConfig';

WebBrowser.maybeCompleteAuthSession?.();

export function unwrapCheckoutResult(result) {
  if (!result || typeof result !== 'object') return {};
  return result.data && typeof result.data === 'object' ? result.data : result;
}

export function mobileStoreDeepLinkFromSearch(search = '') {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  params.delete('client');
  const qs = params.toString();
  return qs ? `stage://apps/store?${qs}` : 'stage://apps/store';
}

export function isMobileStoreReturnUrl(url) {
  const value = String(url || '');
  return /\/store\/mobile-return/i.test(value) || /^stage:\/\/apps\/store/i.test(value);
}

export function storeCheckoutUrls({ kind, extra = {} } = {}) {
  const origin = getStageOrigin().replace(/\/$/, '');
  const params = new URLSearchParams({ client: 'mobile', ...extra });
  const returnBase = `${origin}/store/mobile-return`;
  if (kind === 'subscription') {
    return {
      successUrl: `${returnBase}?sub=success&${params.toString()}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${returnBase}?sub=cancelled&client=mobile`,
    };
  }
  return {
    successUrl: `${returnBase}?payment=success&${params.toString()}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${returnBase}?payment=cancelled&client=mobile`,
  };
}

export function checkoutReturnStatus(result) {
  const url = String(result?.url || '');
  if (url.includes('sub=cancelled') || url.includes('payment=cancelled')) return 'cancelled';
  if (url.includes('sub=success') || url.includes('payment=success')) return 'paid';
  if (result?.type === 'cancel') return 'cancelled';
  return 'unknown';
}

export function parseCheckoutSessionId(url, fallbackId = null) {
  if (url) {
    try {
      const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
      const id = new URLSearchParams(query).get('session_id');
      if (id && id !== '{CHECKOUT_SESSION_ID}') return id;
    } catch {
      /* ignore */
    }
  }
  return fallbackId || null;
}

async function openCheckout(checkoutUrl) {
  const origin = getStageOrigin().replace(/\/$/, '');
  return WebBrowser.openAuthSessionAsync(checkoutUrl, `${origin}/store/mobile-return`, {
    preferEphemeralSession: false,
    showInRecents: false,
  });
}

async function fulfilOrCancel({ sessionId, browser, fixName }) {
  const status = checkoutReturnStatus(browser);
  if (status === 'cancelled') return { status: 'cancelled' };

  const id = parseCheckoutSessionId(browser?.url, sessionId);
  if (!id) return { status: 'pending' };

  try {
    const fixed = unwrapCheckoutResult(await stageClient.functions.invoke(fixName, { session_id: id }));
    if (fixed.success) return { status: 'activated', data: fixed };
    return { status: 'pending' };
  } catch (err) {
    const message = String(err?.message || '');
    if (/not complete yet|not a subscription|not a credit/i.test(message)) {
      return { status: 'cancelled' };
    }
    throw err;
  }
}

export async function startStagePlusCheckout({ billing = 'monthly' } = {}) {
  const urls = storeCheckoutUrls({
    kind: 'subscription',
    extra: { tier: 'stage_plus', billing },
  });
  const created = unwrapCheckoutResult(await stageClient.functions.invoke('stripeSubscription', {
    tier: 'stage_plus',
    billing,
    successUrl: urls.successUrl,
    cancelUrl: urls.cancelUrl,
  }));
  if (created.success === false || !created.url) {
    throw new Error(created.error || 'Failed to start checkout.');
  }

  const browser = await openCheckout(created.url);
  return fulfilOrCancel({
    sessionId: created.id,
    browser,
    fixName: 'fixSubscription',
  });
}

export async function startCreditPackCheckout(pack) {
  if (!pack?.id) throw new Error('Unknown credit pack');
  const urls = storeCheckoutUrls({
    kind: 'credits',
    extra: { pack: pack.id, credits: String(pack.credits || '') },
  });
  const created = unwrapCheckoutResult(await stageClient.functions.invoke('stripeCheckout', {
    packId: pack.id,
    successUrl: urls.successUrl,
    cancelUrl: urls.cancelUrl,
  }));
  if (created.success === false || !created.url) {
    throw new Error(created.error || 'Failed to start checkout.');
  }

  const browser = await openCheckout(created.url);
  return fulfilOrCancel({
    sessionId: created.id,
    browser,
    fixName: 'fixCredits',
  });
}

export async function completeStoreCheckoutFromUrl(url) {
  const status = checkoutReturnStatus({ url });
  if (status === 'cancelled') return { status: 'cancelled' };
  const sessionId = parseCheckoutSessionId(url);
  if (!sessionId) return { status: 'pending' };
  const payment = /(?:^|[?&])payment=success(?:&|$)/.test(String(url));
  const fixName = payment ? 'fixCredits' : 'fixSubscription';
  try {
    const fixed = unwrapCheckoutResult(await stageClient.functions.invoke(fixName, { session_id: sessionId }));
    if (fixed.success) return { status: 'activated', data: fixed };
    return { status: 'pending' };
  } catch (err) {
    const message = String(err?.message || '');
    if (/not complete yet|not a subscription|not a credit/i.test(message)) {
      return { status: 'cancelled' };
    }
    throw err;
  }
}

export async function cancelStagePlusSubscription() {
  const result = unwrapCheckoutResult(await stageClient.functions.invoke('cancelStagePlus'));
  if (result.success === false) {
    throw new Error(result.error || 'Could not cancel STAGE Plus');
  }
  if (result.success !== true && result.error) {
    throw new Error(result.error);
  }
  return result;
}
