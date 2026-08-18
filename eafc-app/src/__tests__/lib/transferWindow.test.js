import { isTransferWindowOpen } from '../../lib/transferWindow';

describe('isTransferWindowOpen', () => {
  it('is closed without a window row', () => {
    expect(isTransferWindowOpen(null)).toBe(false);
    expect(isTransferWindowOpen({ status: 'closed' })).toBe(false);
  });

  it('is open when status is open and there is no end date', () => {
    expect(isTransferWindowOpen({ status: 'open' })).toBe(true);
  });

  it('stays open through a future end date', () => {
    const end = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(isTransferWindowOpen({ status: 'OPEN', end_date: end })).toBe(true);
  });

  it('closes after the end date has passed', () => {
    const end = new Date(Date.now() - 60 * 1000).toISOString();
    expect(isTransferWindowOpen({ status: 'open', end_date: end })).toBe(false);
  });
});
