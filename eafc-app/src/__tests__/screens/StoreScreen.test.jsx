import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockRefetch = jest.fn(() => Promise.resolve());
let mockParams = {};
let mockResource;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('expo-blur', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return { BlurView: ({ children, style }) => ReactModule.createElement(View, { style }, children) };
});
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({})),
  stageClient: {},
}));
jest.mock('../../hooks/useStoreScreen', () => ({ __esModule: true, default: () => mockResource }));

const mockStartPlus = jest.fn();
const mockStartPack = jest.fn();
const mockCancelPlus = jest.fn();
const mockCompleteReturn = jest.fn();
jest.mock('../../lib/stripeCheckout', () => ({
  startStagePlusCheckout: (...a) => mockStartPlus(...a),
  startCreditPackCheckout: (...a) => mockStartPack(...a),
  cancelStagePlusSubscription: (...a) => mockCancelPlus(...a),
  completeStoreCheckoutFromUrl: (...a) => mockCompleteReturn(...a),
}));

import StoreScreen from '../../app/apps/store';

function resource(data, over = {}) {
  return { data, loading: false, error: null, refreshing: false, refetch: mockRefetch, ...over };
}
const config = {
  name: 'STAGE Plus', stage_plus_monthly_price: 4.99, stage_plus_yearly_price: 49.99, monthly_credits: 150,
  perks: ['Enter official competitions', 'Full rankings'],
};
const free = { player: { id: 'pl1' }, config, credits: 12, stc: 400 };
const subscribed = (extra = {}) => ({
  ...free,
  player: { id: 'pl1', subscription: 'stage_plus', subscription_expires_at: '2099-01-01T12:00:00Z', subscription_cancel_at_period_end: 0, ...extra },
});

