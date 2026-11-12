import {
  loadLifestyleScreen,
  shopOffers,
  filterShop,
  passiveIncomeStatus,
  describeAsset,
  buyItem,
  rentItem,
  investInItem,
  sellAsset,
  collectPassiveIncome,
  collectInvestment,
} from '../../lib/lifestyle';

const mockInvoke = jest.fn();
const mockItemFilter = jest.fn();
const mockPurchaseFilter = jest.fn();
const mockResolve = jest.fn();
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: (...a) => mockResolve(...a),
  stageClient: {
    functions: { invoke: (...a) => mockInvoke(...a) },
    entities: {
      LifestyleItem: { filter: (...a) => mockItemFilter(...a) },
      LifestylePurchase: { filter: (...a) => mockPurchaseFilter(...a) },
    },
  },
}));

const DAY = 86400000;
const NOW = Date.parse('2026-11-11T12:00:00Z');
const ago = (days) => new Date(NOW - days * DAY).toISOString();

const apartment = {
  id: 'i1', name: 'City apartment', tier: 'tier2', category: 'real_estate', price_stc: 1200,
  can_buy: 1, can_rent: 1, rent_price_stc: 150, rent_duration_days: 30, can_invest: 0,
  passive_income_stc: 60, passive_income_interval_days: 7, weekly_maintenance_stc: 15, can_sell: 1, sell_value_percent: 60,
};
const coupe = { id: 'i2', name: 'Sport coupe', tier: 'tier1', category: 'cars', price_stc: 800, can_buy: 1, can_sell: 1, sell_value_percent: 60 };
const bar = { id: 'i3', name: 'Sports bar', category: 'business', price_stc: 3000, can_buy: 0, can_invest: 1, invest_price_stc: 3000, invest_return_rate: 10, invest_duration_days: 14 };

describe('loadLifestyleScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  test('items, my active purchases (sold and collected hidden) and the wallet balance', async () => {
    mockResolve.mockResolvedValue({ player: { id: 'p1', stc: 10 } });
    mockItemFilter.mockResolvedValue([apartment, coupe]);
    mockPurchaseFilter.mockResolvedValue([
      { id: 'a', status: 'active' }, { id: 'b', status: 'sold' }, { id: 'c', status: 'collected' },
    ]);
    mockInvoke.mockResolvedValue({ success: true, data: { balance: 2450 } });
    const data = await loadLifestyleScreen();
    expect(mockItemFilter).toHaveBeenCalledWith({ is_active: true }, 'sort_order', 200);
    expect(mockPurchaseFilter).toHaveBeenCalledWith({ player_id: 'p1' }, '-created_date', 500);
    expect(mockInvoke).toHaveBeenCalledWith('playerWallet', { action: 'get_balance' });
    expect(data.items).toHaveLength(2);
    expect(data.purchases.map((p) => p.id)).toEqual(['a']);
    expect(data.balance).toBe(2450);
  });

  test('balance falls back to the player record, then null; no player means no purchases', async () => {
    mockResolve.mockResolvedValue({ player: { id: 'p1', stc: 90 } });
    mockItemFilter.mockResolvedValue([]);
    mockPurchaseFilter.mockResolvedValue([]);
    mockInvoke.mockRejectedValue(new Error('x'));
    expect((await loadLifestyleScreen()).balance).toBe(90);

    mockResolve.mockResolvedValue({ player: null });
    const none = await loadLifestyleScreen();
    expect(none.balance).toBeNull();
    expect(none.purchases).toEqual([]);
  });

  test('a failing catalogue is an error, not an empty shop', async () => {
    mockResolve.mockResolvedValue({ player: { id: 'p1' } });
    mockItemFilter.mockRejectedValue(new Error('catalogue down'));
    mockPurchaseFilter.mockResolvedValue([]);
    mockInvoke.mockResolvedValue({ data: { balance: 1 } });
    await expect(loadLifestyleScreen()).rejects.toThrow('catalogue down');
  });
});

describe('shop', () => {
  test('offers per item follow can_* and a real price', () => {
    expect(shopOffers(apartment)).toEqual({ buy: 1200, rent: 150, invest: null });
    expect(shopOffers(coupe)).toEqual({ buy: 800, rent: null, invest: null });
    expect(shopOffers(bar)).toEqual({ buy: null, rent: null, invest: 3000 });
    expect(shopOffers({ id: 'z', can_buy: 1, price_stc: 0 })).toEqual({ buy: null, rent: null, invest: null });
  });

  test('filters', () => {
    const items = [apartment, coupe, bar];
    expect(filterShop(items, 'all').map((i) => i.id)).toEqual(['i1', 'i2', 'i3']);
    expect(filterShop(items, 'buy').map((i) => i.id)).toEqual(['i1', 'i2']);
    expect(filterShop(items, 'rent').map((i) => i.id)).toEqual(['i1']);
    expect(filterShop(items, 'invest').map((i) => i.id)).toEqual(['i3']);
  });
});

