import {
  creditPacks, describePlus, formatPlusDate, outcomeNotice, parsePerks, plusPrices,
} from '../../lib/store';

describe('describePlus', () => {
  const config = { stage_plus_monthly_price: '4.99', stage_plus_yearly_price: '49.99', monthly_credits: 150 };

  test('no player: inactive, nothing to cancel', () => {
    expect(describePlus({ player: null, config }).state).toBe('inactive');
  });

  test('free player is inactive', () => {
    expect(describePlus({ player: { id: 'p' }, config }).state).toBe('inactive');
  });

  test('active subscriber renews on the expiry date', () => {
    const info = describePlus({
      player: { id: 'p', subscription: 'stage_plus', subscription_expires_at: '2099-01-01T00:00:00Z', subscription_cancel_at_period_end: 0 },
      config,
    });
    expect(info.state).toBe('active');
    expect(info.renewsAt).toEqual(new Date('2099-01-01T00:00:00Z'));
  });

  test('renewal switched off: ending, same date', () => {
    const info = describePlus({
      player: { id: 'p', subscription: 'stage_plus', subscription_expires_at: '2099-01-01T00:00:00Z', subscription_cancel_at_period_end: 1 },
      config,
    });
    expect(info.state).toBe('ending');
    expect(info.renewsAt).toEqual(new Date('2099-01-01T00:00:00Z'));
  });

  test('an expired subscription is inactive', () => {
    expect(describePlus({
      player: { id: 'p', subscription: 'stage_plus', subscription_expires_at: '2020-01-01T00:00:00Z' },
      config,
    }).state).toBe('inactive');
  });

  test('active without an expiry date has no renewal date', () => {
    const info = describePlus({ player: { id: 'p', subscription: 'stage_plus' }, config });
    expect(info.state).toBe('active');
    expect(info.renewsAt).toBeNull();
  });
});

describe('plusPrices / perks / packs', () => {
  test('prices come from the store config, with the server defaults as fallback', () => {
    expect(plusPrices({ stage_plus_monthly_price: '6.5', stage_plus_yearly_price: 60 })).toEqual({ monthly: 6.5, yearly: 60 });
    expect(plusPrices(null)).toEqual({ monthly: 4.99, yearly: 49.99 });
  });

  test('perks accept an array or a JSON string and drop blanks', () => {
    expect(parsePerks({ perks: ['A', ' ', 'B'] })).toEqual(['A', 'B']);
    expect(parsePerks({ perks: '["X","Y"]' })).toEqual(['X', 'Y']);
    expect(parsePerks({ perks: 'not json' })).toEqual([]);
    expect(parsePerks(null)).toEqual([]);
  });

  test('the packs are the server packs', () => {
    expect(creditPacks().map((p) => p.id)).toEqual(['credits_entry', 'credits_starter', 'credits_competitor', 'credits_club']);
  });

  test('formatPlusDate follows the language', () => {
    expect(formatPlusDate('2099-01-01T12:00:00Z', 'en')).toBe('1 January 2099');
    expect(formatPlusDate('2099-01-01T12:00:00Z', 'fr')).toBe('1 janvier 2099');
    expect(formatPlusDate(null, 'en')).toBe('');
  });
});

describe('outcomeNotice', () => {
  test('subscription activated', () => {
    expect(outcomeNotice({ status: 'activated' }, 'plus')).toEqual({ tone: 'success', key: 'plusActivated', params: {} });
  });

  test('credits added uses the server amount, then the pack amount', () => {
    expect(outcomeNotice({ status: 'activated', data: { credits_added: 100 } }, 'pack', { credits: 50 }).params).toEqual({ credits: 100 });
    expect(outcomeNotice({ status: 'activated' }, 'pack', { credits: 50 }).params).toEqual({ credits: 50 });
    expect(outcomeNotice({ status: 'activated' }, 'pack', { credits: 50 }).key).toBe('creditsAdded');
    expect(outcomeNotice({ status: 'activated' }, 'pack').key).toBe('creditsAddedGeneric');
  });

  test('cancelled is neutral, not an error', () => {
    expect(outcomeNotice({ status: 'cancelled' }, 'plus')).toEqual({ tone: 'neutral', key: 'paymentCancelled', params: {} });
  });

  test('anything else is pending', () => {
    expect(outcomeNotice({ status: 'pending' }, 'plus')).toEqual({ tone: 'pending', key: 'paymentPending', params: {} });
    expect(outcomeNotice(undefined, 'pack').tone).toBe('pending');
  });
});