describe('Store screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockResource = resource(free);
  });

  test('loading skeleton, then error with Retry', () => {
    mockResource = resource(undefined, { loading: true });
    const loading = render(<StoreScreen />);
    expect(loading.getByTestId('skeleton-list')).toBeTruthy();
    loading.unmount();
    mockResource = resource(undefined, { error: 'Store down' });
    const failed = render(<StoreScreen />);
    expect(failed.getByText('Store down')).toBeTruthy();
    fireEvent.press(failed.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  test('shows the STC balance, Get STC title and only packs + STAGE Plus (no catalogue)', () => {
    const { getByLabelText, getByText, queryByText } = render(<StoreScreen />);
    expect(getByLabelText('Balance 400 STC')).toBeTruthy();
    expect(getByText('GET STC')).toBeTruthy();
    expect(getByText('Store')).toBeTruthy();
    expect(getByText('STAGE Plus')).toBeTruthy();
    expect(getByText('€4.99 / mo')).toBeTruthy();
    expect(getByText('STC packs')).toBeTruthy();
    expect(getByText('POPULAR')).toBeTruthy();
    expect(queryByText(/jersey|shoe|boots/i)).toBeNull();
  });

  test('lists every real pack with its price', () => {
    const { getByText, getAllByLabelText } = render(<StoreScreen />);
    ['€1.99', '€2.99', '€5.99', '€10.99'].forEach((price) => expect(getByText(price)).toBeTruthy());
    expect(getByText('600')).toBeTruthy();
    expect(getAllByLabelText(/^Buy /)).toHaveLength(4);
  });

  test('billing period switches the price and the checkout call', async () => {
    mockStartPlus.mockResolvedValue({ status: 'activated' });
    const { getByText, getByLabelText, findByText } = render(<StoreScreen />);
    fireEvent.press(getByText('Yearly'));
    expect(getByText('€49.99 / yr')).toBeTruthy();
    fireEvent.press(getByLabelText('Subscribe'));
    await waitFor(() => expect(mockStartPlus).toHaveBeenCalledWith({ billing: 'yearly' }));
    expect(await findByText('STAGE Plus activated.')).toBeTruthy();
    expect(mockRefetch).toHaveBeenCalled();
  });

  test('payment cancelled is a neutral notice, nothing is refetched as success', async () => {
    mockStartPlus.mockResolvedValue({ status: 'cancelled' });
    const { getByLabelText, findByText } = render(<StoreScreen />);
    fireEvent.press(getByLabelText('Subscribe'));
    expect(await findByText('Payment cancelled. Nothing was charged.')).toBeTruthy();
  });

  test('payment pending offers Check again', async () => {
    mockStartPack.mockResolvedValue({ status: 'pending' });
    const { getAllByLabelText, findByText, getByLabelText } = render(<StoreScreen />);
    fireEvent.press(getAllByLabelText(/^Buy /)[0]);
    expect(await findByText('Payment received. We are confirming it.')).toBeTruthy();
    mockRefetch.mockClear();
    fireEvent.press(getByLabelText('Check again'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  test('checkout errors are shown', async () => {
    mockStartPlus.mockRejectedValue(new Error('Card declined'));
    const { getByLabelText, findByText } = render(<StoreScreen />);
    fireEvent.press(getByLabelText('Subscribe'));
    expect(await findByText('Card declined')).toBeTruthy();
  });

  test('buying a pack starts its checkout and reports the credits added', async () => {
    mockStartPack.mockResolvedValue({ status: 'activated', data: { credits_added: 50 } });
    const { getByLabelText, findByText } = render(<StoreScreen />);
    fireEvent.press(getByLabelText('Buy Entry Pack'));
    await waitFor(() => expect(mockStartPack).toHaveBeenCalledWith(expect.objectContaining({ id: 'credits_entry' })));
    expect(await findByText('+50 credits added.')).toBeTruthy();
  });

  test('subscribed: shows the renewal date, and cancels renewal after confirmation', async () => {
    mockResource = resource(subscribed());
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, getByLabelText, findByText, queryByLabelText } = render(<StoreScreen />);
    expect(getByText('Active · renews on 1 January 2099')).toBeTruthy();
    expect(queryByLabelText('Subscribe')).toBeNull();
    fireEvent.press(getByLabelText('Cancel renewal'));
    expect(alertSpy).toHaveBeenCalled();
    expect(mockCancelPlus).not.toHaveBeenCalled();
    await act(async () => { await alertSpy.mock.calls[0][2][1].onPress(); });
    expect(mockCancelPlus).toHaveBeenCalled();
    expect(await findByText('STAGE Plus will end at the current period.')).toBeTruthy();
    alertSpy.mockRestore();
  });

  test('renewal already off: ending line and an inert button', () => {
    mockResource = resource(subscribed({ subscription_cancel_at_period_end: 1 }));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, getByLabelText } = render(<StoreScreen />);
    expect(getByText('Active until 1 January 2099 · renewal off')).toBeTruthy();
    fireEvent.press(getByLabelText('Renewal off'));
    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockCancelPlus).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  test('a cancel failure is shown', async () => {
    mockResource = resource(subscribed());
    mockCancelPlus.mockRejectedValue(new Error('Stripe unreachable'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByLabelText, findByText } = render(<StoreScreen />);
    fireEvent.press(getByLabelText('Cancel renewal'));
    await act(async () => { await alertSpy.mock.calls[0][2][1].onPress(); });
    expect(await findByText('Stripe unreachable')).toBeTruthy();
    alertSpy.mockRestore();
  });

  test('no player profile: asks to create one and starts nothing', async () => {
    mockResource = resource({ ...free, player: null });
    const { getByLabelText, getAllByLabelText, findByText } = render(<StoreScreen />);
    fireEvent.press(getByLabelText('Subscribe'));
    expect(await findByText('Create a player profile first.')).toBeTruthy();
    fireEvent.press(getAllByLabelText(/^Buy /)[0]);
    expect(mockStartPlus).not.toHaveBeenCalled();
    expect(mockStartPack).not.toHaveBeenCalled();
  });

  test('coming back from Stripe completes the checkout once and clears the route', async () => {
    mockParams = { payment: 'success', session_id: 'cs_1' };
    mockCompleteReturn.mockResolvedValue({ status: 'activated', data: { credits_added: 100 } });
    const { findByText } = render(<StoreScreen />);
    expect(await findByText('+100 credits added.')).toBeTruthy();
    expect(mockCompleteReturn).toHaveBeenCalledTimes(1);
    expect(mockCompleteReturn).toHaveBeenCalledWith('stage://apps/store?payment=success&session_id=cs_1');
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/apps/store'));
  });

  test('cancelled return from Stripe shows the neutral notice', async () => {
    mockParams = { sub: 'cancelled' };
    mockCompleteReturn.mockResolvedValue({ status: 'cancelled' });
    const { findByText } = render(<StoreScreen />);
    expect(await findByText('Payment cancelled. Nothing was charged.')).toBeTruthy();
  });

  test('Back leaves the screen', () => {
    const { getByLabelText } = render(<StoreScreen />);
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
