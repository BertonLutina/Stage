import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRefetch = jest.fn(() => Promise.resolve());
let mockResource;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
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
jest.mock('../../hooks/useLifestyle', () => ({ __esModule: true, default: () => mockResource }));

const mockBuy = jest.fn();
const mockRent = jest.fn();
const mockInvest = jest.fn();
const mockSell = jest.fn();
const mockCollect = jest.fn();
const mockCollectInvest = jest.fn();
jest.mock('../../lib/lifestyle', () => ({
  ...jest.requireActual('../../lib/lifestyle'),
  buyItem: (...a) => mockBuy(...a),
  rentItem: (...a) => mockRent(...a),
  investInItem: (...a) => mockInvest(...a),
  sellAsset: (...a) => mockSell(...a),
  collectPassiveIncome: (...a) => mockCollect(...a),
  collectInvestment: (...a) => mockCollectInvest(...a),
}));

import LifestyleScreen from '../../app/apps/lifestyle';

const DAY = 86400000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString();

const apartment = {
  id: 'i1', name: 'City apartment', tier: 'tier2', category: 'real_estate', price_stc: 1200,
  can_buy: 1, can_rent: 1, rent_price_stc: 150, rent_duration_days: 30,
  passive_income_stc: 60, passive_income_interval_days: 7, weekly_maintenance_stc: 15, can_sell: 1, sell_value_percent: 60,
};
const coupe = { id: 'i2', name: 'Sport coupe', tier: 'tier1', category: 'cars', price_stc: 800, can_buy: 1, can_sell: 1, sell_value_percent: 60 };
const bar = { id: 'i3', name: 'Sports bar', category: 'business', price_stc: 3000, can_buy: 0, can_invest: 1, invest_price_stc: 3000, invest_return_rate: 10, invest_duration_days: 14 };

function resource(data, over = {}) {
  return { data, loading: false, error: null, refreshing: false, refetch: mockRefetch, ...over };
}
const base = (over = {}) => ({
  player: { id: 'p1' }, balance: 2450, items: [apartment, coupe, bar], purchases: [], ...over,
});