describe('passiveIncomeStatus', () => {
  const owned = (over = {}) => ({ id: 'a', item_id: 'i1', purchase_type: 'buy', status: 'active', created_date: ago(10), ...over });

  test('ready when the interval has passed since creation or the last collection', () => {
    const status = passiveIncomeStatus([owned()], [apartment], NOW);
    expect(status).toMatchObject({ hasIncome: true, readyAmount: 60, readyCount: 1 });
  });

  test('not ready: next date is the collect date + interval', () => {
    const last = ago(2);
    const status = passiveIncomeStatus([owned({ last_passive_collected: last })], [apartment], NOW);
    expect(status.readyAmount).toBe(0);
    expect(status.hasIncome).toBe(true);
    expect(status.nextAt.getTime()).toBe(Date.parse(last) + 7 * DAY);
  });

  test('reads either collected-at column name', () => {
    const status = passiveIncomeStatus([owned({ last_passive_collected_at: ago(1) })], [apartment], NOW);
    expect(status.readyAmount).toBe(0);
  });

  test('sums several assets and picks the soonest next date', () => {
    const second = { ...apartment, id: 'i4', passive_income_stc: 120, passive_income_interval_days: 7 };
    const status = passiveIncomeStatus([
      owned(), owned({ id: 'b', item_id: 'i4', created_date: ago(8) }), owned({ id: 'c', last_passive_collected: ago(1) }),
    ], [apartment, second], NOW);
    expect(status).toMatchObject({ readyAmount: 180, readyCount: 2 });
    expect(status.nextAt.getTime()).toBe(Date.parse(ago(1)) + 7 * DAY);
  });

  test('rented, invested, sold and income-less assets do not produce income', () => {
    const status = passiveIncomeStatus([
      owned({ purchase_type: 'rent' }), owned({ id: 'x', purchase_type: 'invest' }),
      owned({ id: 'y', status: 'sold' }), owned({ id: 'z', item_id: 'i2' }),
    ], [apartment, coupe], NOW);
    expect(status).toEqual({ hasIncome: false, readyAmount: 0, readyCount: 0, nextAt: null });
  });
});

describe('describeAsset', () => {
  test('owned asset: sell price from the item percentage', () => {
    const info = describeAsset({ id: 'a', item_id: 'i1', purchase_type: 'buy', status: 'active', price_paid_stc: 1200 }, apartment, NOW);
    expect(info).toMatchObject({ kind: 'owned', canSell: true, sellPercent: 60, sellPrice: 720, matured: false });
  });

  test('cannot sell when the item says so, or when it is not owned', () => {
    expect(describeAsset({ purchase_type: 'buy', price_paid_stc: 100 }, { ...coupe, can_sell: 0 }, NOW).canSell).toBe(false);
    expect(describeAsset({ purchase_type: 'rent', price_paid_stc: 100, rent_end_date: ago(-5) }, apartment, NOW)).toMatchObject({ kind: 'rented', canSell: false });
  });

  test('investment: matured only once its end date passed', () => {
    const early = describeAsset({ purchase_type: 'invest', price_paid_stc: 3000, invest_return_amount: 300, invest_end_date: ago(-3) }, bar, NOW);
    expect(early).toMatchObject({ kind: 'invest', matured: false, payout: 3300 });
    expect(early.endsAt.getTime()).toBe(Date.parse(ago(-3)));
    const late = describeAsset({ purchase_type: 'invest', price_paid_stc: 3000, invest_return_amount: 300, invest_end_date: ago(1) }, bar, NOW);
    expect(late.matured).toBe(true);
  });

  test('a missing catalogue item does not crash', () => {
    expect(describeAsset({ purchase_type: 'buy', price_paid_stc: 100 }, null, NOW)).toMatchObject({ kind: 'owned', canSell: false });
  });
});

describe('actions call the real functions', () => {
  beforeEach(() => { jest.clearAllMocks(); mockInvoke.mockResolvedValue({ success: true, data: { new_stc_balance: 5, collected: 60 } }); });

  test.each([
    [buyItem, 'buyLifestyleItem'],
    [rentItem, 'rentLifestyleItem'],
    [investInItem, 'investInLifestyleItem'],
  ])('%p', async (fn, name) => {
    const data = await fn('i1');
    expect(mockInvoke).toHaveBeenCalledWith(name, { item_id: 'i1' });
    expect(data.new_stc_balance).toBe(5);
  });

  test('sell, collect investment, collect passive income', async () => {
    await sellAsset('a');
    expect(mockInvoke).toHaveBeenLastCalledWith('sellLifestyleAsset', { purchase_id: 'a' });
    await collectInvestment('a');
    expect(mockInvoke).toHaveBeenLastCalledWith('collectInvestmentReturn', { purchase_id: 'a' });
    const passive = await collectPassiveIncome();
    expect(mockInvoke).toHaveBeenLastCalledWith('collectPassiveIncome', {});
    expect(passive.collected).toBe(60);
  });

  test('server errors keep their message', async () => {
    mockInvoke.mockRejectedValue(new Error('Insufficient STC'));
    await expect(buyItem('i1')).rejects.toThrow('Insufficient STC');
  });
});