describe('Lifestyle screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResource = resource(base());
  });

  test('loading, error with Retry', () => {
    mockResource = resource(undefined, { loading: true });
    const loading = render(<LifestyleScreen />);
    expect(loading.getByTestId('skeleton-list')).toBeTruthy();
    loading.unmount();
    mockResource = resource(undefined, { error: 'Shop down' });
    const failed = render(<LifestyleScreen />);
    fireEvent.press(failed.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
    expect(failed.getByText('Shop down')).toBeTruthy();
  });

  test('shows the balance, the shop cards with real prices and facts', () => {
    const { getByText, getAllByText, getByLabelText } = render(<LifestyleScreen />);
    expect(getByLabelText('Balance 2 450 STC')).toBeTruthy();
    expect(getByText('City apartment')).toBeTruthy();
    expect(getByText('1 200 STC')).toBeTruthy();
    expect(getByText(/Income \+60 STC \/ 7 days/)).toBeTruthy();
    expect(getByText(/upkeep 15 STC \/ week/)).toBeTruthy();
    expect(getByText('TIER2')).toBeTruthy();
    expect(getByText(/Return 10 % after 14 days/)).toBeTruthy();
    expect(getAllByText(/can be sold for 60 %/).length).toBeGreaterThan(0);
  });

  test('filters narrow the shop', () => {
    const { getByText, queryByText } = render(<LifestyleScreen />);
    fireEvent.press(getByText('Invest'));
    expect(getByText('Sports bar')).toBeTruthy();
    expect(queryByText('City apartment')).toBeNull();
    fireEvent.press(getByText('Rent'));
    expect(getByText('City apartment')).toBeTruthy();
    expect(queryByText('Sport coupe')).toBeNull();
  });

  test('buying takes a confirmation, then calls the server and refreshes', async () => {
    mockBuy.mockResolvedValue({ new_stc_balance: 1250 });
    const { getAllByLabelText, getByText, findByText } = render(<LifestyleScreen />);
    fireEvent.press(getAllByLabelText('Buy')[0]);
    expect(getByText('Buy City apartment for 1 200 STC?')).toBeTruthy();
    expect(mockBuy).not.toHaveBeenCalled();
    fireEvent.press(getByText('Confirm'));
    await waitFor(() => expect(mockBuy).toHaveBeenCalledWith('i1'));
    expect(await findByText('Bought City apartment.')).toBeTruthy();
    expect(mockRefetch).toHaveBeenCalled();
  });

  test('cancel leaves nothing bought', () => {
    const { getAllByLabelText, getByText, queryByText } = render(<LifestyleScreen />);
    fireEvent.press(getAllByLabelText('Buy')[0]);
    fireEvent.press(getByText('Cancel'));
    expect(queryByText(/Buy City apartment/)).toBeNull();
    expect(mockBuy).not.toHaveBeenCalled();
  });

  test('renting and investing use their own functions', async () => {
    mockRent.mockResolvedValue({});
    mockInvest.mockResolvedValue({});
    mockResource = resource(base({ balance: 5000 }));
    const { getAllByLabelText, getByText, findByText } = render(<LifestyleScreen />);
    // the apartment is the only item offered for rent
    fireEvent.press(getAllByLabelText('Rent').find((n) => n.props.accessibilityRole === 'button'));
    expect(getByText('Rent City apartment for 150 STC?')).toBeTruthy();
    fireEvent.press(getByText('Confirm'));
    await waitFor(() => expect(mockRent).toHaveBeenCalledWith('i1'));
    expect(await findByText('Rented City apartment.')).toBeTruthy();

    const investButtons = getAllByLabelText('Invest').filter((n) => n.props.accessibilityRole === 'button');
    fireEvent.press(investButtons[investButtons.length - 1]);
    expect(getByText('Invest 3 000 STC in Sports bar?')).toBeTruthy();
    fireEvent.press(getByText('Confirm'));
    await waitFor(() => expect(mockInvest).toHaveBeenCalledWith('i3'));
  });

  test('not enough STC: no call, and Get STC leads to the Store', () => {
    mockResource = resource(base({ balance: 100 }));
    const { getAllByLabelText, getAllByText, getByText } = render(<LifestyleScreen />);
    fireEvent.press(getAllByLabelText('Buy')[1]);
    expect(getAllByText('Not enough STC for this.')).toHaveLength(1);
    fireEvent.press(getByText('Get STC'));
    expect(mockPush).toHaveBeenCalledWith('/apps/store');
    expect(mockBuy).not.toHaveBeenCalled();
  });

  test('a server refusal is shown on the card', async () => {
    mockBuy.mockRejectedValue(new Error('Insufficient STC'));
    const { getAllByLabelText, getByText, findByText } = render(<LifestyleScreen />);
    fireEvent.press(getAllByLabelText('Buy')[0]);
    fireEvent.press(getByText('Confirm'));
    expect(await findByText('Insufficient STC')).toBeTruthy();
  });

  test('passive income ready: collect calls the function and reports the amount', async () => {
    mockCollect.mockResolvedValue({ collected: 60 });
    mockResource = resource(base({
      purchases: [{ id: 'a', item_id: 'i1', item_name: 'City apartment', purchase_type: 'buy', status: 'active', price_paid_stc: 1200, created_date: iso(-10) }],
    }));
    const { getByText, getByLabelText, findByText } = render(<LifestyleScreen />);
    expect(getByText('Passive income ready')).toBeTruthy();
    expect(getByText('From 1 asset · +60 STC')).toBeTruthy();
    fireEvent.press(getByLabelText('Collect'));
    await waitFor(() => expect(mockCollect).toHaveBeenCalled());
    expect(await findByText('Collected 60 STC.')).toBeTruthy();
  });

  test('passive income not ready shows a countdown instead of the button', () => {
    mockResource = resource(base({
      purchases: [{ id: 'a', item_id: 'i1', purchase_type: 'buy', status: 'active', price_paid_stc: 1200, created_date: iso(-10), last_passive_collected: iso(-2) }],
    }));
    const { getByText, queryByText } = render(<LifestyleScreen />);
    expect(getByText(/Next passive income in 5d/)).toBeTruthy();
    expect(queryByText('Passive income ready')).toBeNull();
  });

  test('my assets: owned, rented and invested, with sell and collect rules', async () => {
    mockSell.mockResolvedValue({});
    mockCollectInvest.mockResolvedValue({});
    mockResource = resource(base({
      purchases: [
        { id: 'a', item_id: 'i1', item_name: 'City apartment', purchase_type: 'buy', status: 'active', price_paid_stc: 1200, created_date: iso(-1), last_passive_collected: iso(-1) },
        { id: 'b', item_id: 'i1', item_name: 'City apartment', purchase_type: 'rent', status: 'active', price_paid_stc: 150, rent_end_date: iso(10) },
        { id: 'c', item_id: 'i3', item_name: 'Sports bar', purchase_type: 'invest', status: 'active', price_paid_stc: 3000, invest_return_amount: 300, invest_end_date: iso(-1) },
      ],
    }));
    const { getByText, getAllByText, getByLabelText, findByText, queryByText } = render(<LifestyleScreen />);
    fireEvent.press(getByText('My assets · 3'));
    expect(getByText('OWNED')).toBeTruthy();
    expect(getByText('RENTED')).toBeTruthy();
    expect(getByText('INVESTED')).toBeTruthy();
    // only the owned asset can be sold
    expect(getAllByText('Sell')).toHaveLength(1);
    fireEvent.press(getByText('Sell'));
    expect(getByText('Sell City apartment for 720 STC?')).toBeTruthy();
    fireEvent.press(getByText('Confirm'));
    await waitFor(() => expect(mockSell).toHaveBeenCalledWith('a'));
    expect(await findByText('Sold City apartment for 720 STC.')).toBeTruthy();

    fireEvent.press(getByLabelText('Collect 3 300 STC'));
    await waitFor(() => expect(mockCollectInvest).toHaveBeenCalledWith('c'));
    expect(queryByText('Sell City apartment for 720 STC?')).toBeNull();
  });

  test('an investment that has not matured has no collect button', () => {
    mockResource = resource(base({
      purchases: [{ id: 'c', item_id: 'i3', item_name: 'Sports bar', purchase_type: 'invest', status: 'active', price_paid_stc: 3000, invest_return_amount: 300, invest_end_date: iso(5) }],
    }));
    const { getByText, queryByLabelText } = render(<LifestyleScreen />);
    fireEvent.press(getByText('My assets · 1'));
    expect(queryByLabelText(/^Collect/)).toBeNull();
    expect(getByText(/Pays 3 300 STC at maturity/)).toBeTruthy();
  });

  test('empty shop, empty assets and no player', () => {
    mockResource = resource(base({ items: [] }));
    const shop = render(<LifestyleScreen />);
    expect(shop.getByText('The shop is empty for now.')).toBeTruthy();
    fireEvent.press(shop.getByText('My assets'));
    expect(shop.getByText('You do not own any asset yet.')).toBeTruthy();
    shop.unmount();
    mockResource = resource(base({ player: null }));
    const none = render(<LifestyleScreen />);
    expect(none.getByText('Create a player profile to use Lifestyle.')).toBeTruthy();
  });

  test('Back leaves the screen', () => {
    const { getByLabelText } = render(<LifestyleScreen />);
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
